"use client";

import { Award, Briefcase, FolderKanban, GraduationCap, Languages, UserRound, Wrench } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import type { EditorSection } from "@/hooks/useResumeEditor";

const sections: Array<{ id: EditorSection; icon: typeof UserRound; required?: boolean }> = [
  { id: "basics", icon: UserRound, required: true }, { id: "experience", icon: Briefcase }, { id: "projects", icon: FolderKanban },
  { id: "education", icon: GraduationCap }, { id: "skills", icon: Wrench }, { id: "certifications", icon: Award }, { id: "languages", icon: Languages },
];

export function EditorSectionNavigation({ active, onChange }: { active: EditorSection; onChange: (section: EditorSection) => void }) {
  const { t } = useTranslation();
  return <aside className="hidden lg:block sticky top-36"><div className="rounded-2xl border border-stone-200 bg-white/80 p-3 shadow-sm">
    <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">{t("editor.sections")}</p>
    <nav aria-label={t("editor.sections")} className="space-y-1">{sections.map(({ id, icon: Icon, required }) => <button key={id} type="button" onClick={() => onChange(id)} aria-current={active === id ? "step" : undefined} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${active === id ? "bg-orange-50 font-semibold text-orange-700" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"}`}><Icon className="h-4 w-4" aria-hidden="true" /><span className="truncate">{t(`editor.tabs.${id}`)}</span>{required && <span className="ml-auto text-orange-500">*</span>}</button>)}</nav>
  </div></aside>;
}
