import type { Resume, CoverLetter } from './types';

const RESUMES_KEY = 'resuna_resumes';
const COVER_LETTERS_KEY = 'resuna_cover_letters';

function readJson<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
        return [];
    }
}

function writeJson<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(data));
}

function isValidResumeShape(obj: unknown): obj is Resume {
    if (!obj || typeof obj !== 'object') return false;
    const r = obj as Record<string, unknown>;
    if (typeof r.id !== 'string' || r.id.length === 0) return false;
    if (typeof r.title !== 'string') return false;
    if (r.title.length > 500) return false;
    return true;
}

export const localResumeStorage = {
    getAll(): Resume[] {
        return readJson<Resume>(RESUMES_KEY);
    },

    getById(id: string): Resume | null {
        return this.getAll().find((r) => r.id === id) ?? null;
    },

    save(resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Resume {
        const all = this.getAll();
        const now = new Date().toISOString();

        if (resume.id) {
            const idx = all.findIndex((r) => r.id === resume.id);
            const updated: Resume = { ...resume, updatedAt: now } as Resume;
            if (idx >= 0) {
                all[idx] = updated;
            } else {
                all.push(updated);
            }
            writeJson(RESUMES_KEY, all);
            return updated;
        }

        const created: Resume = {
            ...resume,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        } as Resume;
        all.push(created);
        writeJson(RESUMES_KEY, all);
        return created;
    },

    delete(id: string): void {
        writeJson(RESUMES_KEY, this.getAll().filter((r) => r.id !== id));
    },

    exportJson(): string {
        return JSON.stringify(this.getAll(), null, 2);
    },

    importJson(json: string): { imported: number; skipped: number } {
        let incoming: Resume[];
        try {
            incoming = JSON.parse(json);
            if (!Array.isArray(incoming)) throw new Error('not array');
        } catch {
            throw new Error('Invalid JSON format');
        }

        const existing = this.getAll();
        const existingIds = new Set(existing.map((r) => r.id));
        let imported = 0;
        let skipped = 0;

        for (const r of incoming) {
            if (!r.id || existingIds.has(r.id) || !isValidResumeShape(r)) {
                skipped++;
                continue;
            }
            existing.push(r);
            existingIds.add(r.id);
            imported++;
        }

        writeJson(RESUMES_KEY, existing);
        return { imported, skipped };
    },
};

export const localCoverLetterStorage = {
    getAll(): CoverLetter[] {
        return readJson<CoverLetter>(COVER_LETTERS_KEY);
    },

    getByResume(resumeId: string): CoverLetter[] {
        return this.getAll()
            .filter((c) => c.resumeId === resumeId)
            .sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return db - da;
            });
    },

    save(cl: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): CoverLetter {
        const all = this.getAll();
        const now = new Date().toISOString();

        if (cl.id) {
            const idx = all.findIndex((c) => c.id === cl.id);
            const updated: CoverLetter = { ...cl, updatedAt: now } as CoverLetter;
            if (idx >= 0) {
                all[idx] = updated;
            } else {
                all.push(updated);
            }
            writeJson(COVER_LETTERS_KEY, all);
            return updated;
        }

        const created: CoverLetter = {
            ...cl,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        } as CoverLetter;
        all.push(created);
        writeJson(COVER_LETTERS_KEY, all);
        return created;
    },

    update(id: string, content: string): void {
        const all = this.getAll();
        const idx = all.findIndex((c) => c.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], content, updatedAt: new Date().toISOString() };
            writeJson(COVER_LETTERS_KEY, all);
        }
    },

    delete(id: string): void {
        writeJson(COVER_LETTERS_KEY, this.getAll().filter((c) => c.id !== id));
    },
};
