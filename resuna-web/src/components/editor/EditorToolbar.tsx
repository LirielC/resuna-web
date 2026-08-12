"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileDown, FileText, Globe, Loader2, Save } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import TurnstileWrapper from "@/components/Turnstile";
import type { EditorSection, ResumeEditor } from "@/hooks/useResumeEditor";

export function EditorToolbar({ editor }: { editor: ResumeEditor }) {
  const { t } = useTranslation();
  return <div className="sticky top-20 z-40 mb-12 border-b border-stone-200/60 bg-[#F8F6F1]/95 shadow-sm backdrop-blur-md"><div className="container-custom py-4">
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center"><div className="flex items-center gap-4"><Link href="/resumes" aria-label={t("common.backToResumes")} className="rounded-full p-2 text-stone-500 hover:bg-stone-200/50 hover:text-stone-900"><ArrowLeft className="h-5 w-5" /></Link><div><input value={editor.title} onChange={(event) => editor.setTitle(event.target.value)} className="w-full min-w-[200px] border-b border-transparent bg-transparent p-0 text-2xl font-semibold text-stone-900 placeholder-stone-400 focus:border-orange-500 focus:outline-none" placeholder={t("editor.untitledMasterpiece")} /><div className="mt-1 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-stone-500"><span className={editor.isSaving ? "text-orange-600" : ""}>{editor.isSaving ? t("editor.savingChanges") : t("editor.lastSaved", { time: editor.lastSaved })}</span><span className={editor.completeness.score >= 80 ? "text-green-600" : "text-orange-500"}>{editor.completeness.score}% completo</span>{editor.atsScore !== null && <span className="text-green-600">{t("editor.atsScore", { score: editor.atsScore })}</span>}</div></div></div>
      <div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => editor.download("pdf")} disabled={editor.downloadingPdf}><Download className="mr-2 h-4 w-4" />PDF</Button><Button variant="ghost" size="sm" onClick={() => editor.download("docx")} disabled={editor.downloadingDocx}><FileDown className="mr-2 h-4 w-4" />DOCX</Button><Button variant="ghost" size="sm" onClick={editor.translateResume} disabled={editor.isTranslating || (!!editor.turnstileSiteKey && !editor.translateCaptchaToken)}><Globe className="mr-2 h-4 w-4" />{editor.isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : "EN"}</Button><Button size="sm" onClick={editor.save} disabled={editor.isSaving}><Save className="mr-2 h-4 w-4" />{t("editor.saveDraft")}</Button></div>
    </div>
    {editor.turnstileSiteKey && <div className="mt-3 max-w-md"><p className="mb-2 text-xs text-stone-500">{t("editor.translateCaptchaHint")}</p><TurnstileWrapper size="compact" onSuccess={editor.setTranslateCaptchaToken} onError={() => editor.setTranslateCaptchaToken(null)} onExpire={() => editor.setTranslateCaptchaToken(null)} /></div>}
    {editor.error && <div role="alert" className="mt-3 rounded-sm border-l-2 border-red-500 bg-red-50 p-3 text-sm font-medium text-red-800">{editor.error}</div>}
    <div className="mt-6 flex gap-5 overflow-x-auto pb-1 lg:hidden">{(["basics", "experience", "projects", "education", "skills", "certifications", "languages"] as EditorSection[]).map((section) => <button key={section} type="button" onClick={() => editor.setActiveSection(section)} className={`whitespace-nowrap pb-2 text-sm ${editor.activeSection === section ? "border-b-2 border-orange-600 font-semibold text-stone-900" : "text-stone-500"}`}>{t(`editor.tabs.${section}`)}</button>)}</div>
  </div></div>;
}
