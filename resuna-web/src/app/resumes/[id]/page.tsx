"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Download,
  FileText,
  Plus,
  Trash2,
  Loader2,
  FileDown,
  Check,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Badge } from "@/components/ui/Badge";
import { resumeApi, atsApi, triggerDownload, ApiRequestError } from "@/lib/api";
import TurnstileWrapper from "@/components/Turnstile";
import { computeCompleteness } from "@/lib/completeness";
import { maskPhoneBR } from "@/lib/validation";
import type { Resume, Experience, Education, Project, Certification, Language } from "@/lib/types";
import { useTranslation } from "@/contexts/LanguageContext";
import { THEME } from "@/lib/theme";
import { GrainOverlay } from "@/components/ui/GrainOverlay";

const tabs = [
  { id: "basics", label: "The Basics", required: true },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certifications" },
  { id: "languages", label: "Languages" },
];

const languageLevels = [
  { value: "native", label: "Native Speaker" },
  { value: "fluent", label: "Fluent" },
  { value: "advanced", label: "Advanced" },
  { value: "intermediate", label: "Intermediate" },
  { value: "basic", label: "Basic Knowledge" },
];

/** Allow only safe URL protocols in preview links. Prevents javascript:/data:/vbscript: injection. */
function sanitizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '#';
  // If no protocol, prepend https
  if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed)) return `https://${trimmed}`;
  // Whitelist safe protocols (case-insensitive)
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }
  return '#invalid';
}

export default function ResumeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basics");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(t("editor.notSaved"));
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [translateCaptchaToken, setTranslateCaptchaToken] = useState<string | null>(
    turnstileSiteKey ? null : "",
  );
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Resume state
  const [resume, setResume] = useState<Resume | null>(null);
  const [title, setTitle] = useState("");
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
  });
  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [techInputs, setTechInputs] = useState<string[]>([]);

  const completeness = useMemo(() => computeCompleteness({
    title,
    personalInfo,
    summary,
    experience: experiences,
    projects,
    education: educations,
    skills,
    certifications,
    languages,
  }), [title, personalInfo, summary, experiences, projects, educations, skills, certifications, languages]);

  useEffect(() => {
    const loadResume = async () => {
      try {
        setIsLoading(true);
        const data = await resumeApi.getById(id);
        setResume(data);
        setTitle(data.title || "");
        setPersonalInfo({
          fullName: data.personalInfo?.fullName || "",
          email: data.personalInfo?.email || "",
          phone: data.personalInfo?.phone || "",
          location: data.personalInfo?.location || "",
          linkedin: data.personalInfo?.linkedin || "",
          github: data.personalInfo?.github || "",
          website: data.personalInfo?.website || "",
        });
        setSummary(data.summary || "");
        setExperiences(data.experience || []);
        setProjects(data.projects || []);
        setTechInputs((data.projects || []).map((p: Project) => (p.technologies || []).join(", ")));
        setEducations(data.education || []);
        setSkills(data.skills || []);
        setCertifications(data.certifications || []);
        setLanguages(data.languages || []);
        setLastSaved(t("editor.justLoaded"));

        // Try to get ATS score
        try {
          const score = await atsApi.getScore(id);
          if (score) setAtsScore(score.score);
        } catch {
          // No score available
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load resume");
      } finally {
        setIsLoading(false);
      }
    };
    loadResume();
  }, [id, t]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await resumeApi.update(id, {
        title,
        personalInfo,
        summary,
        experience: experiences,
        projects,
        education: educations,
        skills,
        certifications,
        languages,
      });
      setLastSaved(t("editor.justNow"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setError(null);
    try {
      await resumeApi.update(id, {
        title,
        personalInfo,
        summary,
        experience: experiences,
        projects,
        education: educations,
        skills,
        certifications,
        languages,
      });
      setLastSaved(t("editor.justNow"));
      const blob = await resumeApi.downloadPdf(id, locale);
      const filename = `${title || "resume"}.pdf`;
      triggerDownload(blob, filename);
    } catch (err) {
      setError(t("editor.failedDownloadPdf"));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    setError(null);
    try {
      await resumeApi.update(id, {
        title,
        personalInfo,
        summary,
        experience: experiences,
        projects,
        education: educations,
        skills,
        certifications,
        languages,
      });
      setLastSaved(t("editor.justNow"));
      const blob = await resumeApi.downloadDocx(id, locale);
      const filename = `${title || "resume"}.docx`;
      triggerDownload(blob, filename);
    } catch (err) {
      setError(t("editor.failedDownloadDocx"));
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    setError(null);
    try {
      // Save current state first so all fields (including location) are included in translation
      await resumeApi.update(id, {
        title,
        personalInfo,
        summary,
        experience: experiences,
        projects,
        education: educations,
        skills,
        certifications,
        languages,
      });
      const translated = await resumeApi.translateToEnglish(id, translateCaptchaToken || undefined);
      setTranslateCaptchaToken(turnstileSiteKey ? null : "");
      // Open translated resume in editor
      router.push(`/resumes/${translated.id}`);
    } catch (err) {
      setTranslateCaptchaToken(turnstileSiteKey ? null : "");
      if (err instanceof ApiRequestError && err.status === 403) {
        const msg = err.message.toLowerCase();
        if (msg.includes("captcha") || msg.includes("verificação") || msg.includes("segurança")) {
          setError(t("editor.translateCaptchaFailed"));
        } else if (msg.includes("credit") || msg.includes("crédito") || msg.includes("limite")) {
          setError(t("editor.translateCreditsExceeded"));
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : t("editor.translateFailed"));
      }
      setIsTranslating(false);
    }
  };

  // Experience handlers
  const addExperience = () => {
    setExperiences([
      ...experiences,
      { title: "", company: "", startDate: "", endDate: "", bullets: [""] },
    ]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | string[] | boolean) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  // Project handlers
  const addProject = () => {
    setProjects([...projects, { name: "", description: "", technologies: [], url: "", bullets: [""] }]);
    setTechInputs([...techInputs, ""]);
  };

  const updateProject = (index: number, field: keyof Project, value: string | string[]) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
    setTechInputs(techInputs.filter((_, i) => i !== index));
  };

  // Education handlers
  const addEducation = () => {
    setEducations([...educations, { degree: "", institution: "" }]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    setEducations(updated);
  };

  const removeEducation = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  // Certification handlers
  const addCertification = () => {
    setCertifications([...certifications, { name: "", issuer: "", date: "" }]);
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Language handlers
  const addLanguage = () => {
    setLanguages([...languages, { name: "", level: "intermediate" }]);
  };

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value as Language["level"] };
    setLanguages(updated);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  // Skill handlers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${THEME.bg} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className={`${THEME.fontBody} italic ${THEME.textMuted}`}>{t('editor.preparingWorkspace')}</p>
        </div>
      </div>
    );
  }

  if (error && !resume) {
    return (
      <div className={`min-h-screen ${THEME.bg}`}>
        <Header />
        <main className="pt-32 pb-16">
          <div className="container-custom text-center">
            <h1 className={`${THEME.fontDisplay} text-3xl text-stone-900 mb-4`}>{t('editor.unableToLoad')}</h1>
            <p className="text-stone-600 mb-8 max-w-md mx-auto">{error}</p>
            <Link href="/resumes">
              <Button>{t('editor.returnToDashboard')}</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900 selection:bg-orange-100 selection:text-orange-900`}>
      <GrainOverlay />

      <Header />

      <main className="relative z-10 pt-24 lg:pt-32 pb-20">

        {/* Mobile Preview Toggle (Floating) */}
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="shadow-xl rounded-full px-6 py-4 bg-stone-900 text-white hover:bg-orange-600 transition-colors"
          >
            {showMobilePreview ? (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Edit
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Preview
              </>
            )}
          </Button>
        </div>

        {/* Editor Toolbar (Floating) */}
        <div className="sticky top-20 z-40 bg-[#F8F6F1]/95 backdrop-blur-md border-b border-stone-200/60 shadow-sm mb-12 transition-all duration-300">
          <div className="container-custom py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <Link
                  href="/resumes"
                  className="p-2 -ml-2 rounded-full hover:bg-stone-200/50 text-stone-500 hover:text-stone-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex flex-col">
                  {/* ... title input ... */}
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-display font-semibold text-2xl bg-transparent border-b border-transparent hover:border-stone-300 focus:border-orange-500 focus:outline-none p-0 text-stone-900 placeholder-stone-400 w-full min-w-[200px] transition-all"
                    placeholder={t('editor.untitledMasterpiece')}
                  />
                  <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-stone-500 mt-1 uppercase">
                    <span className={isSaving ? "text-orange-600 animate-pulse" : ""}>
                      {isSaving ? t('editor.savingChanges') : t('editor.lastSaved', { time: lastSaved })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                    <span
                      className={completeness.score >= 80 ? "text-green-600" : completeness.score >= 50 ? "text-orange-500" : "text-red-500"}
                      title={completeness.missingFields.length > 0 ? `Faltando: ${completeness.missingFields.join(', ')}` : 'Currículo completo!'}
                    >
                      {completeness.score}% completo
                    </span>
                    {atsScore !== null && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                        <span className={atsScore >= 70 ? "text-green-600" : "text-orange-600"}>
                          {t('editor.atsScore', { score: atsScore })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="font-serif hover:bg-stone-200/50"
                >
                  {downloadingPdf ? <Spinner size="sm" /> : <Download className="w-4 h-4 mr-2" />}
                  PDF
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadDocx}
                  disabled={downloadingDocx}
                  className="font-serif hover:bg-stone-200/50"
                >
                  {downloadingDocx ? <Spinner size="sm" /> : <FileDown className="w-4 h-4 mr-2" />}
                  DOCX
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTranslate}
                  disabled={isTranslating || (!!turnstileSiteKey && !translateCaptchaToken)}
                  className="font-serif hover:bg-stone-200/50"
                  title="Traduzir para inglês"
                >
                  {isTranslating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                  EN
                </Button>

                <Button size="sm" onClick={handleSave} disabled={isSaving} className="font-serif shadow-orange">
                  {isSaving ? <Spinner size="sm" className="text-white" /> : <Save className="w-4 h-4 mr-2" />}
                  {t('editor.saveDraft')}
                </Button>
              </div>
            </div>

            {turnstileSiteKey && (
              <div className="mt-3 w-full max-w-md">
                <p className="text-xs text-stone-500 mb-2 font-sans">{t("editor.translateCaptchaHint")}</p>
                <TurnstileWrapper
                  size="compact"
                  onSuccess={(tok) => setTranslateCaptchaToken(tok)}
                  onError={() => setTranslateCaptchaToken(null)}
                  onExpire={() => setTranslateCaptchaToken(null)}
                />
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 bg-red-50 text-red-800 rounded-sm text-sm border-l-2 border-red-500 font-medium animate-fade-in-up">
                {error}
              </div>
            )}

            {/* Editorial Tabs - Hide when in Mobile Preview mode */}
            <div className={`flex items-center gap-6 mt-8 overflow-x-auto scrollbar-hide pb-1 ${showMobilePreview ? 'hidden lg:flex' : ''}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 text-base font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id
                    ? "text-stone-900 font-semibold"
                    : "text-stone-400 hover:text-stone-600"
                    }`}
                >
                  {t(`editor.tabs.${tab.id}`)}
                  {tab.required && <span className="text-orange-500 ml-0.5 text-xs align-top">*</span>}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-600"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Workspace */}
        <div className="container-custom">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* The Form (Writer's Area) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`lg:col-span-6 space-y-8 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}
            >
              <div className="prose prose-stone">
                <p className="text-stone-500 italic text-lg leading-relaxed">
                  {activeTab === "basics" && t('editor.basicsIntro')}
                  {activeTab === "experience" && t('editor.experienceIntro')}
                  {activeTab === "projects" && t('editor.projectsIntro')}
                  {activeTab === "education" && t('editor.educationIntro')}
                  {activeTab === "skills" && t('editor.skillsIntro')}
                </p>
              </div>

              {/* BASICS TAB */}
              {activeTab === "basics" && (
                <EditorialCard title={t('editor.personalInfo')}>
                  {/* ... same content ... */}
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <EditorialInput
                        label={t('editor.fullName')}
                        placeholder={t('editor.fullNamePlaceholder')}
                        value={personalInfo.fullName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                        required
                      />
                      <EditorialInput
                        label={t('editor.emailAddress')}
                        type="email"
                        placeholder="jane@example.com"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                        required
                      />
                    </div>
                    {/* ... rest of basics inputs ... */}
                    <div className="grid sm:grid-cols-2 gap-6">
                      <EditorialInput
                        label={t('editor.phoneNumber')}
                        placeholder={t('editor.phonePlaceholder')}
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: maskPhoneBR(e.target.value) })}
                      />
                      <EditorialInput
                        label={t('editor.currentLocation')}
                        placeholder={t('editor.locationPlaceholder')}
                        value={personalInfo.location}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                      />
                    </div>

                    <div className="pt-6 border-t border-stone-100">
                      <h4 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-4">
                        {t('editor.digitalPresence')}
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-focus-within:bg-orange-100 group-focus-within:text-orange-600 transition-colors">
                            <Linkedin className="w-4 h-4" />
                          </div>
                          <EditorialInput
                            placeholder="linkedin.com/in/profile"
                            value={personalInfo.linkedin}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                            className="flex-1"
                            headless
                          />
                        </div>
                        <div className="flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-focus-within:bg-orange-100 group-focus-within:text-orange-600 transition-colors">
                            <Github className="w-4 h-4" />
                          </div>
                          <EditorialInput
                            placeholder="github.com/username"
                            value={personalInfo.github}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                            className="flex-1"
                            headless
                          />
                        </div>
                        <div className="flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-focus-within:bg-orange-100 group-focus-within:text-orange-600 transition-colors">
                            <Globe className="w-4 h-4" />
                          </div>
                          <EditorialInput
                            placeholder="yourwebsite.com"
                            value={personalInfo.website}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })}
                            className="flex-1"
                            headless
                          />
                        </div>
                      </div>
                    </div>

                    <EditorialTextarea
                      label={t('editor.professionalSummary')}
                      placeholder={t('editor.summaryPlaceholder')}
                      rows={5}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                    />
                  </div>
                </EditorialCard>
              )}

              {/* ... Other tabs ... */}
              {activeTab === "experience" && (
                <div className="space-y-6">
                  {experiences.map((exp, index) => (
                    <EditorialCard key={index} title={`${t('editor.role')} ${index + 1}`}
                      action={<button onClick={() => removeExperience(index)} className="text-stone-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                    >
                      <div className="space-y-5">
                        <EditorialInput
                          label={t('editor.jobTitle')}
                          value={exp.title}
                          onChange={(e) => updateExperience(index, "title", e.target.value)}
                          placeholder={t('editor.jobTitlePlaceholder')}
                        />
                        <EditorialInput
                          label={t('editor.companyOrg')}
                          value={exp.company}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                          placeholder={t('editor.companyPlaceholder')}
                        />
                        <EditorialInput
                          label={t('editor.location')}
                          placeholder={t('editor.locationExpPlaceholder')}
                          value={exp.location || ""}
                          onChange={(e) => updateExperience(index, "location", e.target.value)}
                        />
                        <div className="grid sm:grid-cols-2 gap-5">
                          <MonthPicker
                            label={t('editor.started')}
                            value={exp.startDate || ""}
                            onChange={(value) => updateExperience(index, "startDate", value)}
                          />
                          <MonthPicker
                            label={t('editor.ended')}
                            value={exp.endDate || ""}
                            onChange={(value) => updateExperience(index, "endDate", value)}
                            disabled={exp.current}
                          />
                        </div>
                        <label className="flex items-center gap-3 text-stone-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.current || false}
                            onChange={(e) => updateExperience(index, "current", e.target.checked)}
                            className="w-4 h-4 text-orange-600 border-stone-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium">{t('editor.iCurrentlyWorkHere')}</span>
                        </label>
                        <EditorialTextarea
                          label={t('editor.keyAchievements')}
                          rows={5}
                          value={exp.bullets?.join("\n") || ""}
                          onChange={(e) => updateExperience(index, "bullets", e.target.value.split("\n"))}
                          placeholder={t('editor.achievementsPlaceholder')}
                        />
                      </div>
                    </EditorialCard>
                  ))}

                  <button
                    onClick={addExperience}
                    className="w-full py-4 border-2 border-dashed border-stone-300 rounded-sm text-stone-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/20 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    {t('editor.addAnotherRole')}
                  </button>
                </div>
              )}

              {/* PROJECTS TAB */}
              {activeTab === "projects" && (
                <div className="space-y-6">
                  {projects.map((proj, index) => (
                    <EditorialCard key={index} title={`${t('editor.project')} ${index + 1}`}
                      action={<button onClick={() => removeProject(index)} className="text-stone-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                    >
                      <div className="space-y-5">
                        <EditorialInput
                          label={t('editor.projectName')}
                          value={proj.name}
                          onChange={(e) => updateProject(index, "name", e.target.value)}
                        />
                        <EditorialInput
                          label={t('editor.techStack')}
                          placeholder={t('editor.techStackPlaceholder')}
                          value={techInputs[index] ?? (proj.technologies?.join(", ") || "")}
                          onChange={(e) => setTechInputs(prev => { const n = [...prev]; n[index] = e.target.value; return n; })}
                          onBlur={(e) => updateProject(index, "technologies", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                        />
                        <div className="grid sm:grid-cols-2 gap-5">
                          <MonthPicker
                            label={t('editor.startDate')}
                            value={proj.startDate || ""}
                            onChange={(value) => updateProject(index, "startDate", value)}
                          />
                          <MonthPicker
                            label={t('editor.endDate')}
                            value={proj.endDate || ""}
                            onChange={(value) => updateProject(index, "endDate", value)}
                          />
                        </div>
                        <EditorialInput
                          label={t('editor.projectLink')}
                          value={proj.url || ""}
                          onChange={(e) => updateProject(index, "url", e.target.value)}
                          placeholder="https://..."
                        />
                        <EditorialTextarea
                          label={t('editor.descriptionImpact')}
                          rows={4}
                          value={proj.bullets?.join("\n") || ""}
                          onChange={(e) => updateProject(index, "bullets", e.target.value.split("\n"))}
                        />
                      </div>
                    </EditorialCard>
                  ))}
                  <button
                    onClick={addProject}
                    className="w-full py-4 border-2 border-dashed border-stone-300 rounded-sm text-stone-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/20 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    {t('editor.addProject')}
                  </button>
                </div>
              )}

              {/* EDUCATION TAB */}
              {activeTab === "education" && (
                <div className="space-y-6">
                  {educations.map((edu, index) => (
                    <EditorialCard key={index} title={`${t('editor.fullEducation')} ${index + 1}`}
                      action={<button onClick={() => removeEducation(index)} className="text-stone-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                    >
                      <div className="space-y-5">
                        <EditorialInput
                          label={t('editor.degreeCertificate')}
                          placeholder={t('editor.degreePlaceholder')}
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, "degree", e.target.value)}
                        />
                        <EditorialInput
                          label={t('editor.institution')}
                          placeholder={t('editor.institutionPlaceholder')}
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, "institution", e.target.value)}
                        />
                        <div className="grid sm:grid-cols-2 gap-5">
                          <EditorialInput
                            label={t('editor.location')}
                            placeholder={t('editor.locationPlaceholder')}
                            value={edu.location || ""}
                            onChange={(e) => updateEducation(index, "location", e.target.value)}
                          />
                          <MonthPicker
                            label={t('editor.graduation')}
                            value={edu.graduationDate || ""}
                            onChange={(value) => updateEducation(index, "graduationDate", value)}
                          />
                        </div>
                        <EditorialInput
                          label={t('editor.gpaHonors')}
                          placeholder={t('editor.gpaPlaceholder')}
                          value={edu.gpa || ""}
                          onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                        />
                      </div>
                    </EditorialCard>
                  ))}
                  <button
                    onClick={addEducation}
                    className="w-full py-4 border-2 border-dashed border-stone-300 rounded-sm text-stone-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/20 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    {t('editor.addEducation')}
                  </button>
                </div>
              )}

              {/* SKILLS TAB */}
              {activeTab === "skills" && (
                <EditorialCard title={t('editor.skillsExpertise')}>
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <EditorialInput
                        placeholder={t('editor.addSkillPlaceholder')}
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                        headless
                        className="flex-1"
                      />
                      <Button variant="secondary" onClick={addSkill}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-3 min-h-[100px] p-4 bg-stone-50 rounded-sm border border-stone-100">
                      {skills.length === 0 && <span className="text-stone-400 italic">{t('editor.noSkillsYet')}</span>}
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-stone-200 text-stone-700 shadow-sm rounded-full text-sm font-medium animate-scale-in"
                        >
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="text-stone-400 hover:text-red-500 transition-colors">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </EditorialCard>
              )}

              {/* CERTIFICATIONS & LANGUAGES */}
              {(activeTab === "certifications" || activeTab === "languages") && (
                <EditorialCard title={activeTab === "certifications" ? t('editor.certificates') : t('editor.tabs.languages')}>
                  {activeTab === "certifications" && (
                    <div className="space-y-6">
                      {certifications.map((cert, index) => (
                        <div key={index} className="space-y-4 p-4 border border-stone-200 rounded-sm bg-white relative">
                          <button onClick={() => removeCertification(index)} className="absolute top-4 right-4 text-stone-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          <EditorialInput
                            label={t('editor.certificationName')}
                            value={cert.name}
                            onChange={(e) => updateCertification(index, "name", e.target.value)}
                          />
                          <div className="grid sm:grid-cols-2 gap-4">
                            <EditorialInput
                              label={t('editor.issuer')}
                              value={cert.issuer}
                              onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                            />
                            <MonthPicker
                              label={t('editor.date')}
                              value={cert.date}
                              onChange={(value) => updateCertification(index, "date", value)}
                            />
                          </div>
                          <EditorialInput
                            label="URL (opcional)"
                            placeholder="https://www.credly.com/badges/..."
                            value={cert.url || ""}
                            onChange={(e) => updateCertification(index, "url", e.target.value)}
                          />
                        </div>
                      ))}
                      <Button variant="ghost" onClick={addCertification} className="w-full">{t('editor.addCertificate')}</Button>
                    </div>
                  )}

                  {activeTab === "languages" && (
                    <div className="space-y-4">
                      {languages.map((lang, index) => (
                        <div key={index} className="grid sm:grid-cols-2 gap-4 p-4 border border-stone-200 rounded-sm bg-white relative">
                          <EditorialInput
                            value={lang.name}
                            onChange={(e) => updateLanguage(index, "name", e.target.value)}
                            placeholder="Language"
                            headless
                          />
                          <div className="flex gap-2">
                            <select
                              value={lang.level}
                              onChange={(e) => updateLanguage(index, "level", e.target.value)}
                              className="w-full px-3 py-2 border-b border-stone-300 bg-transparent focus:border-orange-500 focus:outline-none"
                            >
                              {[{ value: "native", label: t('editor.nativeSpeaker') },
                              { value: "fluent", label: t('editor.fluent') },
                              { value: "advanced", label: t('editor.advanced') },
                              { value: "intermediate", label: t('editor.intermediate') },
                              { value: "basic", label: t('editor.basicKnowledge') }].map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                            <button onClick={() => removeLanguage(index)} className="text-stone-400 hover:text-red-500 px-2">×</button>
                          </div>
                        </div>
                      ))}
                      <Button variant="ghost" onClick={addLanguage} className="w-full">{t('editor.addLanguage')}</Button>
                    </div>
                  )}
                </EditorialCard>
              )}
            </motion.div>

            {/* The Document (Live Preview) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`lg:col-span-6 sticky top-36 ${showMobilePreview ? 'block' : 'hidden'} lg:block`}
            >
              <div className="relative group perspective-1000">
                {/* Stack effects - only show on lg to save rendering on mobile if needed, or keep for effect */}
                <div className="absolute inset-0 bg-stone-900/5 translate-y-2 translate-x-2 rounded-sm -z-10" />
                <div className="absolute inset-0 bg-stone-900/5 translate-y-4 translate-x-4 rounded-sm -z-20" />

                <div className="bg-white rounded-sm shadow-xl border border-stone-100 p-12 min-h-[800px] transition-transform duration-500 group-hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-8 opacity-50 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-mono">{t('editor.livePreview')}</span>
                    {atsScore !== null && <span className="text-[10px] uppercase tracking-widest text-green-600 font-mono">{t('editor.atsOptimized')} • {atsScore}%</span>}
                  </div>

                  <div className="space-y-6 text-stone-900" style={{ fontSize: '11px' }}>
                    {/* Resume Header */}
                    <div className="text-center pb-6 border-b border-stone-200">
                      <h1 className="font-display font-bold text-2xl mb-2 text-stone-900">{personalInfo.fullName || t('editor.yourName')}</h1>
                      <div className="flex flex-wrap justify-center gap-3 text-stone-500 font-serif italic">
                        {personalInfo.location && <span>{personalInfo.location}</span>}
                        {personalInfo.email && (
                          <a href={`mailto:${personalInfo.email}`} className="hover:text-orange-600 transition-colors">
                            {personalInfo.email}
                          </a>
                        )}
                        {personalInfo.phone && (
                          <a
                            href={`https://wa.me/${(() => { const digits = personalInfo.phone.replace(/\D/g, ''); const hasPlus = personalInfo.phone.trim().startsWith('+'); if (hasPlus || (digits.startsWith('55') && digits.length >= 12)) return digits; return '55' + digits; })()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-600 transition-colors"
                          >
                            {personalInfo.phone}
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 text-orange-600 font-medium mt-2">
                        {personalInfo.linkedin && (
                          <a
                            href={sanitizeUrl(personalInfo.linkedin)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-700 transition-colors underline"
                          >
                            {personalInfo.linkedin.replace(/^https?:\/\//i, '')}
                          </a>
                        )}
                        {personalInfo.github && (
                          <a
                            href={sanitizeUrl(personalInfo.github)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-700 transition-colors underline"
                          >
                            {personalInfo.github.replace(/^https?:\/\//i, '')}
                          </a>
                        )}
                        {personalInfo.website && (
                          <a
                            href={sanitizeUrl(personalInfo.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-700 transition-colors underline"
                          >
                            {personalInfo.website.replace(/^https?:\/\//i, '')}
                          </a>
                        )}
                      </div>
                    </div>


                    {/* Sections */}
                    {summary && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-800 mb-2">{t('editor.profile')}</h3>
                        <p className="leading-relaxed text-stone-600">{summary}</p>
                      </section>
                    )}

                    {experiences.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-800 mb-3">{t('editor.experience')}</h3>
                        <div className="space-y-4">
                          {experiences.filter(e => e.title).map((exp, i) => (
                            <div key={i}>
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold text-stone-900">{exp.title}</h4>
                                <span className="text-stone-500 italic">{exp.startDate} – {exp.current ? t('editor.present') : exp.endDate}</span>
                              </div>
                              <div className="text-stone-600 font-medium mb-1">{exp.company}, {exp.location}</div>
                              <ul className="list-disc list-outside ml-4 space-y-1 text-stone-600">
                                {exp.bullets?.filter(Boolean).map((b, j) => (
                                  <li key={j}>{b}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Other sections (Projects, Education, Skills) simplified for visual preview */}
                    {(projects.length > 0 || educations.length > 0 || skills.length > 0) && (
                      <div className="pt-4 border-t border-stone-100 flex justify-center text-stone-400 italic">
                        {t('editor.additionalSections')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

    </div>
  );
}

// -----------------------------------------------------------------------------
// Editorial Components (Local Overrides)
// -----------------------------------------------------------------------------

function EditorialCard({ title, children, action }: { title: string, children: React.ReactNode, action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 shadow-sm p-8 rounded-sm relative group overflow-hidden transition-all hover:shadow-md">
      {/* Corner Accent */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-stone-200 group-hover:border-orange-400 transition-colors" />

      <div className="flex justify-between items-center mb-6">
        <h3 className="font-display font-semibold text-xl text-stone-900 tracking-tight">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function EditorialInput({ label, headless, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, headless?: boolean }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {!headless && label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">
          {label} {props.required && <span className="text-orange-500">*</span>}
        </label>
      )}
      <input
        className="w-full py-3 bg-transparent border-b border-stone-300 focus:border-orange-600 focus:outline-none transition-colors font-serif text-lg placeholder-stone-400 text-stone-900"
        {...props}
      />
    </div>
  );
}

function EditorialTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">
          {label} {props.required && <span className="text-orange-500">*</span>}
        </label>
      )}
      <textarea
        className="w-full p-4 bg-white/80 border border-stone-300 rounded-sm focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-serif leading-relaxed text-stone-800 placeholder-stone-400"
        {...props}
      />
    </div>
  );
}

function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md', className?: string }) {
  const s = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8';
  return <Loader2 className={`animate-spin text-orange-600 ${s} ${className}`} />;
}
