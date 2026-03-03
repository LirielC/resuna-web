import { Resume, ATSAnalysisRequest, ATSAnalysisResult, CritiqueResponse, CoverLetter } from './types';
import { auth } from './firebase';
import { localResumeStorage, localCoverLetterStorage } from './storage';

const API_BASE_URL = (() => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    if (
        process.env.NODE_ENV === 'production' &&
        url.startsWith('http://') &&
        !url.startsWith('http://localhost')
    ) {
        throw new Error(
            `[Security] NEXT_PUBLIC_API_URL must use HTTPS in production. Got: ${url}`
        );
    }
    return url;
})();

interface ApiErrorPayload {
    errorCode?: string;
    message?: string;
    error?: string;
    retryable?: boolean;
}

export class ApiRequestError extends Error {
    status: number;
    errorCode?: string;
    retryable: boolean;

    constructor(message: string, status: number, errorCode?: string, retryable = false) {
        super(message);
        this.name = 'ApiRequestError';
        this.status = status;
        this.errorCode = errorCode;
        this.retryable = retryable;
    }
}

// Get auth token from Firebase
async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
        return null;
    }
    try {
        return await user.getIdToken();
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error getting auth token:', error);
        }
        return null;
    }
}

async function getClientFingerprint(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const storageKey = 'resuna_fp';
    const timestampKey = 'resuna_fp_ts';
    const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    const existing = window.localStorage.getItem(storageKey);
    const timestamp = window.localStorage.getItem(timestampKey);

    // Return existing fingerprint if it's still valid
    if (existing && timestamp && Date.now() - Number(timestamp) < TTL_MS) {
        return existing;
    }

    const raw = [
        navigator.userAgent,
        navigator.language,
        `${screen.width}x${screen.height}`,
        String(new Date().getTimezoneOffset()),
    ].join('|');

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(raw);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashBase64 = btoa(String.fromCharCode(...hashArray))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        window.localStorage.setItem(storageKey, hashBase64);
        window.localStorage.setItem(timestampKey, String(Date.now()));
        return hashBase64;
    } catch {
        const fallback = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        window.localStorage.setItem(storageKey, fallback);
        window.localStorage.setItem(timestampKey, String(Date.now()));
        return fallback;
    }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await getAuthToken();
    const fingerprint = await getClientFingerprint();

    if (!token) {
        throw new Error('Not authenticated. Please sign in.');
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(fingerprint ? { 'X-Client-Fingerprint': fingerprint } : {}),
            ...options.headers,
        },
    });

    if (response.status === 401) {
        throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
        const text = await response.text();
        try {
            const json = JSON.parse(text) as ApiErrorPayload & { status?: number; error?: string };
            throw new ApiRequestError(
                json.message || json.error || `HTTP ${response.status}`,
                response.status,
                json.errorCode,
                Boolean(json.retryable),
            );
        } catch (parseErr) {
            if (parseErr instanceof ApiRequestError) throw parseErr;
            throw new ApiRequestError(text || `HTTP ${response.status}`, response.status);
        }
    }

    return response;
}

// Resume API — backed by localStorage; export/AI operations POST data to backend
export const resumeApi = {
    async getAll(): Promise<Resume[]> {
        return localResumeStorage.getAll();
    },

    async getById(id: string): Promise<Resume> {
        const resume = localResumeStorage.getById(id);
        if (!resume) throw new Error(`Resume ${id} not found`);
        return resume;
    },

    async create(resume: Omit<Resume, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Resume> {
        return localResumeStorage.save(resume);
    },

    async update(id: string, resume: Partial<Resume>): Promise<Resume> {
        const existing = localResumeStorage.getById(id);
        if (!existing) throw new Error(`Resume ${id} not found`);
        return localResumeStorage.save({ ...existing, ...resume, id });
    },

    async delete(id: string): Promise<void> {
        localResumeStorage.delete(id);
    },

    async duplicate(id: string): Promise<Resume> {
        const existing = localResumeStorage.getById(id);
        if (!existing) throw new Error(`Resume ${id} not found`);
        const copy = { ...existing, id: undefined, title: `${existing.title} (cópia)`, createdAt: undefined, updatedAt: undefined };
        return localResumeStorage.save(copy);
    },

    // Download PDF — sends full resume in POST body
    async downloadPdf(id: string, locale?: string): Promise<Blob> {
        const resume = localResumeStorage.getById(id);
        if (!resume) throw new Error('Resume not found');

        const token = await getAuthToken();
        if (!token) throw new Error('Not authenticated');

        const localeParam = locale ? `?locale=${locale}` : '';
        const response = await fetch(`${API_BASE_URL}/api/resumes/export/pdf${localeParam}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(resume),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to download PDF: ${response.status} - ${errorText}`);
        }

        return response.blob();
    },

    // Download DOCX — sends full resume in POST body
    async downloadDocx(id: string): Promise<Blob> {
        const resume = localResumeStorage.getById(id);
        if (!resume) throw new Error('Resume not found');

        const token = await getAuthToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE_URL}/api/resumes/export/docx`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(resume),
        });

        if (!response.ok) {
            throw new Error('Failed to download DOCX');
        }

        return response.blob();
    },

    // Translate resume to English — sends full resume in POST body, saves result to localStorage
    async translateToEnglish(resumeId: string): Promise<Resume> {
        const resume = localResumeStorage.getById(resumeId);
        if (!resume) throw new Error('Resume not found');

        const token = await getAuthToken();
        if (!token) throw new Error('Not authenticated. Please sign in.');

        const response = await fetch(`${API_BASE_URL}/api/resumes/export/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(resume),
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type') || '';
            let payload: ApiErrorPayload | null = null;
            let fallbackMessage = 'Falha ao traduzir currículo. Tente novamente.';

            if (contentType.includes('application/json')) {
                try {
                    payload = await response.json();
                } catch {
                    payload = null;
                }
            } else {
                const text = await response.text();
                if (text && text.trim()) {
                    fallbackMessage = text.trim();
                }
            }

            throw new ApiRequestError(
                payload?.message || payload?.error || fallbackMessage,
                response.status,
                payload?.errorCode,
                Boolean(payload?.retryable),
            );
        }

        const translatedResume: Resume = await response.json();
        // Save the translated resume as a new entry in localStorage
        const saved = localResumeStorage.save({ ...translatedResume, id: undefined });
        return saved;
    },

    // Import resume from PDF
    async importFromPdf(file: File): Promise<{
        name: string;
        email: string;
        phone: string;
        linkedin: string;
        github: string;
        summary: string;
        experience: string;
        education: string;
        projects: string;
        certifications: string;
        awards: string;
        skills: string[];
        rawText: string;
    }> {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/resumes/import-pdf`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to import PDF');
        }

        return response.json();
    },
};

// ATS Analysis API
export const atsApi = {
    async analyzePdf(file: File, jobDescription: string, language?: string, jobTitle?: string, company?: string): Promise<ATSAnalysisResult> {
        const token = await getAuthToken();
        const fingerprint = await getClientFingerprint();
        if (!token) {
            throw new Error('Not authenticated. Please sign in.');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('jobDescription', jobDescription);
        formData.append('language', language || 'pt-BR');
        if (jobTitle) formData.append('jobTitle', jobTitle);
        if (company) formData.append('company', company);

        const response = await fetch(`${API_BASE_URL}/api/ats/analyze-pdf`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...(fingerprint ? { 'X-Client-Fingerprint': fingerprint } : {}),
            },
            body: formData,
        });

        if (response.status === 401) {
            throw new Error('Session expired. Please sign in again.');
        }

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `HTTP ${response.status}`);
        }

        return response.json();
    },

    async analyze(request: ATSAnalysisRequest): Promise<ATSAnalysisResult> {
        const resume = localResumeStorage.getById(request.resumeId);
        const response = await fetchWithAuth('/api/ats/analyze', {
            method: 'POST',
            body: JSON.stringify({ ...request, resume: resume ?? undefined }),
        });
        return response.json();
    },

    async getAll(): Promise<ATSAnalysisResult[]> {
        const response = await fetchWithAuth('/api/ats/analyses');
        return response.json();
    },

    async getScore(resumeId: string): Promise<{ score: number; matchedKeywords: number; totalKeywords: number }> {
        const response = await fetchWithAuth(`/api/ats/score/${resumeId}`);
        return response.json();
    },

    async delete(id: string): Promise<void> {
        await fetchWithAuth(`/api/ats/analyses/${id}`, {
            method: 'DELETE',
        });
    },

    async extractKeywords(jobDescription: string): Promise<{ keywords: Record<string, string[]>; total: number }> {
        const response = await fetchWithAuth('/api/ats/extract-keywords', {
            method: 'POST',
            body: JSON.stringify({ jobDescription }),
        });
        return response.json();
    },
};

// Auth API
export const authApi = {
    async getCurrentUser(): Promise<{ uid: string; email: string; name: string; picture: string }> {
        const response = await fetchWithAuth('/api/auth/me');
        return response.json();
    },
};

// User API
export const userApi = {
    async getStats(): Promise<{ resumeCount: number; avgAtsScore: number; memberSince: string; planName: string }> {
        const response = await fetchWithAuth('/api/users/stats');
        return response.json();
    },
};

// Subscription API
export const subscriptionApi = {
    async getCredits(): Promise<{ creditsRemaining: number; creditsUsed: number }> {
        const response = await fetchWithAuth('/api/subscription/credits');
        return response.json();
    },
};

// AI API
export interface RefineRequest {
    resumeId: string;
    targetRole?: string;
    targetIndustry?: string;
    tone?: 'professional' | 'creative' | 'technical';
    captchaToken?: string;
}

export interface RefineResponse {
    originalBullets: string[];
    refinedBullets: string[];
    improvements: string[];
}

export interface TranslateRequest {
    resumeId: string;
    targetLanguage: string;
    newResumeName?: string;
    captchaToken?: string;
}

export interface CoverLetterRequest {
    resumeId: string;
    jobDescription: string;
    companyName: string;
    targetRole: string;
    tone?: 'professional' | 'enthusiastic' | 'formal';
    captchaToken?: string;
    applicantName?: string;
    existingContent?: string;
}

export const aiApi = {
    // Critique a resume (strengths, weaknesses, quick wins)
    async critiqueResume(resumeId: string, locale?: string, captchaToken?: string): Promise<CritiqueResponse> {
        const resume = localResumeStorage.getById(resumeId);
        if (!resume) throw new Error('Resume not found');

        const response = await fetchWithAuth('/api/ai/critique', {
            method: 'POST',
            body: JSON.stringify({ resume, language: locale || 'pt-BR', captchaToken }),
        });
        return response.json();
    },

    // Refine resume bullets with AI
    async refineBullets(request: RefineRequest): Promise<RefineResponse> {
        const resume = localResumeStorage.getById(request.resumeId);
        if (!resume) throw new Error('Resume not found');

        const response = await fetchWithAuth('/api/ai/refine', {
            method: 'POST',
            body: JSON.stringify({ ...request, resume }),
        });
        return response.json();
    },

    // Translate resume to another language, saves result to localStorage
    async translateResume(request: TranslateRequest): Promise<{
        translatedResumeId: string;
        targetLanguage: string;
        creditsUsed: number;
        message: string;
    }> {
        const resume = localResumeStorage.getById(request.resumeId);
        if (!resume) throw new Error('Resume not found');

        const response = await fetchWithAuth('/api/ai/translate', {
            method: 'POST',
            body: JSON.stringify({ ...request, resume }),
        });

        const data = await response.json();

        // If the backend returns a translated resume object, save it
        if (data.translatedResume) {
            const saved = localResumeStorage.save({ ...data.translatedResume, id: undefined });
            return { ...data, translatedResumeId: saved.id! };
        }

        return data;
    },

    // Generate cover letter
    async generateCoverLetter(request: CoverLetterRequest): Promise<{ coverLetter: string }> {
        const resume = localResumeStorage.getById(request.resumeId);
        if (!resume) throw new Error('Resume not found');

        const response = await fetchWithAuth('/api/ai/cover-letter', {
            method: 'POST',
            body: JSON.stringify({ ...request, resume }),
        });
        return response.json();
    },

    // Get AI usage stats
    async getUsage(): Promise<{ used: number; limit: number; remaining: number }> {
        const response = await fetchWithAuth('/api/ai/usage');
        return response.json();
    },
};

// Cover Letter API — backed by localStorage
export const coverLetterApi = {
    async create(data: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'>): Promise<CoverLetter> {
        return localCoverLetterStorage.save(data);
    },

    async update(id: string, content: string): Promise<void> {
        localCoverLetterStorage.update(id, content);
    },

    async getByResume(resumeId: string): Promise<CoverLetter[]> {
        return localCoverLetterStorage.getByResume(resumeId);
    },

    async getAll(_userId: string): Promise<CoverLetter[]> {
        return localCoverLetterStorage.getAll();
    },

    async delete(id: string): Promise<void> {
        localCoverLetterStorage.delete(id);
    },
};

// Helper to trigger file download
export function triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
