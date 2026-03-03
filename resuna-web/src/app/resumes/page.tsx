"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Download,
  Trash2,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  Upload,
  FolderDown,
  FolderUp,
  Copy,
} from "lucide-react";
import { useRef } from "react";
import { Header } from "@/components/layout/Header";
import { resumeApi, triggerDownload } from "@/lib/api";
import { localResumeStorage } from "@/lib/storage";
import { useTranslation } from "@/contexts/LanguageContext";
import { computeCompleteness } from "@/lib/completeness";
import type { Resume } from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const resumeData = await resumeApi.getAll();
      setResumes(resumeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("resumes.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent link click
    e.stopPropagation();

    if (!confirm(t("resumes.confirmDelete"))) return;

    setDeletingId(id);
    try {
      await resumeApi.delete(id);
      setResumes(resumes.filter((r) => r.id !== id));
    } catch (err) {
      setError(t("resumes.failedToDelete"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDuplicatingId(id);
    try {
      const copy = await resumeApi.duplicate(id);
      setResumes(prev => [copy, ...prev]);
    } catch {
      setError('Falha ao duplicar currículo.');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDownloadPdf = async (e: React.MouseEvent, resume: Resume) => {
    e.preventDefault(); // Prevent link click
    e.stopPropagation();

    if (!resume.id) return;
    setDownloadingId(resume.id);
    try {
      const blob = await resumeApi.downloadPdf(resume.id);
      triggerDownload(blob, `${resume.title || "resume"}.pdf`);
    } catch (err) {
      setError(t("resumes.failedToDownload"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportJson = () => {
    const json = localResumeStorage.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, `resuna-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string;
        const { imported, skipped } = localResumeStorage.importJson(json);
        setResumes(localResumeStorage.getAll());
        alert(
          t('resumes.importSuccess')
            .replace('{{count}}', String(imported))
            .replace('{{skipped}}', String(skipped))
        );
      } catch {
        setError(t('resumes.importError'));
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported if needed
    e.target.value = '';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("resumes.draft");
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const searchedResumes = resumes.filter((resume) =>
    resume.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resume.personalInfo?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
    <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900 selection:bg-orange-100 selection:text-orange-900`}>
      {/* Texture Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      <Header />

      <main className="relative z-10 pt-24 lg:pt-32 pb-20">
        <div className="container-custom">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-stone-200/60 pb-8"
          >
            <div>
              <h1 className={`${THEME.fontDisplay} text-4xl lg:text-5xl font-medium text-stone-900 tracking-tight mb-3`}>
                {t('resumes.theArchive')}
              </h1>
              <p className="text-stone-500 font-serif italic text-lg">
                {t('resumes.archiveSubtitle')}
              </p>
            </div>

            <div className="w-full md:w-[26rem] space-y-3">
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder={t('resumes.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-stone-300 focus:border-orange-600 focus:outline-none transition-colors font-serif placeholder-stone-400 text-stone-800"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 px-3 py-1.5 rounded-sm transition-colors font-mono tracking-wide uppercase"
                  title={t('resumes.exportJson')}
                >
                  <FolderDown className="w-3.5 h-3.5" />
                  {t('resumes.exportJson')}
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 px-3 py-1.5 rounded-sm transition-colors font-mono tracking-wide uppercase"
                  title={t('resumes.importJson')}
                >
                  <FolderUp className="w-3.5 h-3.5" />
                  {t('resumes.importJson')}
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleImportJson}
                />
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 text-red-800 border-l-2 border-red-500 rounded-sm flex items-center gap-3 animate-fade-in-up">
              <AlertCircle className="w-5 h-5" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">×</button>
            </div>
          )}

          {/* Helper for Empty/Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              <span className="text-stone-400 italic font-serif">{t('resumes.retrievingDocuments')}</span>
            </div>
          )}

          {!isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >

              {/* New Resume ACTION CARD */}
              <Link href="/resumes/new" className="group">
                <div className="h-full min-h-[320px] bg-white border border-stone-200 border-dashed hover:border-orange-300 hover:bg-orange-50/10 rounded-sm flex flex-col items-center justify-center gap-4 transition-all duration-300 group-hover:-translate-y-1 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-6 h-6 text-stone-400 group-hover:text-orange-600 transition-colors" />
                  </div>
                  <div className="text-center">
                    <h3 className={`${THEME.fontDisplay} text-xl font-medium text-stone-900 mb-1`}>{t('resumes.newDraft')}</h3>
                    <p className="text-stone-500 text-sm italic">{t('resumes.startFreshDocument')}</p>
                  </div>
                </div>
              </Link>

              {/* Upload Resume ACTION CARD */}
              <Link href="/resumes/upload" className="group">
                <div className="h-full min-h-[320px] bg-stone-50 border border-stone-200/60 hover:border-stone-300 rounded-sm flex flex-col items-center justify-center gap-4 transition-all duration-300 group-hover:-translate-y-1 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-4 h-4 text-stone-400" />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white border border-stone-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-6 h-6 text-stone-400 group-hover:text-stone-700 transition-colors" />
                  </div>
                  <div className="text-center px-6">
                    <h3 className={`${THEME.fontDisplay} text-xl font-medium text-stone-900 mb-1`}>{t('resumes.analyzePdf')}</h3>
                    <p className="text-stone-500 text-sm italic">{t('resumes.importExistingOptimize')}</p>
                  </div>
                </div>
              </Link>

              {/* Resume "Paper Sheet" Cards */}
              {searchedResumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  data-testid={resume.id ? `resume-card-${resume.id}` : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <Link href={`/resumes/${resume.id}`}>
                    <div className="group relative bg-white h-full min-h-[320px] shadow-sm hover:shadow-xl transition-all duration-500 rounded-sm border-t-4 border-t-stone-200 hover:border-t-orange-500 p-8 flex flex-col justify-between hover:-translate-y-1">

                      {/* Paper Content Preview (Abstract) */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <FileText className="w-8 h-8 text-stone-300 group-hover:text-orange-600 transition-colors duration-500" strokeWidth={1.5} />
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                            {/* Quick Actions overlay on hover */}
                            <button
                              onClick={(e) => handleDownloadPdf(e, resume)}
                              className="p-1.5 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700"
                              title="Download PDF"
                            >
                              {downloadingId === resume.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => handleDuplicate(e, resume.id!)}
                              className="p-1.5 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700"
                              title="Duplicar"
                            >
                              {duplicatingId === resume.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, resume.id!)}
                              className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-600"
                              title="Delete"
                            >
                              {deletingId === resume.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className={`${THEME.fontDisplay} text-xl font-semibold text-stone-900 leading-tight mb-2 group-hover:text-orange-900 transition-colors`}>
                            {resume.title || t('resumes.untitledMasterpiece')}
                          </h3>
                          <p className="text-stone-500 text-sm font-serif truncate">
                            {resume.personalInfo?.fullName || t('resumes.noNameProvided')}
                          </p>
                        </div>

                        {/* Abstract Lines */}
                        <div className="space-y-2 opacity-30 group-hover:opacity-50 transition-opacity pt-2">
                          <div className="h-1 w-full bg-stone-200 rounded-full" />
                          <div className="h-1 w-3/4 bg-stone-200 rounded-full" />
                          <div className="h-1 w-5/6 bg-stone-200 rounded-full" />
                        </div>
                      </div>

                      {/* Completeness Bar */}
                      {(() => {
                        const { score, missingFields } = computeCompleteness(resume);
                        const color = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-orange-500" : "bg-red-400";
                        return (
                          <div className="pt-3" title={missingFields.length > 0 ? `Faltando: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '…' : ''}` : 'Currículo completo!'}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Completude</span>
                              <span className={`text-[10px] font-mono font-semibold ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-orange-600' : 'text-red-500'}`}>{score}%</span>
                            </div>
                            <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Footer */}
                      <div className="border-t border-stone-100 pt-4 mt-4">
                        <div className="flex items-center justify-between text-xs text-stone-400 font-mono tracking-wider uppercase">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(resume.updatedAt)}
                          </span>
                          <span className="group-hover:text-orange-600 transition-colors">{t('resumes.editDocument')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

            </motion.div>
          )}

          {/* Empty Search State */}
          {!isLoading && searchedResumes.length === 0 && resumes.length > 0 && (
            <div className="text-center py-16 opacity-50">
              <FileText className="w-12 h-12 mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500 font-serif italic text-lg">{t('resumes.noDocumentsFound')}</p>
            </div>
          )}

        </div>
      </main>
    </div>
  
    </ProtectedRoute>);
}
