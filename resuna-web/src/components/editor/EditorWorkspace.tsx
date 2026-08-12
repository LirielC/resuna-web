"use client";

import { FileText } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { useTranslation } from "@/contexts/LanguageContext";
import { EditorBottomBar } from "@/components/editor/EditorBottomBar";
import { EditorForm } from "@/components/editor/EditorForm";
import { EditorSectionNavigation } from "@/components/editor/EditorSectionNavigation";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import type { ResumeEditor } from "@/hooks/useResumeEditor";

export function EditorWorkspace({ editor, resumeId }: { editor: ResumeEditor; resumeId: string }) {
  const { t } = useTranslation();
  return <div className="min-h-screen bg-background text-stone-900"><GrainOverlay /><Header /><main className="relative z-10 pb-20 pt-24 lg:pt-32"><div className="fixed bottom-6 right-6 z-50 lg:hidden"><Button onClick={() => editor.setShowMobilePreview(!editor.showMobilePreview)} className="rounded-full bg-stone-900 px-6 py-4 text-white hover:bg-orange-600"><FileText className="mr-2 h-5 w-5" />{editor.showMobilePreview ? t("editor.edit") : t("editor.preview")}</Button></div><EditorToolbar editor={editor} /><div className="container-custom"><div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-12"><EditorSectionNavigation active={editor.activeSection} onChange={editor.setActiveSection} /><div className={`space-y-8 lg:col-span-5 ${editor.showMobilePreview ? "hidden lg:block" : "block"}`}><EditorForm editor={editor} /></div><div className={`sticky top-36 lg:col-span-5 ${editor.showMobilePreview ? "block" : "hidden lg:block"}`}><ResumePreview template={editor.template} onTemplateChange={editor.setTemplate} personalInfo={editor.personalInfo} summary={editor.summary} experiences={editor.experiences} projects={editor.projects} educations={editor.educations} skills={editor.skills} certifications={editor.certifications} languages={editor.languages} /></div></div><EditorBottomBar editor={editor} resumeId={resumeId} /></div></main></div>;
}
