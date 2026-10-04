"use client";

import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { useMemo } from "react";
import { validateResumeJsonc } from "@/lib/resume/jsonc";
import type { ResumeEditor } from "@/hooks/useResumeEditor";

export default function JsoncEditor({ editor }: { editor: ResumeEditor }) {
  const extensions = useMemo(() => [
    json(),
    lintGutter(),
    linter((view): Diagnostic[] => validateResumeJsonc(view.state.doc.toString()).diagnostics.map((item) => ({
      from: Math.min(item.offset, view.state.doc.length),
      to: Math.min(item.offset + item.length, view.state.doc.length),
      severity: item.severity,
      message: item.message,
    }))),
  ], []);

  return <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#101820] text-stone-100">
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
      <span className="font-mono text-xs font-semibold text-stone-200">curriculo.jsonc</span>
      <span className="text-[10px] uppercase tracking-[0.16em] text-stone-500">JSONC · UTF-8</span>
    </div>
    <div
      className="min-h-0 flex-1 overflow-auto"
      onKeyDownCapture={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void editor.save(); }
        if (event.shiftKey && event.altKey && event.key.toLowerCase() === "f") { event.preventDefault(); editor.formatJsonc(); }
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); editor.validate(); }
      }}
    >
      <CodeMirror
        value={editor.source}
        onChange={editor.setSource}
        extensions={extensions}
        height="100%"
        minHeight="620px"
        theme="dark"
        basicSetup={{ foldGutter: true, highlightActiveLine: true, highlightActiveLineGutter: true, autocompletion: true, searchKeymap: true }}
        aria-label="Documento JSONC do currículo"
        className="h-full text-[13px] leading-6 [&_.cm-editor]:h-full [&_.cm-editor]:bg-[#101820] [&_.cm-scroller]:font-mono"
      />
    </div>
    <div className="flex min-h-9 shrink-0 items-center border-t border-white/10 px-4 text-xs">
      {editor.diagnostics.length > 0
        ? <span className="text-red-300">{editor.diagnostics[0].message} · linha {editor.diagnostics[0].line}, coluna {editor.diagnostics[0].column}</span>
        : <span className="text-emerald-300">Documento válido. O preview acompanha suas alterações.</span>}
    </div>
  </section>;
}
