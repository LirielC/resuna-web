"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  FileDown,
  Trash2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { aiApi, coverLetterApi, resumeApi } from "@/lib/api";
import type { CoverLetter, Resume } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import TurnstileWrapper from "@/components/Turnstile";

const THEME = {
  bg: "bg-[#F8F6F1]",
  fontHeading: "font-serif",
  fontBody: "font-sans",
};

type Stage = "form" | "editor";

function assembleContent(
  greeting: string,
  body: string,
  farewell: string,
  signerName: string
): string {
  return `${greeting}\n\n${body}\n\n${farewell}\n${signerName}`.trim();
}

interface ContentSections {
  greeting: string;
  body: string;
  farewell: string;
  signerName: string;
}

function parseContent(content: string, fallbackName: string): ContentSections {
  if (!content.trim()) {
    return { greeting: "", body: "", farewell: "Atenciosamente,", signerName: fallbackName };
  }

  const parts = content.split("\n\n");

  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1];
    const lastLines = lastPart.split("\n");
    return {
      greeting: parts[0],
      body: parts.slice(1, -1).join("\n\n"),
      farewell: lastLines.length >= 2 ? lastLines[0] : "Atenciosamente,",
      signerName:
        lastLines.length >= 2
          ? lastLines.slice(1).join("\n")
          : fallbackName || lastPart,
    };
  }

  // Legacy single-block format — put everything in body
  return { greeting: "", body: content, farewell: "Atenciosamente,", signerName: fallbackName };
}

export default function CoverLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [resume, setResume] = useState<Resume | null>(null);
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [currentLetterId, setCurrentLetterId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("form");

  // Form fields (step 1)
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Editor fields (step 2)
  const [applicantName, setApplicantName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [body, setBody] = useState("");
  const [farewell, setFarewell] = useState("Atenciosamente,");
  const [signerName, setSignerName] = useState("");

  // AI refinement
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState<string | null>(
    turnstileSiteKey ? null : ""
  );
  const [isRefining, setIsRefining] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Auto-save debounce
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [r, cls] = await Promise.all([
        resumeApi.getById(id),
        coverLetterApi.getByResume(id),
      ]);
      setResume(r);
      setLetters(cls);

      const fullName = r.personalInfo?.fullName || "";
      setApplicantName(fullName);
      setSignerName(fullName);

      if (cls.length > 0) {
        loadLetterIntoEditor(cls[0], r);
      }
      // if no saved letters, remain on form
    } catch {
      // stay on form
    }
  };

  const loadLetterIntoEditor = useCallback(
    (letter: CoverLetter, r?: Resume) => {
      const fallbackName = (r || resume)?.personalInfo?.fullName || "";
      const parsed = parseContent(letter.content || "", fallbackName);

      // If content was empty (just created), pre-fill greeting from letter metadata
      if (!letter.content?.trim()) {
        const greetingText = letter.hiringManager
          ? `Prezado(a) ${letter.hiringManager},`
          : `À ${letter.company},`;
        setGreeting(greetingText);
        setBody("");
        setFarewell("Atenciosamente,");
        setSignerName(fallbackName);
      } else {
        setGreeting(parsed.greeting);
        setBody(parsed.body);
        setFarewell(parsed.farewell || "Atenciosamente,");
        setSignerName(parsed.signerName || fallbackName);
      }

      setApplicantName(fallbackName);
      setCurrentLetterId(letter.id || null);
      setCompany(letter.company);
      setJobTitle(letter.jobTitle);
      setRecruiterName(letter.hiringManager || "");
      setJobDescription(letter.jobDescription || "");
      setAiError(null);
      setStage("editor");
    },
    [resume]
  );

  const scheduleAutoSave = useCallback(
    (
      g: string,
      b: string,
      f: string,
      s: string,
      letterId: string | null
    ) => {
      if (!letterId) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        const content = assembleContent(g, b, f, s);
        await coverLetterApi.update(letterId, content);
        setLetters((prev) =>
          prev.map((l) => (l.id === letterId ? { ...l, content } : l))
        );
      }, 800);
    },
    []
  );

  const handleEditorChange = (
    field: "greeting" | "body" | "farewell" | "signerName",
    value: string
  ) => {
    const next = {
      greeting: field === "greeting" ? value : greeting,
      body: field === "body" ? value : body,
      farewell: field === "farewell" ? value : farewell,
      signerName: field === "signerName" ? value : signerName,
    };

    if (field === "greeting") setGreeting(value);
    if (field === "body") setBody(value);
    if (field === "farewell") setFarewell(value);
    if (field === "signerName") setSignerName(value);

    scheduleAutoSave(next.greeting, next.body, next.farewell, next.signerName, currentLetterId);
  };

  const handleStartEditor = async () => {
    if (!user || !company || !jobTitle || !jobDescription) return;

    const fullName = resume?.personalInfo?.fullName || "";
    const greetingText = recruiterName
      ? `Prezado(a) ${recruiterName},`
      : `À ${company},`;

    const newLetter = await coverLetterApi.create({
      userId: user.uid,
      resumeId: id,
      jobTitle,
      company,
      hiringManager: recruiterName || undefined,
      jobDescription,
      tone: "professional",
      content: "",
    });

    setLetters((prev) => [newLetter, ...prev]);
    setCurrentLetterId(newLetter.id || null);
    setGreeting(greetingText);
    setBody("");
    setFarewell("Atenciosamente,");
    setSignerName(fullName);
    setApplicantName(fullName);
    setAiError(null);
    setStage("editor");
  };

  const handleRefineWithAI = async () => {
    if (!body.trim() || captchaToken === null) return;

    setIsRefining(true);
    setAiError(null);

    try {
      const fullContent = assembleContent(greeting, body, farewell, signerName);
      const result = await aiApi.generateCoverLetter({
        resumeId: id,
        targetRole: jobTitle,
        companyName: company,
        jobDescription,
        captchaToken: captchaToken || undefined,
        applicantName,
        existingContent: fullContent,
      });

      setCaptchaToken(turnstileSiteKey ? null : "");

      const fallbackName = resume?.personalInfo?.fullName || "";
      const refined = result.coverLetter;
      const parsed = parseContent(refined, fallbackName);

      setGreeting(parsed.greeting || greeting);
      setBody(parsed.body || refined);
      setFarewell(parsed.farewell || farewell);
      setSignerName(parsed.signerName || signerName);

      scheduleAutoSave(
        parsed.greeting || greeting,
        parsed.body || refined,
        parsed.farewell || farewell,
        parsed.signerName || signerName,
        currentLetterId
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const isUnavailable =
        msg.includes("503") ||
        msg.includes("429") ||
        msg.toLowerCase().includes("unavailable") ||
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("openrouter");

      setAiError(
        isUnavailable
          ? "O serviço de IA está temporariamente indisponível (API gratuita). Sua carta foi mantida — você pode baixá-la agora ou tentar refinar novamente mais tarde."
          : err instanceof Error
          ? err.message
          : "Erro ao refinar. Tente novamente."
      );
    } finally {
      setIsRefining(false);
    }
  };

  const handleDelete = async (id: string) => {
    await coverLetterApi.delete(id);
    const remaining = letters.filter((l) => l.id !== id);
    setLetters(remaining);
    if (currentLetterId === id) {
      if (remaining.length > 0) {
        loadLetterIntoEditor(remaining[0]);
      } else {
        setCurrentLetterId(null);
        setStage("form");
        setCompany("");
        setJobTitle("");
        setRecruiterName("");
        setJobDescription("");
        setGreeting("");
        setBody("");
      }
    }
  };

  const handleDownloadPdf = async () => {
    const content = assembleContent(greeting, body, farewell, signerName);
    if (!content.trim()) return;

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });

    // ABNT-style margins
    const marginLeft = 30;
    const marginRight = 20;
    const marginTop = 25;
    const marginBottom = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - marginLeft - marginRight;
    const lineHeight = 7;

    pdf.setFont("times", "normal");
    pdf.setFontSize(12);

    let y = marginTop;

    // Date aligned right
    const dateStr = new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    pdf.text(dateStr, pageWidth - marginRight, y, { align: "right" });
    y += lineHeight * 2;

    const sections = content.split("\n\n");

    const addLine = (text: string, justify: boolean) => {
      const wrapped = pdf.splitTextToSize(text, maxWidth);
      for (let i = 0; i < wrapped.length; i++) {
        if (y > pageHeight - marginBottom) {
          pdf.addPage();
          y = marginTop;
        }
        // Last wrapped line of a paragraph is always left-aligned
        const align = justify && i < wrapped.length - 1 ? "justify" : "left";
        pdf.text(wrapped[i], marginLeft, y, { align, maxWidth });
        y += lineHeight;
      }
    };

    for (let si = 0; si < sections.length; si++) {
      const isBody = si > 0 && si < sections.length - 1;
      const lines = sections[si].split("\n");

      for (const line of lines) {
        if (!line.trim()) {
          y += lineHeight * 0.5;
          continue;
        }
        addLine(line, isBody);
      }
      y += lineHeight;
    }

    const filename = `carta-${company}-${jobTitle}`
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .toLowerCase();
    pdf.save(`${filename}.pdf`);
  };

  const handleDownloadDocx = async () => {
    const content = assembleContent(greeting, body, farewell, signerName);
    if (!content.trim()) return;

    const { Document, Packer, Paragraph, TextRun, AlignmentType } =
      await import("docx");

    const dateStr = new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const children: InstanceType<typeof Paragraph>[] = [];

    // Date right-aligned
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: dateStr, font: "Times New Roman", size: 24 }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 },
      })
    );

    const sections = content.split("\n\n");

    for (let si = 0; si < sections.length; si++) {
      const isBody = si > 0 && si < sections.length - 1;
      const lines = sections[si].split("\n");

      for (const line of lines) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: line, font: "Times New Roman", size: 24 }),
            ],
            alignment: isBody ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
            spacing: { after: 200, line: 276 },
          })
        );
      }
      // Paragraph spacer
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 200 },
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1418, bottom: 1134, left: 1701, right: 1134 },
            },
          },
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `carta-${company}-${jobTitle}`
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .toLowerCase();
    a.download = `${filename}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isFormValid = company.trim() && jobTitle.trim() && jobDescription.trim();
  const canRefine = body.trim().length > 0 && captchaToken !== null && !isRefining;
  const hasContent =
    body.trim().length > 0 || greeting.trim().length > 0;

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900`}>
      <Header />

      <main className="relative z-10 pt-24 lg:pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <Link
            href={`/resumes/${id}`}
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao currículo
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-2xl lg:text-3xl ${THEME.fontHeading} text-stone-900`}
                  >
                    Carta de Apresentação
                  </h1>
                  {resume && (
                    <p className="text-stone-500 text-sm mt-0.5">
                      Para o currículo:{" "}
                      <span className="font-medium text-stone-700">
                        {resume.title}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {stage === "editor" && (
                <Button
                  onClick={() => {
                    setStage("form");
                    setCurrentLetterId(null);
                    setCompany("");
                    setJobTitle("");
                    setRecruiterName("");
                    setJobDescription("");
                    setGreeting("");
                    setBody("");
                    setAiError(null);
                  }}
                  className="!bg-orange-600 hover:!bg-orange-700 !text-white !text-sm !px-4 !py-2 !rounded-xl"
                >
                  + Nova carta
                </Button>
              )}
            </div>
          </motion.div>

          {/* Saved letters list */}
          {letters.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {letters.map((l) => (
                <button
                  key={l.id}
                  onClick={() => loadLetterIntoEditor(l)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm border transition-all ${
                    currentLetterId === l.id && stage === "editor"
                      ? "bg-stone-800 text-white border-stone-800"
                      : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                  }`}
                >
                  {l.company} — {l.jobTitle}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Stage 1: Form */}
            {stage === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="!bg-white/80 backdrop-blur-sm border border-stone-200/60 !shadow-none">
                  <div className="p-6 lg:p-8 space-y-5">
                    <div>
                      <h2
                        className={`text-lg ${THEME.fontHeading} text-stone-800 mb-1`}
                      >
                        Dados da vaga
                      </h2>
                      <p className="text-stone-500 text-sm">
                        Preencha as informações da vaga para começar a escrever
                        sua carta.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                          Empresa <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Ex: Google"
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                          Cargo desejado <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="Ex: Engenheiro de Software"
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">
                        Nome do recrutador (opcional)
                      </label>
                      <input
                        type="text"
                        value={recruiterName}
                        onChange={(e) => setRecruiterName(e.target.value)}
                        placeholder="Ex: Ana Silva"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">
                        Descrição da vaga <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Cole aqui a descrição completa da vaga..."
                        rows={6}
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleStartEditor}
                        disabled={!isFormValid}
                        className="!bg-orange-600 hover:!bg-orange-700 !text-white !text-sm !px-6 !py-2.5 !rounded-xl disabled:!opacity-50"
                      >
                        Começar carta →
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Stage 2: Editor */}
            {stage === "editor" && (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Action bar */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="font-medium">{company}</span>
                    <span className="text-stone-400">·</span>
                    <span>{jobTitle}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <TurnstileWrapper
                      onSuccess={(token) => {
                        setCaptchaToken(token);
                        setAiError(null);
                      }}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                      size="compact"
                    />

                    <Button
                      onClick={handleRefineWithAI}
                      disabled={!canRefine}
                      title={
                        !body.trim()
                          ? "Escreva o corpo da carta primeiro"
                          : captchaToken === null
                          ? "Complete o CAPTCHA para refinar"
                          : ""
                      }
                      className="!bg-stone-800 hover:!bg-stone-900 !text-white !text-sm !px-3 !py-2 !rounded-xl gap-1.5 disabled:!opacity-40"
                    >
                      {isRefining ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Refinando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Refinar com IA
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleDownloadPdf}
                      disabled={!hasContent}
                      className="!bg-white !text-stone-600 !border !border-stone-200 hover:!bg-stone-50 !text-sm !px-3 !py-2 !rounded-xl gap-1.5 disabled:!opacity-40"
                    >
                      <FileDown className="w-4 h-4" />
                      PDF
                    </Button>

                    <Button
                      onClick={handleDownloadDocx}
                      disabled={!hasContent}
                      className="!bg-white !text-stone-600 !border !border-stone-200 hover:!bg-stone-50 !text-sm !px-3 !py-2 !rounded-xl gap-1.5 disabled:!opacity-40"
                    >
                      <FileDown className="w-4 h-4" />
                      DOCX
                    </Button>

                    <button
                      onClick={() =>
                        currentLetterId && handleDelete(currentLetterId)
                      }
                      className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* AI error banner */}
                {aiError && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>{aiError}</p>
                  </div>
                )}

                {/* Document editor */}
                <Card className="!bg-white border border-stone-200/60 !shadow-none">
                  <div className="p-6 lg:p-10 space-y-3 font-serif">
                    {/* Candidate name — top right */}
                    <div className="flex justify-end mb-4">
                      <input
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="text-sm text-stone-500 text-right bg-transparent border-b border-dashed border-stone-200 focus:outline-none focus:border-orange-300 w-64 py-0.5"
                      />
                    </div>

                    {/* Greeting */}
                    <div>
                      <input
                        type="text"
                        value={greeting}
                        onChange={(e) =>
                          handleEditorChange("greeting", e.target.value)
                        }
                        placeholder="Prezado(a) Recrutador(a),"
                        className="w-full text-stone-800 text-sm bg-transparent border-b border-dashed border-stone-200 focus:outline-none focus:border-orange-300 py-1"
                      />
                    </div>

                    {/* Body */}
                    <textarea
                      value={body}
                      onChange={(e) =>
                        handleEditorChange("body", e.target.value)
                      }
                      placeholder="Escreva o corpo da sua carta aqui..."
                      rows={16}
                      className="w-full text-stone-800 text-sm leading-7 bg-transparent resize-none focus:outline-none min-h-[320px] py-2"
                      spellCheck
                    />

                    {/* Farewell + signer */}
                    <div className="space-y-1 pt-2">
                      <input
                        type="text"
                        value={farewell}
                        onChange={(e) =>
                          handleEditorChange("farewell", e.target.value)
                        }
                        placeholder="Atenciosamente,"
                        className="w-full text-stone-800 text-sm bg-transparent border-b border-dashed border-stone-200 focus:outline-none focus:border-orange-300 py-1"
                      />
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) =>
                          handleEditorChange("signerName", e.target.value)
                        }
                        placeholder="Seu nome"
                        className="w-full text-stone-800 text-sm bg-transparent border-b border-dashed border-stone-200 focus:outline-none focus:border-orange-300 py-1"
                      />
                    </div>
                  </div>
                </Card>

                <p className="text-xs text-stone-400 text-center">
                  Edições salvas automaticamente · Exporta em Times New Roman com margens ABNT
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
