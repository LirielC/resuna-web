"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Upload,
    FileText,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    Search,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { atsApi } from "@/lib/api";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

import { THEME } from "@/lib/theme";
import { GrainOverlay } from "@/components/ui/GrainOverlay";

// Type for the PDF analysis result
interface PDFAnalysisResult {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
    formatIssues: string[];
    extractedInfo: {
        name?: string;
        email?: string;
        phone?: string;
        skills: string[];
        totalCharacters: number;
    };
}

function isPdf(file?: File): file is File {
    return !!file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
}

export default function UploadResumePage() {
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PDFAnalysisResult | null>(null);
    const { t, locale: language } = useTranslation();
    const { user, loading: authLoading, signInWithGoogle } = useAuth();

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (isPdf(droppedFile)) {
            if (droppedFile.size > 5 * 1024 * 1024) setError("O PDF deve ter no máximo 5 MB.");
            else { setFile(droppedFile); setError(null); }
        } else {
            setError(t("upload.pleasePdf"));
        }
    }, [t]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (isPdf(selectedFile)) {
            if (selectedFile.size > 5 * 1024 * 1024) setError("O PDF deve ter no máximo 5 MB.");
            else { setFile(selectedFile); setError(null); }
        } else {
            setError(t("upload.pleasePdf"));
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError(t("upload.pleaseResumePdf"));
            return;
        }
        if (!jobDescription.trim()) {
            setError(t("upload.pleaseJobDesc"));
            return;
        }

        setError(null);

        try {
            if (!user) {
                setIsSigningIn(true);
                await signInWithGoogle();
                setIsSigningIn(false);
            }
            setIsAnalyzing(true);
            const analysisResult = await atsApi.analyzePdf(
                file,
                jobDescription,
                language
            ) as unknown as PDFAnalysisResult;

            setResult(analysisResult);
        } catch (err) {
            const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
            setError(code === "auth/popup-closed-by-user" ? "Entre na sua conta para iniciar a análise. Seus dados continuam preenchidos." : err instanceof Error ? err.message : t("upload.failedAnalyze"));
        } finally {
            setIsSigningIn(false);
            setIsAnalyzing(false);
        }
    };

    return (
        <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900 selection:bg-orange-100 selection:text-orange-900`}>
            <GrainOverlay />

            <Header />

            <main className="relative z-10 px-5 pb-20 pt-28 sm:px-8 lg:pt-32">
                <div className="mx-auto max-w-6xl">
                    <Link
                        href="/resumes"
                        className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-[#a64b28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('upload.backToArchives')}
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-9 max-w-2xl"
                    >
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600">
                            <Search className="h-3.5 w-3.5 text-[#a64b28]" aria-hidden="true" />
                            Compare currículo e vaga
                        </div>
                        <h1 className={`${THEME.fontDisplay} mb-3 text-4xl font-medium tracking-tight text-stone-900 sm:text-5xl`}>
                            Analisador ATS
                        </h1>
                        <p className="max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
                            Envie seu currículo em PDF e compare o conteúdo com os requisitos da vaga.
                        </p>
                    </motion.div>

                    {error && (
                        <div role="alert" className="mb-6 flex max-w-3xl items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {!result ? (
                        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="grid items-start gap-6 lg:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="resume-pdf" className="block text-sm font-semibold text-stone-800">Currículo em PDF</label>
                                    <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={`relative flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors group
                                        ${isDragging
                                            ? "border-orange-500 bg-orange-50"
                                            : file
                                                ? "border-emerald-300 bg-emerald-50/40"
                                                : "border-stone-300 bg-[#fbfaf7] hover:border-[#bd7656] hover:bg-[#fffdfa]"
                                        }
                                    `}
                                >
                                    <input
                                        id="resume-pdf"
                                        type="file"
                                        accept=".pdf"
                                        aria-label="Selecionar currículo em PDF (máximo 5 MB)"
                                        onChange={handleFileSelect}
                                        className="sr-only"
                                    />

                                    {file ? (
                                        <div className="flex flex-col items-center relative z-10 animate-fade-in-up">
                                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-700">
                                                <FileText className="h-6 w-6" strokeWidth={1.5} />
                                            </div>
                                            <p className="mb-1 max-w-[240px] truncate text-sm font-semibold text-stone-900">
                                                {file.name}
                                            </p>
                                            <p className="mb-3 text-xs text-stone-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB · Pronto para analisar
                                            </p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setFile(null);
                                                }}
                                                className="relative z-30 text-xs font-medium text-stone-500 underline underline-offset-2 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                                            >
                                                {t('upload.removeDocument')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center">
                                            <Upload className="mb-4 h-7 w-7 text-[#a64b28]" strokeWidth={1.5} />
                                            <label htmlFor="resume-pdf" className="cursor-pointer font-medium text-stone-900">Arraste o PDF ou clique para escolher</label>
                                            <p className="mt-2 text-xs text-stone-500">
                                                PDF · até 5 MB
                                            </p>
                                        </div>
                                    )}
                                </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="job-description" className="block text-sm font-semibold text-stone-800">Descrição da vaga</label>
                                    <textarea
                                        id="job-description"
                                        placeholder="Cole aqui as responsabilidades, requisitos e qualificações da vaga..."
                                        rows={10}
                                        maxLength={8000}
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        className="input-editorial min-h-64 resize-y leading-6"
                                    />
                                    <p className="text-right text-xs text-stone-500">{jobDescription.length}/8.000</p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col items-start gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs leading-5 text-stone-500">A análise começa após você entrar na conta. O arquivo e a descrição permanecem nesta página.</p>
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || isSigningIn || authLoading || !file || !jobDescription.trim()}
                                    className="h-11 w-full shrink-0 rounded-lg bg-[#a64b28] px-5 text-sm font-semibold text-white shadow-none hover:bg-[#8f4023] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 sm:w-auto"
                                >
                                    {isSigningIn ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando na sua conta…</>
                                    ) : isAnalyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analisando currículo…
                                        </>
                                    ) : (
                                        <>Analisar compatibilidade</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Results Section - The Report */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto max-w-5xl"
                        >
                            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                                <div className="flex flex-col gap-6 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:p-7">
                                    <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-[6px] border-[#e9d8ce] bg-[#fffaf7] text-center" role="progressbar" aria-label="Compatibilidade com a vaga" aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.score}>
                                        <span className="font-display text-3xl font-semibold text-stone-900">{result.score}%</span>
                                        <span className="text-[10px] text-stone-500">compatibilidade</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a64b28]">Resultado da análise</p>
                                        <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-stone-900">Seu currículo combina com esta vaga?</h2>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{result.score >= 80 ? "Há boa correspondência entre seu currículo e os requisitos encontrados." : result.score >= 60 ? "Alguns requisitos aparecem no currículo; veja os pontos que podem ser fortalecidos." : "Há requisitos importantes da vaga que ainda não aparecem com clareza no currículo."}</p>
                                    </div>
                                    <Button variant="secondary" onClick={() => { setResult(null); setFile(null); setJobDescription(""); }} className="h-10 shrink-0 rounded-lg px-4 text-sm">Analisar outra vaga</Button>
                                </div>

                                <div className="grid gap-0 md:grid-cols-2">
                                    <section className="border-b border-stone-100 p-5 sm:p-7 md:border-b-0 md:border-r" aria-labelledby="matched-keywords-heading">
                                        <h3 id="matched-keywords-heading" className="flex items-center gap-2 text-sm font-semibold text-stone-900"><CheckCircle className="h-4 w-4 text-emerald-700" aria-hidden="true"/>Requisitos encontrados</h3>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {result.matchedKeywords.length > 0 ? result.matchedKeywords.map((keyword) => <span key={keyword} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800">{keyword}</span>) : <span className="text-sm text-stone-500">Nenhuma correspondência identificada.</span>}
                                        </div>
                                    </section>
                                    <section className="p-5 sm:p-7" aria-labelledby="missing-keywords-heading">
                                        <h3 id="missing-keywords-heading" className="flex items-center gap-2 text-sm font-semibold text-stone-900"><X className="h-4 w-4 text-[#a64b28]" aria-hidden="true"/>Palavras-chave ausentes</h3>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {result.missingKeywords.length > 0 ? result.missingKeywords.map((keyword) => <span key={keyword} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-[#8e4e32]">{keyword}</span>) : <span className="text-sm text-stone-500">Nenhuma palavra-chave importante ausente.</span>}
                                        </div>
                                    </section>
                                </div>

                                <section className="border-t border-stone-100 bg-[#fbfaf7] p-5 sm:p-7" aria-labelledby="suggestions-heading">
                                    <h3 id="suggestions-heading" className="text-sm font-semibold text-stone-900">Sugestões para adaptar seu currículo</h3>
                                    {result.suggestions.length > 0 ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600">{result.suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`}>{suggestion}</li>)}</ul> : <p className="mt-2 text-sm text-stone-600">Não há sugestões adicionais para esta análise.</p>}
                                </section>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}

