// Resume Types
export interface Resume {
    id?: string;
    userId?: string;
    title: string;
    personalInfo: PersonalInfo;
    summary?: string;
    experience?: Experience[];
    projects?: Project[];
    education?: Education[];
    skills?: string[];
    certifications?: Certification[];
    languages?: Language[];
    createdAt?: string;
    updatedAt?: string;
}

export interface PersonalInfo {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
}

export interface Experience {
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    bullets?: string[];
}

export interface Project {
    name: string;
    description?: string;
    technologies?: string[];
    url?: string;
    startDate?: string;
    endDate?: string;
    bullets?: string[];
}

export interface Education {
    degree: string;
    institution: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
}

export interface Certification {
    name: string;
    issuer?: string;
    date?: string;
    url?: string;
}

export interface Language {
    name: string;
    level: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
}

// ATS Analysis Types
export interface ATSAnalysisRequest {
    resumeId: string;
    jobTitle?: string;
    company?: string;
    jobDescription: string;
}

export interface ATSAnalysisResult {
    id: string;
    userId: string;
    resumeId: string;
    jobTitle?: string;
    company?: string;
    score: number;
    scoreBreakdown: ScoreBreakdown;
    formatCompliance: FormatCompliance;
    matches: Match[];
    gaps: Gap[];
    recommendations: string[];
    createdAt: string;
}

export interface ScoreBreakdown {
    keywordMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    formatScore: number;
}

export interface FormatCompliance {
    score: number;
    atsReadable: boolean;
    issues: FormatIssue[];
}

export interface FormatIssue {
    type: string;
    severity: 'critical' | 'warning' | 'info';
    description: string;
    location: string;
    example?: string;
    penalty: number;
}

export interface Match {
    keyword: string;
    category: string;
    frequency: number;
}

export interface Gap {
    keyword: string;
    category: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    suggestion: string;
}

// Cover Letter Types
export interface CoverLetter {
    id?: string;
    userId: string;
    resumeId: string;
    jobTitle: string;
    company: string;
    hiringManager?: string;
    jobDescription: string;
    tone: 'professional' | 'enthusiastic' | 'formal';
    content: string;
    createdAt?: string;
    updatedAt?: string;
}

// AI Critique Types
export interface CritiqueItem {
    section: string;
    issue: string;
    suggestion: string;
    severity: 'critical' | 'important' | 'minor';
}

export interface CritiqueResponse {
    overallScore: number;
    overallVerdict: string;
    strengths: string[];
    weaknesses: CritiqueItem[];
    quickWins: string[];
    creditsUsed: number;
}

