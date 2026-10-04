"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { atsApi, resumeApi, triggerDownload, ApiRequestError } from "@/lib/api";
import { computeCompleteness } from "@/lib/completeness";
import { getResumeDraft } from "@/lib/resume/defaults";
import { formatResumeJsonc, stringifyResumeJsonc, updateResumeJsonc, validateResumeJsonc } from "@/lib/resume/jsonc";
import type { Certification, Education, Experience, Language, Project, Resume, ResumeTemplate } from "@/lib/types";

export type EditorSection = "basics" | "experience" | "projects" | "education" | "skills" | "certifications" | "languages";

export function useResumeEditor(id: string, translate: (key: string, vars?: Record<string, string | number>) => string, locale: string) {
  const router = useRouter();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [resume, setResume] = useState<Resume | null>(null);
  const [title, setTitle] = useState("");
  const [personalInfo, setPersonalInfo] = useState({ fullName: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "" });
  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [techInputs, setTechInputs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingTypst, setDownloadingTypst] = useState(false);
  const [lastSaved, setLastSaved] = useState(translate("editor.notSaved"));
  const [error, setError] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<EditorSection>("basics");
  const [template, setTemplate] = useState<ResumeTemplate>("classic");
  const [editorMode, setEditorMode] = useState<"visual" | "jsonc">("jsonc");
  const [source, setSource] = useState("");
  const [savedSource, setSavedSource] = useState("");
  const [diagnostics, setDiagnostics] = useState<import("@/lib/types").JsoncDiagnostic[]>([]);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [translateCaptchaToken, setTranslateCaptchaToken] = useState<string | null>(turnstileSiteKey ? null : "");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const loaded = await resumeApi.getById(id);
        if (cancelled) return;
        const draft = getResumeDraft(loaded);
        const initialSource = loaded.sourceJsonc || stringifyResumeJsonc(loaded);
        setResume(loaded); setSource(initialSource); setSavedSource(initialSource); setTitle(draft.title); setPersonalInfo(draft.personalInfo); setSummary(draft.summary);
        setExperiences(draft.experiences); setProjects(draft.projects); setEducations(draft.educations);
        setSkills(draft.skills); setCertifications(draft.certifications); setLanguages(draft.languages);
        setTechInputs(draft.projects.map((project) => (project.technologies || []).join(", ")));
        setLastSaved(translate("editor.justLoaded"));
        try { const score = await atsApi.getScore(id); if (!cancelled && score) setAtsScore(score.score); } catch { /* score is optional */ }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : translate("editor.failedLoad"));
      } finally { if (!cancelled) setIsLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [id, translate]);

  const payload = useMemo(() => ({ title, personalInfo, summary, experience: experiences, projects, education: educations, skills, certifications, languages }), [title, personalInfo, summary, experiences, projects, educations, skills, certifications, languages]);
  const completeness = useMemo(() => computeCompleteness({ title, personalInfo, summary, experience: experiences, projects, education: educations, skills, certifications, languages }), [payload]);

  const isDirty = source !== savedSource;
  const isValid = diagnostics.length === 0;

  const applyResume = useCallback((next: Resume) => {
    const draft = getResumeDraft(next);
    setResume(next);
    setTitle(draft.title); setPersonalInfo(draft.personalInfo); setSummary(draft.summary);
    setExperiences(draft.experiences); setProjects(draft.projects); setEducations(draft.educations);
    setSkills(draft.skills); setCertifications(draft.certifications); setLanguages(draft.languages);
    setTechInputs(draft.projects.map((project) => (project.technologies || []).join(", ")));
  }, []);

  const validate = useCallback((candidate = source) => {
    const result = validateResumeJsonc(candidate);
    setDiagnostics(result.diagnostics);
    return result;
  }, [source]);

  useEffect(() => {
    if (!source) return;
    const timer = window.setTimeout(() => {
      const result = validateResumeJsonc(source);
      setDiagnostics(result.diagnostics);
      if (result.resume) applyResume(result.resume);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [applyResume, source]);

  useEffect(() => {
    if (isLoading || editorMode !== "visual" || !source) return;
    setSource((current) => {
      const parsed = validateResumeJsonc(current).resume;
      if (!parsed || JSON.stringify({ ...parsed, sourceJsonc: undefined }) === JSON.stringify({ ...payload, schemaVersion: 1 })) return current;
      try { return updateResumeJsonc(current, payload as Resume); } catch { return current; }
    });
  }, [editorMode, isLoading, payload, source]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (isDirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const save = useCallback(async () => {
    setIsSaving(true); setError(null);
    try {
      const result = validateResumeJsonc(source);
      if (!result.resume) { setDiagnostics(result.diagnostics); throw new Error("Corrija os erros do JSONC antes de salvar."); }
      await resumeApi.update(id, { ...result.resume, sourceJsonc: source });
      setSavedSource(source); setLastSaved(translate("editor.justNow"));
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : translate("editor.failedSave")); }
    finally { setIsSaving(false); }
  }, [id, source, translate]);

  const formatJsonc = useCallback(() => {
    try { const formatted = formatResumeJsonc(source); setSource(formatted); setDiagnostics([]); }
    catch { validate(source); }
  }, [source, validate]);

  const importJsonc = useCallback((nextSource: string) => {
    const result = validateResumeJsonc(nextSource);
    setDiagnostics(result.diagnostics);
    if (!result.resume) return false;
    setSource(nextSource); applyResume(result.resume); return true;
  }, [applyResume]);

  const exportJsonc = useCallback(() => {
    const blob = new Blob([source], { type: "application/json" });
    triggerDownload(blob, `${title || "curriculo"}.jsonc`);
  }, [source, title]);

  const download = useCallback(async (format: "pdf" | "docx") => {
    const setter = format === "pdf" ? setDownloadingPdf : setDownloadingDocx;
    setter(true); setError(null);
    try {
      await resumeApi.update(id, payload);
      const blob = format === "pdf" ? await resumeApi.downloadPdf(id, locale) : await resumeApi.downloadDocx(id, locale);
      triggerDownload(blob, `${title || "resume"}.${format}`); setLastSaved(translate("editor.justNow"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : translate(format === "pdf" ? "editor.failedDownloadPdf" : "editor.failedDownloadDocx")); }
    finally { setter(false); }
  }, [id, locale, payload, title, translate]);

  const downloadTypst = useCallback(async () => {
    setDownloadingTypst(true); setError(null);
    try { const blob = await resumeApi.downloadTypstPdf(payload as Resume, template); triggerDownload(blob, `${title || "resume"}-${template}.pdf`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível gerar o PDF Typst."); }
    finally { setDownloadingTypst(false); }
  }, [id, payload, template, title, translate]);

  const translateResume = useCallback(async () => {
    setIsTranslating(true); setError(null);
    try {
      await resumeApi.update(id, payload);
      const translated = await resumeApi.translateToEnglish(id, translateCaptchaToken || undefined);
      setTranslateCaptchaToken(turnstileSiteKey ? null : ""); router.push(`/resumes/${translated.id}`);
    } catch (cause) {
      setTranslateCaptchaToken(turnstileSiteKey ? null : "");
      if (cause instanceof ApiRequestError && cause.status === 403) {
        const message = cause.message.toLowerCase();
        setError(message.includes("credit") || message.includes("crédito") ? translate("editor.translateCreditsExceeded") : translate("editor.translateCaptchaFailed"));
      } else setError(cause instanceof Error ? cause.message : translate("editor.translateFailed"));
    } finally { setIsTranslating(false); }
  }, [id, payload, router, translate, translateCaptchaToken, turnstileSiteKey]);

  const updateAt = <T,>(setter: Dispatch<SetStateAction<T[]>>, index: number, value: T) => setter((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  const actions = {
    addExperience: () => setExperiences((items) => [...items, { title: "", company: "", startDate: "", endDate: "", bullets: [""] }]),
    updateExperience: (index: number, value: Experience) => updateAt(setExperiences, index, value),
    removeExperience: (index: number) => setExperiences((items) => items.filter((_, itemIndex) => itemIndex !== index)),
    addProject: () => { setProjects((items) => [...items, { name: "", description: "", technologies: [], url: "", bullets: [""] }]); setTechInputs((items) => [...items, ""]); },
    updateProject: (index: number, value: Project) => updateAt(setProjects, index, value),
    removeProject: (index: number) => { setProjects((items) => items.filter((_, itemIndex) => itemIndex !== index)); setTechInputs((items) => items.filter((_, itemIndex) => itemIndex !== index)); },
    updateTechInput: (index: number, value: string) => {
      setTechInputs((items) => items.map((item, itemIndex) => itemIndex === index ? value : item));
      setProjects((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, technologies: value.split(",").map((entry) => entry.trim()).filter(Boolean) } : item));
    },
    commitTechInput: (index: number) => setProjects((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, technologies: (techInputs[index] || "").split(",").map((value) => value.trim()).filter(Boolean) } : item)),
    addEducation: () => setEducations((items) => [...items, { degree: "", institution: "" }]),
    updateEducation: (index: number, value: Education) => updateAt(setEducations, index, value),
    removeEducation: (index: number) => setEducations((items) => items.filter((_, itemIndex) => itemIndex !== index)),
    addCertification: () => setCertifications((items) => [...items, { name: "", issuer: "", date: "" }]),
    updateCertification: (index: number, value: Certification) => updateAt(setCertifications, index, value),
    removeCertification: (index: number) => setCertifications((items) => items.filter((_, itemIndex) => itemIndex !== index)),
    addLanguage: () => setLanguages((items) => [...items, { name: "", level: "intermediate" }]),
    updateLanguage: (index: number, value: Language) => updateAt(setLanguages, index, value),
    removeLanguage: (index: number) => setLanguages((items) => items.filter((_, itemIndex) => itemIndex !== index)),
    addSkill: () => { const value = newSkill.trim(); if (value && !skills.includes(value)) { setSkills((items) => [...items, value]); setNewSkill(""); } },
    removeSkill: (skill: string) => setSkills((items) => items.filter((item) => item !== skill)),
  };

  return { resume, title, setTitle, personalInfo, setPersonalInfo, summary, setSummary, experiences, projects, educations, skills, certifications, languages, newSkill, setNewSkill, techInputs, activeSection, setActiveSection, template, setTemplate, editorMode, setEditorMode, source, setSource, diagnostics, isDirty, isValid, validate, formatJsonc, importJsonc, exportJsonc, showMobilePreview, setShowMobilePreview, translateCaptchaToken, setTranslateCaptchaToken, turnstileSiteKey, isLoading, isSaving, isTranslating, downloadingPdf, downloadingDocx, downloadingTypst, lastSaved, error, atsScore, completeness, payload, actions, save, download, downloadTypst, translateResume };
}

export type ResumeEditor = ReturnType<typeof useResumeEditor>;
