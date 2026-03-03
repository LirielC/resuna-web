import type { Resume } from './types';

export interface CompletenessResult {
    score: number;
    missingFields: string[];
}

interface CompletenessCheck {
    label: string;
    points: number;
    fn: (r: Resume) => boolean;
}

const CHECKS: CompletenessCheck[] = [
    { label: 'Nome completo',              points: 10, fn: r => !!r.personalInfo?.fullName?.trim() },
    { label: 'E-mail',                     points: 8,  fn: r => !!r.personalInfo?.email?.trim() },
    { label: 'Telefone',                   points: 5,  fn: r => !!r.personalInfo?.phone?.trim() },
    { label: 'Localização',               points: 5,  fn: r => !!r.personalInfo?.location?.trim() },
    { label: 'LinkedIn',                   points: 7,  fn: r => !!r.personalInfo?.linkedin?.trim() },
    { label: 'GitHub',                     points: 5,  fn: r => !!r.personalInfo?.github?.trim() },
    { label: 'Resumo profissional',        points: 15, fn: r => (r.summary?.trim().length ?? 0) >= 50 },
    { label: 'Experiência (com bullets)',  points: 15, fn: r =>
        (r.experience?.length ?? 0) >= 1 &&
        (r.experience![0].bullets?.filter(b => b.trim()).length ?? 0) >= 1
    },
    { label: 'Formação acadêmica',        points: 10, fn: r => (r.education?.length ?? 0) >= 1 },
    { label: 'Habilidades (mín. 3)',      points: 10, fn: r => (r.skills?.filter(s => s.trim()).length ?? 0) >= 3 },
    { label: 'Projetos',                   points: 5,  fn: r => (r.projects?.length ?? 0) >= 1 },
    { label: 'Certificações ou idiomas',  points: 5,  fn: r =>
        (r.certifications?.length ?? 0) >= 1 || (r.languages?.length ?? 0) >= 1
    },
];

export function computeCompleteness(resume: Resume): CompletenessResult {
    let score = 0;
    const missingFields: string[] = [];
    for (const check of CHECKS) {
        if (check.fn(resume)) {
            score += check.points;
        } else {
            missingFields.push(check.label);
        }
    }
    return { score, missingFields };
}
