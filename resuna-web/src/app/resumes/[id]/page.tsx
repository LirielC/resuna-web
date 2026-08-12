"use client";

import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { useResumeEditor } from "@/hooks/useResumeEditor";
import { useTranslation } from "@/contexts/LanguageContext";
import { THEME } from "@/lib/theme";

export default function ResumeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useTranslation();
  const editor = useResumeEditor(id, t, locale);

  if (editor.isLoading) {
    return <div className={`flex min-h-screen items-center justify-center ${THEME.bg}`}><p className="text-stone-500">{t("editor.preparingWorkspace")}</p></div>;
  }

  if (editor.error && !editor.resume) {
    return <div className={`min-h-screen ${THEME.bg}`}><Header /><main className="container-custom pt-32 text-center"><h1 className="mb-4 text-3xl font-semibold">{t("editor.unableToLoad")}</h1><p className="mx-auto mb-8 max-w-md text-stone-600">{editor.error}</p><Link href="/resumes"><Button>{t("editor.returnToDashboard")}</Button></Link></main></div>;
  }

  return <EditorWorkspace editor={editor} resumeId={id} />;
}
