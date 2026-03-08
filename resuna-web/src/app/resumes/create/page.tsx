"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Check,
    Loader2,
    Plus,
    Trash2,
    Sparkles,
    FileText,
    Eye,
    Globe,
    Github,
    Linkedin,
    Download,
    FileDown,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { ApiRequestError, resumeApi, subscriptionApi, triggerDownload } from "@/lib/api";
import { Toast } from "@/components/ui/Toast";
import { useTranslation } from "@/contexts/LanguageContext";
import type {
    Resume, PersonalInfo, Experience, Education, Project, Certification, Language
} from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
    isValidEmail,
    isValidUrl,
    isValidPhoneBR,
    maskPhoneBR,
    getEmailErrorMessage,
    getUrlErrorMessage,
    getPhoneErrorMessage,
    getDateRangeErrorMessage,
} from "@/lib/validation";

interface SkillGroupEntry { id: string; category: string; text: string; }

const DEFAULT_SKILL_GROUPS: SkillGroupEntry[] = [
    { id: 'linguagens', category: 'Linguagens', text: '' },
    { id: 'frameworks', category: 'Frameworks', text: '' },
    { id: 'cloud', category: 'Cloud', text: '' },
    { id: 'banco-dados', category: 'Banco de Dados', text: '' },
    { id: 'devops', category: 'DevOps', text: '' },
    { id: 'ferramentas', category: 'Ferramentas', text: '' },
    { id: 'metodologias', category: 'Metodologias', text: '' },
];
const DEFAULT_COUNT = DEFAULT_SKILL_GROUPS.length;

export default function CreateResumePage() {
    const { t } = useTranslation();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
        fullName: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "",
    });
    const [summary, setSummary] = useState("");
    const [experiences, setExperiences] = useState<Experience[]>([
        { title: "", company: "", startDate: "", endDate: "", bullets: [""] },
    ]);
    const [educations, setEducations] = useState<Education[]>([
        { degree: "", institution: "", graduationDate: "" },
    ]);
    const [projects, setProjects] = useState<Project[]>([
        { name: "", description: "", technologies: [], bullets: [""] },
    ]);
    const [techInputs, setTechInputs] = useState<string[]>([""]);
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState("");
    const [skillMode, setSkillMode] = useState<'flat' | 'grouped'>('grouped');
    const [skillGroups, setSkillGroups] = useState<SkillGroupEntry[]>(DEFAULT_SKILL_GROUPS);
    const [certifications, setCertifications] = useState<Certification[]>([
        { name: "", issuer: "", date: "" },
    ]);
    const [languages, setLanguages] = useState<Language[]>([
        { name: "", level: "intermediate" },
    ]);
    const [translateToEnglish, setTranslateToEnglish] = useState(false);
    const [translatedResume, setTranslatedResume] = useState<Resume | null>(null);
    const [createdResume, setCreatedResume] = useState<Resume | null>(null);
    const [translationRetryable, setTranslationRetryable] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [downloadingDocx, setDownloadingDocx] = useState(false);

    // Validation errors
    const [validationErrors, setValidationErrors] = useState<{
        email?: string;
        phone?: string;
        linkedin?: string;
        github?: string;
        website?: string;
        experiences?: { [key: number]: { startDate?: string; endDate?: string } };
        projects?: { [key: number]: { startDate?: string; endDate?: string } };
    }>({});

    useEffect(() => {
        subscriptionApi.getCredits()
            .then(c => setCreditsRemaining(c.creditsRemaining))
            .catch(() => {});
    }, []);

    // Progress
    const progress = (() => {
        const checks = [
            !!(personalInfo.fullName?.trim() && personalInfo.email?.trim()),
            !!(personalInfo.phone?.trim() || personalInfo.location?.trim()),
            !!(summary?.trim() && summary.length >= 50),
            educations.some(e => e.degree?.trim() && e.institution?.trim()),
            skills.length > 0 || skillGroups.some(g => g.text.trim().length > 0),
            experiences.some(e => e.title?.trim() && e.company?.trim()),
        ];
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    })();

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const addExperience = () => setExperiences(p => [...p, { title: "", company: "", startDate: "", endDate: "", bullets: [""] }]);
    const removeExperience = (i: number) => setExperiences(p => p.filter((_, idx) => idx !== i));
    const updateExperience = (i: number, field: keyof Experience, value: string | string[] | boolean) =>
        setExperiences(p => { const u = [...p]; u[i] = { ...u[i], [field]: value }; return u; });

    const addEducation = () => setEducations(p => [...p, { degree: "", institution: "", graduationDate: "" }]);
    const removeEducation = (i: number) => setEducations(p => p.filter((_, idx) => idx !== i));
    const updateEducation = (i: number, field: keyof Education, value: string) =>
        setEducations(p => { const u = [...p]; u[i] = { ...u[i], [field]: value }; return u; });

    const addProject = () => {
        setProjects(p => [...p, { name: "", description: "", technologies: [], bullets: [""] }]);
        setTechInputs(p => [...p, ""]);
    };
    const removeProject = (i: number) => {
        setProjects(p => p.filter((_, idx) => idx !== i));
        setTechInputs(p => p.filter((_, idx) => idx !== i));
    };
    const updateProject = (i: number, field: keyof Project, value: string | string[]) =>
        setProjects(p => { const u = [...p]; u[i] = { ...u[i], [field]: value }; return u; });

    const addSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills(p => [...p, newSkill.trim()]);
            setNewSkill("");
        }
    };
    const removeSkill = (s: string) => setSkills(p => p.filter(sk => sk !== s));

    const addCertification = () => setCertifications(p => [...p, { name: "", issuer: "", date: "" }]);
    const removeCertification = (i: number) => setCertifications(p => p.filter((_, idx) => idx !== i));
    const updateCertification = (i: number, field: keyof Certification, value: string) =>
        setCertifications(p => { const u = [...p]; u[i] = { ...u[i], [field]: value }; return u; });

    const addLanguage = () => setLanguages(p => [...p, { name: "", level: "intermediate" }]);
    const removeLanguage = (i: number) => setLanguages(p => p.filter((_, idx) => idx !== i));
    const updateLanguage = (i: number, field: keyof Language, value: string) =>
        setLanguages(p => { const u = [...p]; u[i] = { ...u[i], [field]: value }; return u; });

    // ─── Validation ─────────────────────────────────────────────────────────────
    const validateEmail = (email: string) =>
        setValidationErrors(p => ({ ...p, email: getEmailErrorMessage(email) || undefined }));
    const validatePhone = (phone: string) =>
        setValidationErrors(p => ({ ...p, phone: getPhoneErrorMessage(phone) || undefined }));
    const validateUrl = (url: string, field: "linkedin" | "github" | "website") =>
        setValidationErrors(p => ({ ...p, [field]: getUrlErrorMessage(url) || undefined }));
    const validateExperienceDates = (idx: number, s: string, e: string) => {
        if (!s || !e) return;
        const err = getDateRangeErrorMessage(s, e);
        setValidationErrors(p => ({ ...p, experiences: { ...p.experiences, [idx]: { ...p.experiences?.[idx], endDate: err || undefined } } }));
    };
    const validateProjectDates = (idx: number, s: string, e: string) => {
        if (!s || !e) return;
        const err = getDateRangeErrorMessage(s, e);
        setValidationErrors(p => ({ ...p, projects: { ...p.projects, [idx]: { ...p.projects?.[idx], endDate: err || undefined } } }));
    };

    const validateAll = (): { valid: boolean; error?: string } => {
        if (!personalInfo.fullName?.trim()) return { valid: false, error: "Nome completo é obrigatório" };
        if (!personalInfo.email?.trim()) return { valid: false, error: "Email é obrigatório" };
        if (!isValidEmail(personalInfo.email)) return { valid: false, error: getEmailErrorMessage(personalInfo.email) ?? "Email inválido" };
        if (personalInfo.phone && !isValidPhoneBR(personalInfo.phone)) return { valid: false, error: getPhoneErrorMessage(personalInfo.phone) ?? "Telefone inválido" };
        if (personalInfo.linkedin && !isValidUrl(personalInfo.linkedin)) return { valid: false, error: "LinkedIn URL inválida" };
        if (personalInfo.website && !isValidUrl(personalInfo.website)) return { valid: false, error: "Website URL inválida" };
        if (!summary?.trim()) return { valid: false, error: "Resumo profissional é obrigatório" };
        if (summary.length < 50) return { valid: false, error: "Resumo deve ter pelo menos 50 caracteres" };
        for (let i = 0; i < experiences.length; i++) {
            const exp = experiences[i];
            if (exp.title?.trim() || exp.company?.trim() || exp.startDate) {
                if (!exp.title?.trim()) return { valid: false, error: `Cargo é obrigatório (Experiência ${i + 1})` };
                if (!exp.company?.trim()) return { valid: false, error: `Empresa é obrigatória (Experiência ${i + 1})` };
                if (!exp.startDate) return { valid: false, error: `Data de início é obrigatória (Experiência ${i + 1})` };
            }
        }
        for (let i = 0; i < projects.length; i++) {
            const proj = projects[i];
            if (proj.name?.trim() || proj.description?.trim()) {
                if (!proj.name?.trim()) return { valid: false, error: `Nome do projeto é obrigatório (Projeto ${i + 1})` };
                if (!proj.description?.trim()) return { valid: false, error: `Descrição do projeto é obrigatória (Projeto ${i + 1})` };
            }
        }
        if (!educations.some(e => e.degree?.trim() && e.institution?.trim()))
            return { valid: false, error: "Adicione pelo menos uma formação acadêmica" };
        const hasSkills = skillMode === 'flat' ? skills.length > 0 : skillGroups.some(g => g.text.trim().length > 0);
        if (!hasSkills) return { valid: false, error: "Adicione pelo menos uma competência" };
        return { valid: true };
    };

    // ─── Submit ──────────────────────────────────────────────────────────────────
    const handleTranslateResume = async (resumeId: string): Promise<Resume | null> => {
        setIsTranslating(true);
        setTranslationRetryable(false);
        setError(null);
        try {
            const translated = await resumeApi.translateToEnglish(resumeId);
            setTranslatedResume(translated);
            setToastMessage("Currículo traduzido com sucesso!");
            return translated;
        } catch (err) {
            if (err instanceof ApiRequestError) {
                setTranslationRetryable(err.retryable);
                setError(err.message || "Não foi possível traduzir o currículo agora. Tente novamente.");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Não foi possível traduzir o currículo agora. Tente novamente.");
            }
            return null;
        } finally {
            setIsTranslating(false);
        }
    };

    const handleDownloadPdf = async () => {
        const resumeId = translatedResume?.id || createdResume?.id;
        if (!resumeId) return;
        setDownloadingPdf(true);
        try {
            const pdfLocale = translatedResume ? 'en' : 'pt-BR';
            const blob = await resumeApi.downloadPdf(resumeId, pdfLocale);
            const filename = translatedResume ? 'resume-english.pdf' : 'curriculo.pdf';
            triggerDownload(blob, filename);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao baixar PDF");
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleDownloadDocx = async () => {
        const resumeId = translatedResume?.id || createdResume?.id;
        if (!resumeId) return;
        setDownloadingDocx(true);
        try {
            const blob = await resumeApi.downloadDocx(resumeId, translatedResume ? 'en' : 'pt-BR');
            triggerDownload(blob, `curriculo.docx`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao baixar DOCX");
        } finally {
            setDownloadingDocx(false);
        }
    };

    const handleSubmit = async () => {
        const validation = validateAll();
        if (!validation.valid) {
            setError(validation.error || "Por favor, corrija os erros antes de continuar");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setTranslationRetryable(false);
        try {
            if (translateToEnglish && createdResume?.id && !translatedResume) {
                const retried = await handleTranslateResume(createdResume.id);
                if (retried) setIsSaved(true);
                return;
            }
            const resume: Omit<Resume, "id" | "userId" | "createdAt" | "updatedAt"> = {
                title: title || `Currículo — ${personalInfo.fullName}`,
                personalInfo,
                summary,
                experience: experiences.filter(e => e.title || e.company),
                projects: projects.filter(p => p.name),
                education: educations.filter(e => e.degree || e.institution),
                skills: skillMode === 'flat' ? skills
                    : skillGroups.flatMap(g =>
                        g.text.split(',').map(s => s.trim()).filter(Boolean)),
                skillGroups: skillMode === 'grouped'
                    ? skillGroups
                        .map(g => ({
                            category: g.category,
                            items: g.text.split(',').map(s => s.trim()).filter(Boolean),
                        }))
                        .filter(g => g.category && g.items.length > 0)
                    : undefined,
                certifications: certifications.filter(c => c.name),
                languages: languages.filter(l => l.name),
            };
            const created = await resumeApi.create(resume);
            setCreatedResume(created);
            if (translateToEnglish) {
                const translated = await handleTranslateResume(created.id!);
                if (translated) setIsSaved(true);
            } else {
                setIsSaved(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao salvar currículo");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Render ──────────────────────────────────────────────────────────────────
    return (
        <ProtectedRoute>
            <div className="bg-[#EAEAE2] min-h-screen font-serif text-stone-900 selection:bg-orange-100 selection:text-orange-900">
                {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
                <Header />

                {/* Two-panel layout */}
                <div className="flex pt-16 lg:pt-20">

                    {/* ─── LEFT: Form ─── */}
                    <main className="flex-1 min-w-0">
                        <div className="max-w-[640px] mx-auto px-6 lg:px-10 py-10 lg:py-14">

                            {/* Nav */}
                            <Link
                                href="/resumes/new"
                                className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-700 text-sm mb-8 transition-colors group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                {t("common.backToSelection")}
                            </Link>

                            {/* Page header */}
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h1 className="font-display text-2xl lg:text-3xl font-semibold text-stone-900 tracking-tight leading-tight">
                                        Novo Currículo
                                    </h1>
                                    <p className="text-stone-400 text-sm mt-1 font-sans">
                                        Preencha no seu ritmo · visualize ao lado
                                    </p>
                                </div>
                                {creditsRemaining !== null && (
                                    <span className="text-xs text-stone-400 font-sans bg-stone-200/70 px-2.5 py-1 rounded-full mt-1">
                                        {creditsRemaining} créditos
                                    </span>
                                )}
                            </div>

                            {/* Progress */}
                            <div className="mt-6 mb-10">
                                <div className="flex items-center justify-between text-[11px] text-stone-400 font-sans mb-2 tracking-wide">
                                    <span>PROGRESSO</span>
                                    <span className={progress === 100 ? "text-green-600" : ""}>{progress}%</span>
                                </div>
                                <div className="h-[2px] bg-stone-300/60 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${progress === 100 ? "bg-green-500" : "bg-orange-500"}`}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded-r font-sans"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Resume title */}
                            <div className="mb-10">
                                <FormField
                                    label="Título do Currículo"
                                    placeholder="ex: Desenvolvedora Sênior — React & Node.js"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    data-testid="create-resume-title"
                                />
                            </div>

                            {/* ── I: Dados Pessoais ─── */}
                            <FormSection number="I" title="Dados Pessoais" tag="obrigatório" required>
                                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
                                    <FormField
                                        label="Nome completo"
                                        placeholder="Maria Silva"
                                        value={personalInfo.fullName}
                                        onChange={e => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                                        required
                                        data-testid="create-full-name"
                                    />
                                    <FormField
                                        label="E-mail profissional"
                                        type="email"
                                        placeholder="maria@empresa.com"
                                        value={personalInfo.email}
                                        onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                                        onBlur={e => validateEmail(e.target.value)}
                                        error={validationErrors.email}
                                        required
                                        data-testid="create-email"
                                    />
                                    <FormField
                                        label="Telefone"
                                        placeholder="(11) 99999-9999"
                                        value={personalInfo.phone || ""}
                                        onChange={e => setPersonalInfo({ ...personalInfo, phone: maskPhoneBR(e.target.value) })}
                                        onBlur={e => validatePhone(e.target.value)}
                                        error={validationErrors.phone}
                                    />
                                    <FormField
                                        label="Localização"
                                        placeholder="São Paulo, SP"
                                        value={personalInfo.location || ""}
                                        onChange={e => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                                    />
                                </div>

                                <div className="mt-7 pt-7 border-t border-stone-100/80 space-y-5">
                                    <p className="text-[10px] text-stone-400 font-sans uppercase tracking-[0.2em]">Presença Digital</p>
                                    <div className="flex items-center gap-3">
                                        <Linkedin className="w-4 h-4 text-stone-400 shrink-0" />
                                        <FormField
                                            placeholder="linkedin.com/in/seu-perfil"
                                            value={personalInfo.linkedin || ""}
                                            onChange={e => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                                            onBlur={e => validateUrl(e.target.value, "linkedin")}
                                            error={validationErrors.linkedin}
                                            headless
                                            className="flex-1"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Github className="w-4 h-4 text-stone-400 shrink-0" />
                                        <FormField
                                            placeholder="github.com/username"
                                            value={personalInfo.github || ""}
                                            onChange={e => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                                            onBlur={e => validateUrl(e.target.value, "github")}
                                            error={validationErrors.github}
                                            headless
                                            className="flex-1"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-stone-400 shrink-0" />
                                        <FormField
                                            placeholder="seusite.com"
                                            value={personalInfo.website || ""}
                                            onChange={e => setPersonalInfo({ ...personalInfo, website: e.target.value })}
                                            onBlur={e => validateUrl(e.target.value, "website")}
                                            error={validationErrors.website}
                                            headless
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </FormSection>

                            {/* ── II: Resumo Profissional ─── */}
                            <FormSection number="II" title="Resumo Profissional" tag="obrigatório" required>
                                <FormTextarea
                                    placeholder="Escreva 2–3 frases sobre sua trajetória, especialidades e o valor que você entrega para a empresa. Seja direto e específico."
                                    rows={5}
                                    value={summary}
                                    onChange={e => setSummary(e.target.value)}
                                />
                                <p className={`text-[11px] font-sans mt-2 transition-colors ${summary.length >= 50 ? "text-green-600" : "text-stone-400"}`}>
                                    {summary.length} caracteres{summary.length >= 50 ? " ✓ mínimo atingido" : ` · mínimo 50`}
                                </p>
                            </FormSection>

                            {/* ── III: Experiência ─── */}
                            <FormSection number="III" title="Experiência Profissional" tag="opcional">
                                <div className="space-y-10">
                                    {experiences.map((exp, i) => (
                                        <div key={i} className="relative pl-5 border-l-2 border-stone-200 hover:border-orange-300 transition-colors duration-300 group/item">
                                            {experiences.length > 1 && (
                                                <button
                                                    onClick={() => removeExperience(i)}
                                                    className="absolute -left-[18px] top-0 w-7 h-7 rounded-full bg-[#EAEAE2] border border-stone-200 text-stone-300 hover:text-red-400 hover:border-red-200 flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 shadow-sm"
                                                    title="Remover"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-6">
                                                <FormField
                                                    label="Cargo"
                                                    placeholder="Desenvolvedora Sênior"
                                                    value={exp.title}
                                                    onChange={e => updateExperience(i, "title", e.target.value)}
                                                />
                                                <FormField
                                                    label="Empresa"
                                                    placeholder="Empresa XYZ"
                                                    value={exp.company}
                                                    onChange={e => updateExperience(i, "company", e.target.value)}
                                                />
                                                <FormField
                                                    label="Localização"
                                                    placeholder="São Paulo, SP"
                                                    value={exp.location || ""}
                                                    onChange={e => updateExperience(i, "location", e.target.value)}
                                                />
                                                <div className="flex items-end pb-2.5">
                                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={exp.current || false}
                                                            onChange={e => updateExperience(i, "current", e.target.checked)}
                                                            className="w-4 h-4 rounded border-stone-300 text-orange-500 focus:ring-orange-400"
                                                        />
                                                        <span className="text-[10px] font-sans text-stone-500 uppercase tracking-widest">Emprego atual</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-6">
                                                <MonthPicker
                                                    label={t("create.experience.startDate")}
                                                    value={exp.startDate || ""}
                                                    onChange={v => { updateExperience(i, "startDate", v); if (exp.endDate) validateExperienceDates(i, v, exp.endDate); }}
                                                />
                                                <div>
                                                    <MonthPicker
                                                        label={exp.current ? "Término (cargo atual)" : t("create.experience.endDate")}
                                                        value={exp.endDate || ""}
                                                        onChange={v => { updateExperience(i, "endDate", v); if (exp.startDate) validateExperienceDates(i, exp.startDate, v); }}
                                                        disabled={!!exp.current}
                                                    />
                                                    {validationErrors.experiences?.[i]?.endDate && (
                                                        <p className="text-[11px] text-red-500 font-sans mt-1.5">{validationErrors.experiences[i].endDate}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <BulletEditor
                                                label="Principais conquistas"
                                                bullets={exp.bullets || [""]}
                                                onChange={bullets => updateExperience(i, "bullets", bullets)}
                                                placeholder={t("create.experience.achievementsPlaceholder")}
                                            />
                                        </div>
                                    ))}
                                    <AddButton onClick={addExperience} label="Adicionar cargo" />
                                </div>
                            </FormSection>

                            {/* ── IV: Projetos ─── */}
                            <FormSection number="IV" title="Projetos" tag="opcional">
                                <div className="space-y-10">
                                    {projects.map((proj, i) => (
                                        <div key={i} className="relative pl-5 border-l-2 border-stone-200 hover:border-orange-300 transition-colors duration-300 group/item">
                                            {projects.length > 1 && (
                                                <button
                                                    onClick={() => removeProject(i)}
                                                    className="absolute -left-[18px] top-0 w-7 h-7 rounded-full bg-[#EAEAE2] border border-stone-200 text-stone-300 hover:text-red-400 hover:border-red-200 flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 shadow-sm"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                            <div className="space-y-6">
                                                <FormField
                                                    label="Nome do projeto"
                                                    placeholder="Sistema de Gestão XYZ"
                                                    value={proj.name}
                                                    onChange={e => updateProject(i, "name", e.target.value)}
                                                />
                                                <FormTextarea
                                                    label="Descrição"
                                                    placeholder="Breve descrição do projeto e seu impacto..."
                                                    rows={2}
                                                    value={proj.description || ""}
                                                    onChange={e => updateProject(i, "description", e.target.value)}
                                                />
                                                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                                    <FormField
                                                        label="Tecnologias"
                                                        placeholder="React, Node.js, PostgreSQL"
                                                        value={techInputs[i] ?? ""}
                                                        onChange={e => setTechInputs(p => { const n = [...p]; n[i] = e.target.value; return n; })}
                                                        onBlur={e => updateProject(i, "technologies", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                                    />
                                                    <FormField
                                                        label="Link do projeto"
                                                        placeholder="https://github.com/..."
                                                        value={proj.url || ""}
                                                        onChange={e => updateProject(i, "url", e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                                    <MonthPicker
                                                        label={t("create.experience.startDate")}
                                                        value={proj.startDate || ""}
                                                        onChange={v => { updateProject(i, "startDate", v); if (proj.endDate) validateProjectDates(i, v, proj.endDate); }}
                                                    />
                                                    <div>
                                                        <MonthPicker
                                                            label={t("create.experience.endDate")}
                                                            value={proj.endDate || ""}
                                                            onChange={v => { updateProject(i, "endDate", v); if (proj.startDate) validateProjectDates(i, proj.startDate, v); }}
                                                        />
                                                        {validationErrors.projects?.[i]?.endDate && (
                                                            <p className="text-[11px] text-red-500 font-sans mt-1.5">{validationErrors.projects[i].endDate}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <BulletEditor
                                                    label={t("create.projects.highlights")}
                                                    bullets={proj.bullets || [""]}
                                                    onChange={bullets => updateProject(i, "bullets", bullets)}
                                                    placeholder={t("create.projects.highlightsPlaceholder")}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <AddButton onClick={addProject} label="Adicionar projeto" />
                                </div>
                            </FormSection>

                            {/* ── V: Formação ─── */}
                            <FormSection number="V" title="Formação Acadêmica" tag="obrigatório" required>
                                <div className="space-y-10">
                                    {educations.map((edu, i) => (
                                        <div key={i} className="relative pl-5 border-l-2 border-stone-200 hover:border-orange-300 transition-colors duration-300 group/item">
                                            {educations.length > 1 && (
                                                <button
                                                    onClick={() => removeEducation(i)}
                                                    className="absolute -left-[18px] top-0 w-7 h-7 rounded-full bg-[#EAEAE2] border border-stone-200 text-stone-300 hover:text-red-400 hover:border-red-200 flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 shadow-sm"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                                <FormField
                                                    label="Curso / Grau"
                                                    placeholder="Bacharelado em Ciência da Computação"
                                                    value={edu.degree}
                                                    onChange={e => updateEducation(i, "degree", e.target.value)}
                                                />
                                                <FormField
                                                    label="Instituição"
                                                    placeholder="Universidade de São Paulo"
                                                    value={edu.institution}
                                                    onChange={e => updateEducation(i, "institution", e.target.value)}
                                                />
                                                <FormField
                                                    label="Localização"
                                                    placeholder="São Paulo, SP"
                                                    value={edu.location || ""}
                                                    onChange={e => updateEducation(i, "location", e.target.value)}
                                                />
                                                <MonthPicker
                                                    label="Início (opcional)"
                                                    value={edu.startDate || ""}
                                                    onChange={v => updateEducation(i, "startDate", v)}
                                                />
                                                <MonthPicker
                                                    label={t("create.education.graduationDate")}
                                                    value={edu.graduationDate || ""}
                                                    onChange={v => updateEducation(i, "graduationDate", v)}
                                                />
                                                <FormField
                                                    label="CRA / GPA (opcional)"
                                                    placeholder="8.5 / 10"
                                                    value={edu.gpa || ""}
                                                    onChange={e => updateEducation(i, "gpa", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <AddButton onClick={addEducation} label="Adicionar formação" />
                                </div>
                            </FormSection>

                            {/* ── VI: Competências ─── */}
                            <FormSection number="VI" title="Competências" tag="obrigatório" required>
                                <div className="space-y-4">
                                    {/* Mode toggle */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSkillMode('grouped')}
                                            className={`px-3 py-1.5 text-xs font-sans rounded-sm border transition-colors ${skillMode === 'grouped' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-300 hover:border-stone-400'}`}
                                        >
                                            Por categoria
                                        </button>
                                        <button
                                            onClick={() => setSkillMode('flat')}
                                            className={`px-3 py-1.5 text-xs font-sans rounded-sm border transition-colors ${skillMode === 'flat' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-300 hover:border-stone-400'}`}
                                        >
                                            Lista simples
                                        </button>
                                    </div>

                                    {skillMode === 'grouped' ? (
                                        <div className="space-y-3">
                                            <p className="text-xs text-stone-400 font-sans">
                                                Preencha apenas as categorias que se aplicam. Separe com vírgulas.
                                            </p>
                                            {skillGroups.map((group, gi) => (
                                                <div key={group.id} className="grid sm:grid-cols-[140px_1fr_auto] gap-3 items-center">
                                                    <input
                                                        type="text"
                                                        value={group.category}
                                                        onChange={e => setSkillGroups(p => p.map(g => g.id === group.id ? { ...g, category: e.target.value } : g))}
                                                        placeholder="Categoria"
                                                        className="text-sm font-sans font-semibold text-stone-700 bg-transparent border-b border-stone-300 focus:border-orange-500 focus:outline-none py-1.5 w-full"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={group.text}
                                                        onChange={e => setSkillGroups(p => p.map(g => g.id === group.id ? { ...g, text: e.target.value } : g))}
                                                        placeholder={`${group.category || 'itens'} (opcional, separados por vírgula)`}
                                                        className="text-sm font-sans text-stone-600 bg-transparent border-b border-stone-200 focus:border-orange-400 focus:outline-none py-1.5 w-full placeholder:text-stone-300"
                                                    />
                                                    {gi >= DEFAULT_COUNT && (
                                                        <button
                                                            onClick={() => setSkillGroups(p => p.filter(g => g.id !== group.id))}
                                                            className="text-stone-300 hover:text-red-400 transition-colors px-1"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setSkillGroups(p => [...p, { id: `custom-${Date.now()}`, category: '', text: '' }])}
                                                className="text-xs text-stone-400 hover:text-orange-600 font-sans transition-colors flex items-center gap-1 mt-1"
                                            >
                                                + Adicionar categoria
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-3">
                                                <FormField
                                                    placeholder="React, Python, Gestão de Projetos..."
                                                    value={newSkill}
                                                    onChange={e => setNewSkill(e.target.value)}
                                                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                                                    headless
                                                    className="flex-1"
                                                />
                                                <button
                                                    onClick={addSkill}
                                                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-sans rounded-sm transition-colors shrink-0"
                                                >
                                                    Adicionar
                                                </button>
                                            </div>
                                            <div className="min-h-[80px] flex flex-wrap gap-2 p-4 bg-white/80 rounded-sm border border-stone-300/70">
                                                {skills.length === 0 && (
                                                    <p className="text-xs text-stone-400 italic font-sans self-center w-full text-center">
                                                        Nenhuma competência adicionada
                                                    </p>
                                                )}
                                                {skills.map(skill => (
                                                    <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 text-sm rounded-full shadow-sm font-sans">
                                                        {skill}
                                                        <button onClick={() => removeSkill(skill)} className="text-stone-300 hover:text-red-400 transition-colors text-base leading-none">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </FormSection>

                            {/* ── VII: Certificações ─── */}
                            <FormSection number="VII" title="Certificações e Cursos" tag="opcional">
                                <div className="space-y-8">
                                    {certifications.map((cert, i) => (
                                        <div key={i} className="relative pl-5 border-l-2 border-stone-200 hover:border-orange-300 transition-colors duration-300 group/item">
                                            {certifications.length > 1 && (
                                                <button
                                                    onClick={() => removeCertification(i)}
                                                    className="absolute -left-[18px] top-0 w-7 h-7 rounded-full bg-[#EAEAE2] border border-stone-200 text-stone-300 hover:text-red-400 hover:border-red-200 flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 shadow-sm"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                                <FormField
                                                    label="Certificação"
                                                    placeholder="AWS Certified Solutions Architect"
                                                    value={cert.name}
                                                    onChange={e => updateCertification(i, "name", e.target.value)}
                                                />
                                                <FormField
                                                    label="Emissor"
                                                    placeholder="Amazon Web Services"
                                                    value={cert.issuer || ""}
                                                    onChange={e => updateCertification(i, "issuer", e.target.value)}
                                                />
                                                <FormField
                                                    label="Data"
                                                    placeholder="Jan 2023"
                                                    value={cert.date || ""}
                                                    onChange={e => updateCertification(i, "date", e.target.value)}
                                                />
                                                <FormField
                                                    label="Link (opcional)"
                                                    placeholder="https://..."
                                                    value={cert.url || ""}
                                                    onChange={e => updateCertification(i, "url", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <AddButton onClick={addCertification} label="Adicionar certificação" />
                                </div>
                            </FormSection>

                            {/* ── VIII: Idiomas ─── */}
                            <FormSection number="VIII" title="Idiomas" tag="opcional">
                                <div className="space-y-6">
                                    {languages.map((lang, i) => (
                                        <div key={i} className="relative pl-5 border-l-2 border-stone-200 hover:border-orange-300 transition-colors duration-300 group/item">
                                            {languages.length > 1 && (
                                                <button
                                                    onClick={() => removeLanguage(i)}
                                                    className="absolute -left-[18px] top-0 w-7 h-7 rounded-full bg-[#EAEAE2] border border-stone-200 text-stone-300 hover:text-red-400 hover:border-red-200 flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 shadow-sm"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                                <FormField
                                                    label="Idioma"
                                                    placeholder="Inglês"
                                                    value={lang.name}
                                                    onChange={e => updateLanguage(i, "name", e.target.value)}
                                                />
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-stone-400">
                                                        Nível
                                                    </label>
                                                    <select
                                                        value={lang.level}
                                                        onChange={e => updateLanguage(i, "level", e.target.value)}
                                                        className="w-full py-2.5 bg-transparent border-b border-stone-300 hover:border-stone-400 text-stone-800 font-serif text-base focus:outline-none focus:border-orange-500 transition-colors"
                                                    >
                                                        <option value="basic">Básico</option>
                                                        <option value="intermediate">Intermediário</option>
                                                        <option value="advanced">Avançado</option>
                                                        <option value="fluent">Fluente</option>
                                                        <option value="native">Nativo</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <AddButton onClick={addLanguage} label="Adicionar idioma" />
                                </div>
                            </FormSection>

                            {/* Translation option */}
                            <div className="py-10 border-t border-stone-200/60">
                                <div className="flex items-start gap-4 p-5 bg-white/70 rounded-sm border border-stone-200/80">
                                    <Sparkles className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="font-display text-base font-semibold text-stone-800 mb-1">
                                            Tradução Automática para Inglês
                                        </h4>
                                        <p className="text-sm text-stone-500 font-sans mb-4 leading-relaxed">
                                            Nossa IA traduz seu currículo preservando profissionalismo e formatação.
                                            {creditsRemaining !== null && (
                                                <span className="ml-1 text-stone-400">({creditsRemaining} créditos disponíveis)</span>
                                            )}
                                        </p>
                                        <button
                                            onClick={() => {
                                                const next = !translateToEnglish;
                                                setTranslateToEnglish(next);
                                                if (!next) { setTranslationRetryable(false); setError(null); }
                                            }}
                                            className="flex items-center gap-3 group/toggle"
                                        >
                                            <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${translateToEnglish ? "bg-orange-500" : "bg-stone-300"}`}>
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${translateToEnglish ? "translate-x-5" : "translate-x-0.5"}`} />
                                            </div>
                                            <span className="text-sm text-stone-700 font-sans select-none group-hover/toggle:text-stone-900">
                                                Traduzir meu currículo para inglês
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Translation retry */}
                            {createdResume && translateToEnglish && !translatedResume && translationRetryable && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-sm flex items-center justify-between gap-4">
                                    <p className="text-sm text-amber-800 font-sans">A tradução falhou. Deseja tentar novamente?</p>
                                    <button
                                        onClick={async () => {
                                            const translated = await handleTranslateResume(createdResume.id!);
                                            if (translated) setIsSaved(true);
                                        }}
                                        disabled={isTranslating}
                                        className="text-sm text-amber-700 font-sans underline hover:text-amber-900 disabled:opacity-50 shrink-0"
                                    >
                                        {isTranslating ? "Tentando..." : "Tentar novamente"}
                                    </button>
                                </div>
                            )}
                            {createdResume && translateToEnglish && !translatedResume && (
                                <div className="mb-6">
                                    <button
                                        onClick={() => setIsSaved(true)}
                                        className="w-full py-3 text-sm text-stone-500 hover:text-stone-700 font-sans transition-colors"
                                    >
                                        Continuar com a versão original →
                                    </button>
                                </div>
                            )}

                            {/* Submit / Download */}
                            <div className="pb-20">
                                {!isSaved ? (
                                    <>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            data-testid="create-submit"
                                            className="w-full py-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed text-white font-display text-lg rounded-sm transition-all duration-200 flex items-center justify-center gap-3 tracking-wide shadow-lg shadow-stone-900/10"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    {isTranslating ? "Traduzindo..." : "Salvando..."}
                                                </>
                                            ) : (
                                                <>
                                                    Salvar Currículo
                                                    <Check className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-[11px] text-stone-400 font-sans mt-3">
                                            Você pode editar seu currículo a qualquer momento depois de salvar
                                        </p>
                                    </>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-sm">
                                            <Check className="w-5 h-5 text-green-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-sans font-semibold text-green-800">Currículo salvo com sucesso!</p>
                                                {translatedResume && (
                                                    <p className="text-xs text-green-600 font-sans mt-0.5">Versão em inglês disponível para download</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleDownloadPdf}
                                                disabled={downloadingPdf}
                                                className="flex-1 py-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed text-white font-display text-lg rounded-sm transition-all duration-200 flex items-center justify-center gap-3 tracking-wide shadow-lg shadow-stone-900/10"
                                            >
                                                {downloadingPdf ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Gerando PDF...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="w-5 h-5" />
                                                        Baixar PDF
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                onClick={handleDownloadDocx}
                                                disabled={downloadingDocx}
                                                className="flex-1 py-4 bg-stone-700 hover:bg-stone-600 disabled:bg-stone-400 disabled:cursor-not-allowed text-white font-display text-lg rounded-sm transition-all duration-200 flex items-center justify-center gap-3 tracking-wide shadow-lg shadow-stone-900/10"
                                            >
                                                {downloadingDocx ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Gerando DOCX...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileDown className="w-5 h-5" />
                                                        Baixar DOCX
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <Link
                                            href={`/resumes/${translatedResume?.id || createdResume?.id}`}
                                            className="block text-center text-[11px] text-stone-400 font-sans mt-3 hover:text-stone-600 transition-colors"
                                        >
                                            Editar currículo →
                                        </Link>
                                    </motion.div>
                                )}
                            </div>

                        </div>
                    </main>

                    {/* ─── RIGHT: A4 Preview ─── */}
                    <aside className="hidden lg:flex flex-col w-[46%] xl:w-[42%] sticky top-16 lg:top-20 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] bg-[#D2CFC6] overflow-y-auto">
                        <div className="flex items-center justify-center gap-2 py-3.5 border-b border-[#BDB9B0]/60 shrink-0">
                            <Eye className="w-3.5 h-3.5 text-[#8C8880]" />
                            <span className="text-[11px] text-[#8C8880] font-sans tracking-[0.15em] uppercase">Visualização em tempo real</span>
                        </div>
                        <div className="flex-1 flex items-start justify-center py-8 px-8 overflow-y-auto">
                            <A4Preview
                                personalInfo={personalInfo}
                                summary={summary}
                                experiences={experiences}
                                projects={projects}
                                educations={educations}
                                skills={skills}
                                skillGroups={skillMode === 'grouped'
                                    ? skillGroups
                                        .map(g => ({
                                            category: g.category,
                                            items: g.text.split(',').map(s => s.trim()).filter(Boolean),
                                        }))
                                        .filter(g => g.category && g.items.length > 0)
                                    : []}
                                certifications={certifications}
                                languages={languages}
                            />
                        </div>
                    </aside>

                </div>
            </div>
        </ProtectedRoute>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────

function FormSection({
    number, title, required, tag, children,
}: {
    number: string; title: string; required?: boolean; tag?: string; children: React.ReactNode;
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="py-10 border-t border-stone-200/70"
        >
            <div className="flex items-baseline gap-3 mb-8">
                <span className="text-[10px] font-sans font-bold text-stone-300 tracking-[0.3em] uppercase min-w-[1.5rem] text-right">
                    {number}
                </span>
                <h2 className="font-display text-xl font-semibold text-stone-800 tracking-tight">
                    {title}
                </h2>
                {tag && (
                    <span className={`text-[9px] font-sans uppercase tracking-widest px-2 py-0.5 rounded-full ${required
                        ? "bg-orange-100 text-orange-500"
                        : "bg-stone-200/70 text-stone-400"
                        }`}>
                        {tag}
                    </span>
                )}
            </div>
            {children}
        </motion.section>
    );
}

function FormField({
    label, headless, className, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string; headless?: boolean; error?: string;
}) {
    return (
        <div className={`space-y-2 ${className || ""}`}>
            {!headless && label && (
                <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-stone-500">
                    {label}{props.required && <span className="text-orange-400 ml-0.5">*</span>}
                </label>
            )}
            <input
                className={`w-full py-2.5 bg-transparent border-b transition-colors font-serif text-base placeholder-stone-400 text-stone-800 focus:outline-none ${error
                    ? "border-red-300 focus:border-red-500"
                    : "border-stone-300 hover:border-stone-400 focus:border-orange-500"
                    }`}
                {...props}
            />
            {error && <p className="text-[11px] text-red-500 font-sans">{error}</p>}
        </div>
    );
}

function FormTextarea({
    label, ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-stone-500">
                    {label}
                </label>
            )}
            <textarea
                className="w-full p-4 bg-white/80 border border-stone-300 rounded-sm focus:border-orange-400 focus:bg-white focus:outline-none transition-all font-serif text-base leading-relaxed text-stone-800 placeholder-stone-400 resize-none"
                {...props}
            />
        </div>
    );
}

function BulletEditor({
    label, bullets, onChange, placeholder,
}: {
    label: string; bullets: string[]; onChange: (b: string[]) => void; placeholder?: string;
}) {
    const update = (i: number, v: string) => { const u = [...bullets]; u[i] = v; onChange(u); };
    const remove = (i: number) => onChange(bullets.filter((_, idx) => idx !== i));
    const cleanup = () => { const c = bullets.filter(b => b.trim()); onChange(c.length ? c : [""]); };
    return (
        <div className="space-y-3">
            <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-stone-500">{label}</label>
            {bullets.map((bullet, i) => (
                <div key={i} className="flex items-center gap-2.5">
                    <span className="text-orange-400 text-lg leading-none shrink-0">·</span>
                    <input
                        type="text"
                        value={bullet}
                        onChange={e => update(i, e.target.value)}
                        onBlur={cleanup}
                        placeholder={placeholder || "Descreva uma conquista..."}
                        className="flex-1 py-2 px-3 bg-white/80 border border-stone-300 rounded-sm focus:border-orange-400 focus:bg-white focus:outline-none transition-all font-serif text-sm text-stone-700 placeholder-stone-400"
                    />
                    {bullets.length > 1 && (
                        <button type="button" onClick={() => remove(i)} className="p-1 text-stone-300 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange([...bullets, ""])}
                className="text-[11px] text-stone-400 hover:text-orange-500 transition-colors flex items-center gap-1.5 font-sans pl-5"
            >
                <Plus className="w-3 h-3" />
                Adicionar tópico
            </button>
        </div>
    );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full py-3 border border-dashed border-stone-300 rounded-sm text-stone-400 hover:border-orange-300 hover:text-orange-500 transition-all text-sm font-sans flex items-center justify-center gap-2"
        >
            <Plus className="w-4 h-4" />
            {label}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// A4 Preview
// ─────────────────────────────────────────────────────────────────────────────

interface A4PreviewProps {
    personalInfo: PersonalInfo;
    summary: string;
    experiences: Experience[];
    projects: Project[];
    educations: Education[];
    skills: string[];
    skillGroups: { category: string; items: string[] }[];
    certifications: Certification[];
    languages: Language[];
}

function A4Preview({ personalInfo, summary, experiences, projects, educations, skills, skillGroups, certifications, languages }: A4PreviewProps) {
    const levelLabel: Record<string, string> = {
        native: "Nativo", fluent: "Fluente", advanced: "Avançado", intermediate: "Intermediário", basic: "Básico",
    };

    const hasContent = personalInfo.fullName || summary || experiences.some(e => e.title || e.company) || educations.some(e => e.degree) || skills.length > 0;
    const filteredExp = experiences.filter(e => e.title?.trim() || e.company?.trim());
    const filteredProj = projects.filter(p => p.name?.trim());
    const filteredEdu = educations.filter(e => e.degree?.trim() || e.institution?.trim());
    const filteredCerts = certifications.filter(c => c.name?.trim());
    const filteredLangs = languages.filter(l => l.name?.trim());

    return (
        <div
            className="w-full bg-[#FDFCFA] shadow-2xl shadow-stone-900/20 rounded-sm overflow-hidden"
            style={{ fontSize: "10px" }}
        >
            <div className="p-[3.2em]">
                {!hasContent ? (
                    <div className="text-center py-[5em] text-stone-300">
                        <FileText className="w-[3em] h-[3em] mx-auto mb-[1em] opacity-30" />
                        <p className="text-[1.3em] font-sans leading-relaxed">
                            Comece a preencher o formulário<br />para ver sua visualização
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="text-center pb-[1.6em] mb-[1.6em] border-b border-stone-200">
                            <h1 className="font-display font-bold text-[2.2em] text-stone-900 leading-tight mb-[0.4em] tracking-tight">
                                {personalInfo.fullName || <span className="text-stone-300 italic font-normal">Seu nome aqui</span>}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center gap-x-[1.2em] gap-y-[0.3em] text-[1.1em] text-stone-500 font-sans">
                                {personalInfo.email && <span>{personalInfo.email}</span>}
                                {personalInfo.phone && (<><span className="text-stone-300">·</span><span>{personalInfo.phone}</span></>)}
                                {personalInfo.location && (<><span className="text-stone-300">·</span><span>{personalInfo.location}</span></>)}
                            </div>
                            {(personalInfo.linkedin || personalInfo.github || personalInfo.website) && (
                                <div className="flex flex-wrap items-center justify-center gap-x-[1.2em] gap-y-[0.2em] text-[1em] text-stone-400 mt-[0.5em] font-sans">
                                    {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                                    {personalInfo.github && <span>{personalInfo.github}</span>}
                                    {personalInfo.website && <span>{personalInfo.website}</span>}
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        {summary && (
                            <PreviewSection title="Perfil">
                                <p className="text-[1.15em] text-stone-700 font-serif leading-[1.75]">{summary}</p>
                            </PreviewSection>
                        )}

                        {/* Experience */}
                        {filteredExp.length > 0 && (
                            <PreviewSection title="Experiência">
                                {filteredExp.map((exp, i) => (
                                    <div key={i} className="mb-[1.4em] last:mb-0">
                                        <div className="flex items-baseline justify-between gap-[1em] mb-[0.25em]">
                                            <span className="font-serif font-semibold text-[1.2em] text-stone-900">{exp.title}</span>
                                            <span className="text-[0.95em] text-stone-400 shrink-0 font-sans">
                                                {exp.startDate}
                                                {exp.startDate && (exp.endDate || exp.current) ? " – " : ""}
                                                {exp.current ? "atual" : exp.endDate}
                                            </span>
                                        </div>
                                        <p className="text-[1.05em] text-stone-500 mb-[0.5em] font-sans">
                                            {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                                        </p>
                                        {exp.bullets && exp.bullets.filter(b => b?.trim()).length > 0 && (
                                            <ul className="space-y-[0.25em]">
                                                {exp.bullets.filter(b => b?.trim()).map((b, j) => (
                                                    <li key={j} className="flex items-start gap-[0.6em] text-[1.05em] text-stone-600 font-serif leading-[1.55]">
                                                        <span className="text-stone-300 shrink-0">—</span>
                                                        <span>{b}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </PreviewSection>
                        )}

                        {/* Projects */}
                        {filteredProj.length > 0 && (
                            <PreviewSection title="Projetos">
                                {filteredProj.map((proj, i) => (
                                    <div key={i} className="mb-[1.2em] last:mb-0">
                                        <div className="flex items-baseline justify-between gap-[1em] mb-[0.2em]">
                                            <span className="font-serif font-semibold text-[1.15em] text-stone-900">{proj.name}</span>
                                            {proj.technologies && proj.technologies.length > 0 && (
                                                <span className="text-[0.9em] text-stone-400 font-sans shrink-0">{proj.technologies.join(", ")}</span>
                                            )}
                                        </div>
                                        {proj.description && (
                                            <p className="text-[1.05em] text-stone-600 font-serif leading-[1.55]">{proj.description}</p>
                                        )}
                                    </div>
                                ))}
                            </PreviewSection>
                        )}

                        {/* Education */}
                        {filteredEdu.length > 0 && (
                            <PreviewSection title="Formação">
                                {filteredEdu.map((edu, i) => (
                                    <div key={i} className="mb-[1.2em] last:mb-0">
                                        <div className="flex items-baseline justify-between gap-[1em]">
                                            <span className="font-serif font-semibold text-[1.15em] text-stone-900">{edu.degree}</span>
                                            {edu.graduationDate && (
                                                <span className="text-[0.95em] text-stone-400 shrink-0 font-sans">{edu.graduationDate}</span>
                                            )}
                                        </div>
                                        <p className="text-[1.05em] text-stone-500 font-sans">
                                            {edu.institution}
                                            {edu.location ? ` · ${edu.location}` : ""}
                                            {edu.gpa ? ` · CRA ${edu.gpa}` : ""}
                                        </p>
                                    </div>
                                ))}
                            </PreviewSection>
                        )}

                        {/* Skills */}
                        {(skills.length > 0 || skillGroups.some(g => g.category && g.items.length > 0)) && (
                            <PreviewSection title="Competências">
                                {skillGroups.some(g => g.category && g.items.length > 0) ? (
                                    <div className="space-y-[0.5em]">
                                        {skillGroups.filter(g => g.category && g.items.length > 0).map((g, i) => (
                                            <div key={i} className="flex gap-[1em] text-[1.1em] font-serif">
                                                <span className="font-bold text-stone-800 shrink-0 min-w-[8em]">{g.category}</span>
                                                <span className="text-stone-600">{g.items.join(", ")}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[1.1em] text-stone-700 font-serif leading-[1.9]">
                                        {skills.join(" · ")}
                                    </p>
                                )}
                            </PreviewSection>
                        )}

                        {/* Certifications */}
                        {filteredCerts.length > 0 && (
                            <PreviewSection title="Certificações">
                                {filteredCerts.map((cert, i) => (
                                    <div key={i} className="flex items-baseline justify-between mb-[0.6em] last:mb-0 gap-[1em]">
                                        <span className="font-serif text-[1.1em] text-stone-800">{cert.name}</span>
                                        <span className="text-[0.95em] text-stone-400 font-sans shrink-0">
                                            {cert.issuer}{cert.issuer && cert.date ? " · " : ""}{cert.date}
                                        </span>
                                    </div>
                                ))}
                            </PreviewSection>
                        )}

                        {/* Languages */}
                        {filteredLangs.length > 0 && (
                            <PreviewSection title="Idiomas">
                                <div className="flex flex-wrap gap-x-[2em] gap-y-[0.5em]">
                                    {filteredLangs.map((lang, i) => (
                                        <span key={i} className="text-[1.1em] text-stone-700 font-serif">
                                            {lang.name}{" "}
                                            <span className="text-stone-400 font-sans text-[0.9em]">— {levelLabel[lang.level] || lang.level}</span>
                                        </span>
                                    ))}
                                </div>
                            </PreviewSection>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-[2em]">
            <div className="flex items-center gap-[0.8em] mb-[0.9em]">
                <span className="text-[0.85em] font-sans font-bold uppercase tracking-[0.18em] text-stone-400 whitespace-nowrap">{title}</span>
                <div className="flex-1 h-[0.5px] bg-stone-200" />
            </div>
            {children}
        </div>
    );
}
