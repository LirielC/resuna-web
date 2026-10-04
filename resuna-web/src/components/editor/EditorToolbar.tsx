"use client";

import Link from "next/link";
import { ArrowLeft, Check, Code2, Download, FileDown, FileJson, Globe, Loader2, Save, Wand2 } from "lucide-react";
import { useRef } from "react";
import type { ResumeEditor } from "@/hooks/useResumeEditor";
import TurnstileWrapper from "@/components/Turnstile";

const actionClass = "inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50";

export function EditorToolbar({ editor }: { editor: ResumeEditor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const importFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".jsonc") || file.size > 1024 * 1024) {
      window.alert("Escolha um arquivo .jsonc de até 1 MB."); return;
    }
    if (editor.isDirty && !window.confirm("Substituir as alterações não salvas pelo arquivo importado?")) return;
    const source = await file.text();
    if (!editor.importJsonc(source)) { window.alert("O arquivo contém erros e não substituiu o currículo atual."); return; }
  };

  return <div className="border-y border-stone-200 bg-[#fbfaf7] px-3 py-2 lg:px-5">
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/resumes" aria-label="Voltar aos currículos" className="mr-1 rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="flex rounded-md border border-stone-200 bg-white p-0.5" role="group" aria-label="Modo de edição">
        <button type="button" onClick={() => editor.setEditorMode("visual")} aria-pressed={editor.editorMode === "visual"} className={`rounded px-3 py-1.5 text-xs font-semibold ${editor.editorMode === "visual" ? "bg-stone-900 text-white" : "text-stone-500"}`}>Visual</button>
        <button type="button" onClick={() => editor.setEditorMode("jsonc")} aria-pressed={editor.editorMode === "jsonc"} className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold ${editor.editorMode === "jsonc" ? "bg-stone-900 text-white" : "text-stone-500"}`}><Code2 className="h-3.5 w-3.5" />Código JSONC</button>
      </div>
      <div className="hidden min-w-0 flex-1 items-center gap-3 border-l border-stone-200 pl-3 sm:flex">
        {editor.editorMode === "visual"
          ? <input value={editor.title} onChange={(event) => editor.setTitle(event.target.value)} aria-label="Título do currículo" className="min-w-0 max-w-64 bg-transparent font-serif text-sm font-semibold text-stone-900 outline-none" />
          : <span className="truncate font-mono text-xs font-semibold text-stone-600">{(editor.title || "curriculo").replace(/\s+/g, "-").toLowerCase()}.jsonc</span>}
        <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${editor.isValid ? "text-emerald-700" : "text-red-700"}`}><span className={`h-2 w-2 rounded-full ${editor.isValid ? "bg-emerald-500" : "bg-red-500"}`} />{editor.isValid ? "JSONC válido" : `${editor.diagnostics.length} erro${editor.diagnostics.length === 1 ? "" : "s"}`}</span>
        <span className="shrink-0 text-xs text-stone-400">{editor.isDirty ? "Alterações não salvas" : "Salvo"}</span>
      </div>

      <button type="button" onClick={() => editor.validate()} className={actionClass}><Check className="h-3.5 w-3.5" />Validar</button>
      <button type="button" onClick={editor.formatJsonc} className={actionClass}><Wand2 className="h-3.5 w-3.5" />Formatar</button>
      <button type="button" onClick={() => fileRef.current?.click()} className={`${actionClass} hidden md:inline-flex`}><FileJson className="h-3.5 w-3.5" />Importar</button>
      <input ref={fileRef} type="file" accept=".jsonc,application/json" className="hidden" onChange={(event) => { void importFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      <button type="button" onClick={editor.exportJsonc} className={`${actionClass} hidden md:inline-flex`}><FileDown className="h-3.5 w-3.5" />Exportar</button>
      <button type="button" onClick={() => void editor.save()} disabled={editor.isSaving || !editor.isValid} className={actionClass}>{editor.isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Salvar</button>
      <button type="button" onClick={editor.downloadTypst} disabled={editor.downloadingTypst || !editor.isValid} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#c9573f] px-4 text-xs font-bold text-white transition hover:bg-[#a94431] disabled:opacity-50">{editor.downloadingTypst ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Baixar PDF</button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button type="button" onClick={editor.translateResume} disabled={editor.isTranslating || (!!editor.turnstileSiteKey && !editor.translateCaptchaToken)} className={`${actionClass} border-[#e8d5ca] text-[#8e4e32] hover:bg-[#fbf3ee]`}>
          {editor.isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          <span className="hidden sm:inline">Traduzir para inglês</span><span className="sm:hidden">Traduzir</span>
        </button>
        <button type="button" onClick={() => editor.download("docx")} disabled={editor.downloadingDocx} aria-label="Baixar DOCX" title="Baixar DOCX" className="rounded-md border border-stone-200 bg-white p-2 text-stone-500 hover:bg-stone-50 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600">{editor.downloadingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}</button>
      </div>
    </div>
    {editor.error && <p role="alert" className="mt-2 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-800">{editor.error}</p>}
    {editor.turnstileSiteKey && !editor.translateCaptchaToken && <div className="mt-2 flex items-center gap-3 text-xs text-stone-500"><span>Confirme para usar a tradução:</span><TurnstileWrapper size="compact" onSuccess={editor.setTranslateCaptchaToken} onError={() => editor.setTranslateCaptchaToken(null)} onExpire={() => editor.setTranslateCaptchaToken(null)} /></div>}
  </div>;
}
