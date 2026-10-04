"use client";

import dynamic from "next/dynamic";
import { Eye, Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { EditorForm } from "@/components/editor/EditorForm";
import { EditorSectionNavigation } from "@/components/editor/EditorSectionNavigation";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import type { ResumeEditor } from "@/hooks/useResumeEditor";

const JsoncEditor = dynamic(() => import("@/components/editor/JsoncEditor"), { ssr: false, loading: () => <div className="flex flex-1 items-center justify-center bg-[#101820] text-sm text-stone-400">Carregando editor…</div> });

export function EditorWorkspace({ editor }: { editor: ResumeEditor; resumeId: string }) {
  const preview = <ResumePreview template={editor.template} onTemplateChange={editor.setTemplate} personalInfo={editor.personalInfo} summary={editor.summary} experiences={editor.experiences} projects={editor.projects} educations={editor.educations} skills={editor.skills} certifications={editor.certifications} languages={editor.languages} />;

  return <div className="min-h-screen bg-[#eeece7] text-stone-900">
    <Header />
    <main className="flex h-screen flex-col pt-16 lg:pt-20">
      <EditorToolbar editor={editor} />
      <div className="relative grid min-h-0 flex-1 lg:grid-cols-2">
        <section className={`${editor.showMobilePreview ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-stone-300 bg-[#f7f5f0]`} aria-label="Editor do currículo">
          {editor.editorMode === "jsonc"
            ? <JsoncEditor editor={editor} />
            : <div className="grid min-h-0 flex-1 lg:grid-cols-[13rem_minmax(0,1fr)]"><div className="hidden overflow-y-auto border-r border-stone-200 p-4 lg:block"><EditorSectionNavigation active={editor.activeSection} onChange={editor.setActiveSection} /></div><div className="overflow-y-auto p-5 lg:p-8"><div className="mx-auto max-w-2xl"><EditorForm editor={editor} /></div></div></div>}
        </section>
        <section className={`${editor.showMobilePreview ? "block" : "hidden lg:block"} min-h-0 overflow-y-auto bg-[#d8d5ce] p-3 sm:p-5 lg:p-7`} aria-label="Visualização do currículo">
          <div className="mx-auto max-w-[820px]">{preview}</div>
        </section>
        <button type="button" onClick={() => editor.setShowMobilePreview(!editor.showMobilePreview)} className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-xl lg:hidden">
          {editor.showMobilePreview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{editor.showMobilePreview ? "Editar" : "Visualizar"}
        </button>
      </div>
    </main>
  </div>;
}
