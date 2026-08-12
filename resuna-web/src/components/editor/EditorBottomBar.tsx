"use client";

import Link from "next/link";
import { Briefcase, Check, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/contexts/LanguageContext";
import type { ResumeEditor } from "@/hooks/useResumeEditor";

export function EditorBottomBar({ editor, resumeId }: { editor: ResumeEditor; resumeId: string }) {
  const { t } = useTranslation();
  return <div className="sticky bottom-4 z-30 mt-10 rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur-md"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3 px-2 text-sm text-stone-600"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-700"><Check className="h-4 w-4" /></span><span>{t("editor.completeness")}: <strong className="text-stone-900">{editor.completeness.score}%</strong>{editor.atsScore !== null && <span className="ml-2 text-stone-400">· ATS {editor.atsScore}</span>}</span></div><div className="flex flex-wrap gap-2"><Link href={`/resumes/${resumeId}/analyze`} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-orange-50 hover:text-orange-700"><Briefcase className="h-4 w-4" />{t("dashboard.analyzeJob")}</Link><Link href={`/resumes/${resumeId}/analyze`} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-orange-50 hover:text-orange-700"><Sparkles className="h-4 w-4" />{t("dashboard.aiRefine")}</Link><Button onClick={() => editor.download("pdf")} disabled={editor.downloadingPdf}><Download className="mr-2 h-4 w-4" />{t("common.downloadPdf")}</Button></div></div></div>;
}
