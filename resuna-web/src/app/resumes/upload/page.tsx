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
    Sparkles,
    X,
    Search,
    Stamp,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { atsApi, subscriptionApi } from "@/lib/api";
import { useTranslation } from "@/contexts/LanguageContext";

// Design System: Editorial Luxury
const THEME = {
    bg: "bg-[#F8F6F1]", // Cream Paper
    text: "text-stone-900",
    textMuted: "text-stone-500",
    accent: "text-orange-600",
    border: "border-stone-200",
    fontDisplay: "font-display", // Playfair Display
    fontBody: "font-serif", // Crimson Pro / Source Serif
};

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

export default function UploadResumePage() {
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PDFAnalysisResult | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const { t, locale: language } = useTranslation();

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === "application/pdf") {
            setFile(droppedFile);
            setError(null);
        } else {
            setError(t("upload.pleasePdf"));
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile?.type === "application/pdf") {
            setFile(selectedFile);
            setError(null);
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

        setIsAnalyzing(true);
        setError(null);

        try {
            const analysisResult = await atsApi.analyzePdf(
                file,
                jobDescription,
                language
            ) as unknown as PDFAnalysisResult;

            setResult(analysisResult);
            try {
                const credits = await subscriptionApi.getCredits();
                setToastMessage(t('common.creditUsedRemaining', { count: credits.creditsRemaining }));
            } catch {
                setToastMessage(t('common.creditUsed'));
            }
        } catch (err: any) {
            setError(err.message || t("upload.failedAnalyze"));
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900 selection:bg-orange-100 selection:text-orange-900`}>
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            {/* Texture Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            <Header />

            <main className="relative z-10 pt-24 lg:pt-32 pb-20">
                <div className="container-custom max-w-5xl">
                    <Link
                        href="/resumes"
                        className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-8 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('upload.backToArchives')}
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center mb-12 text-center"
                    >
                        <div className="w-16 h-16 rounded-full border border-stone-300 bg-white flex items-center justify-center mb-6 shadow-sm">
                            <Search className="w-6 h-6 text-stone-900" />
                        </div>
                        <h1 className={`${THEME.fontDisplay} text-4xl lg:text-5xl font-medium text-stone-900 tracking-tight mb-4`}>
                            {t('upload.resumeReview')}
                        </h1>
                        <p className="text-stone-600 font-serif text-lg max-w-2xl text-center leading-relaxed">
                            {t('upload.reviewSubtitle')}
                        </p>
                    </motion.div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 text-red-800 border-l-2 border-red-500 rounded-sm flex items-center gap-3 max-w-3xl mx-auto">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {!result ? (
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                            {/* Upload Section (Tray) */}
                            <div className="space-y-4">
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 pl-1">
                                    {t('upload.theManuscript')}
                                </label>
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={`
                                        relative h-80 border-2 border-dashed rounded-sm transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 group
                                        ${isDragging
                                            ? "border-orange-500 bg-orange-50/50 scale-[1.02]"
                                            : file
                                                ? "border-stone-900 bg-white shadow-md"
                                                : "border-stone-300 bg-stone-50/50 hover:border-stone-400 hover:bg-stone-100"
                                        }
                                    `}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    />

                                    {file ? (
                                        <div className="flex flex-col items-center relative z-10 animate-fade-in-up">
                                            <div className="w-16 h-20 bg-white border border-stone-200 shadow-sm flex items-center justify-center mb-4 relative">
                                                <div className="absolute top-0 right-0 w-4 h-4 bg-stone-100 border-l border-b border-stone-200" />
                                                <FileText className="w-8 h-8 text-stone-800" strokeWidth={1} />
                                            </div>
                                            <p className={`${THEME.fontDisplay} font-medium text-xl text-stone-900 mb-1 max-w-[200px] truncate`}>
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-stone-500 font-serif italic mb-4">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB • {t('upload.readyForReview')}
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    // This might conflict with the file input overlay, 
                                                    // but for now we rely on the user clicking "Drop zone" to replace or just drag-drop again.
                                                    // The Remove button is tricky with the overlay, so we'll just encourage re-upload.
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setFile(null);
                                                }}
                                                className="text-xs uppercase tracking-widest text-stone-400 hover:text-red-600 transition-colors z-30 relative"
                                            >
                                                {t('upload.removeDocument')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center">
                                            <Upload className="w-8 h-8 text-stone-400 mb-6 group-hover:-translate-y-1 transition-transform" strokeWidth={1.5} />
                                            <p className={`${THEME.fontDisplay} text-xl text-stone-900 mb-2`}>
                                                {t('upload.uploadPdf')}
                                            </p>
                                            <p className="text-stone-500 text-sm italic max-w-xs">
                                                {t('upload.dropOrBrowse')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Job Description Section (Notepad) */}
                            <div className="space-y-4">
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 pl-1">
                                    {t('upload.theCriteria')}
                                </label>
                                <div className="relative">
                                    <textarea
                                        placeholder={t('upload.jobDescPlaceholder')}
                                        rows={12}
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        className="w-full h-80 p-8 bg-white border border-stone-200 rounded-sm focus:border-stone-900 focus:outline-none transition-colors font-serif text-stone-800 placeholder-stone-300 resize-none leading-relaxed shadow-sm hover:shadow-md"
                                    />
                                    {/* Notebook Lines effect - purely decorative */}
                                    <div className="absolute top-0 left-8 bottom-0 w-px bg-red-100/50 pointer-events-none" />
                                </div>
                            </div>

                            {/* Analyze Button */}
                            <div className="lg:col-span-2 flex justify-center pt-8">
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !file || !jobDescription.trim()}
                                    className="min-w-[250px] py-6 text-lg font-serif shadow-orange bg-stone-900 hover:bg-stone-800 text-white"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                            {t('upload.readingManuscript')}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-3" />
                                            {t('upload.runResumeReview')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Results Section - The Report */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto"
                        >
                            {/* Paper Report Card */}
                            <div className="bg-white p-10 lg:p-16 border border-stone-200 shadow-xl relative overflow-hidden">
                                {/* Decorative "Confidential" or "Reviewed" stamp look */}
                                <div className="absolute top-10 right-10 opacity-30 rotate-12 pointer-events-none">
                                    <div className="border-4 border-stone-900 p-2 rounded-sm">
                                        <span className="text-4xl font-black uppercase tracking-widest text-stone-900">{t('upload.reviewed')}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 border-b border-dashed border-stone-200 pb-12 mb-12">
                                    {/* Score Stamp */}
                                    <div className="relative group">
                                        <svg viewBox="0 0 200 200" className="w-48 h-48 animate-spin-slow-once">
                                            <defs>
                                                <path id="circlePath" d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" />
                                            </defs>
                                            <text fontSize="14" fill="#78716c" letterSpacing="2">
                                                <textPath xlinkHref="#circlePath" className="uppercase font-bold">
                                                    Official • Resume • Review • Approved •
                                                </textPath>
                                            </text>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className={`${THEME.fontDisplay} text-6xl font-bold text-stone-900`}>
                                                {result.score}
                                            </span>
                                            <span className="text-stone-400 font-serif italic">/ 100</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center lg:text-left pt-4">
                                        <h2 className={`${THEME.fontDisplay} text-3xl font-semibold text-stone-900 mb-4`}>
                                            {t('upload.editorsNote')}
                                        </h2>
                                        <p className="text-stone-600 font-serif text-lg leading-relaxed mb-6">
                                            {result.score >= 80
                                                ? t('upload.editorCommentHigh')
                                                : result.score >= 60
                                                    ? t('upload.editorCommentMedium')
                                                    : t('upload.editorCommentLow')}
                                        </p>
                                        <div className="flex justify-center lg:justify-start gap-4">
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    setResult(null);
                                                    setFile(null);
                                                    setJobDescription("");
                                                }}
                                                className="font-serif text-stone-500 hover:text-stone-900 border-stone-200"
                                            >
                                                {t('upload.reviewAnotherDraft')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid lg:grid-cols-2 gap-12">
                                    {/* Left Column: Keywords */}
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" /> {t('upload.strongMatches')}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 text-sm font-serif">
                                                {result.matchedKeywords.length > 0 ? result.matchedKeywords.map((k) => (
                                                    <span key={k} className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full border border-stone-200">
                                                        {k}
                                                    </span>
                                                )) : <span className="text-stone-400 italic">{t('upload.noKeywordsFound')}</span>}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                                                <X className="w-4 h-4" /> {t('upload.missingElements')}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 text-sm font-serif">
                                                {result.missingKeywords.length > 0 ? result.missingKeywords.map((k) => (
                                                    <span key={k} className="px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-100 line-through decoration-red-300">
                                                        {k}
                                                    </span>
                                                )) : <span className="text-stone-400 italic">{t('upload.noMissingKeywords')}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Suggestions */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-2">
                                            <Stamp className="w-4 h-4" /> {t('upload.editorialSuggestions')}
                                        </h3>
                                        <ul className="space-y-4 font-serif text-stone-700">
                                            {result.suggestions.map((suggestion, index) => (
                                                <li key={index} className="flex gap-4">
                                                    <span className="text-orange-500 font-bold font-display text-lg">{index + 1}.</span>
                                                    <span className="leading-relaxed">{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}

