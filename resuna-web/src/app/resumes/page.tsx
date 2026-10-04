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
  Loader2,
  AlertCircle,
  Copy,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { resumeApi, triggerDownload } from "@/lib/api";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Resume } from "@/lib/types";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { THEME } from "@/lib/theme";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast } from "@/components/ui/Toast";

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "title">("recent");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(id);
    try {
      await resumeApi.delete(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("resumes.draft");
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const searchedResumes = resumes
    .filter((resume) => resume.title?.toLowerCase().includes(searchQuery.toLowerCase()) || resume.personalInfo?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortOrder === "title"
      ? (a.title || "").localeCompare(b.title || "", "pt-BR")
      : new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

  return (
    <ProtectedRoute>
    <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900 selection:bg-orange-100 selection:text-orange-900`}>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      {pendingDeleteId && (
        <ConfirmDialog
          message={t("resumes.confirmDelete")}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
      <GrainOverlay />

      <Header />

      <main className="relative z-10 pt-24 lg:pt-32 pb-20">
        <div className="container-custom max-w-7xl">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col gap-6 border-b border-stone-200 pb-7 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <h1 className={`${THEME.fontDisplay} text-4xl lg:text-5xl font-medium text-stone-900 tracking-tight mb-3`}>
                Meus currículos
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">Crie, organize e atualize seus currículos em um só lugar.</p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <label className="relative min-w-0 flex-1 sm:min-w-64 md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                <input type="search" aria-label="Buscar currículos" placeholder="Buscar currículos" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-editorial h-11 pl-9" />
              </label>
              <select aria-label="Ordenar currículos" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "recent" | "title")} className="input-editorial h-11 w-full sm:w-44">
                <option value="recent">Mais recentes</option>
                <option value="title">Ordem alfabética</option>
              </select>
              <Link href="/resumes/new" className="btn-primary h-11 shrink-0 gap-2 px-4"><Plus className="h-4 w-4" />Novo currículo</Link>
              </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 text-red-800 border-l-2 border-red-500 rounded-sm flex items-center gap-3 animate-fade-in-up">
              <AlertCircle className="w-5 h-5" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">
                <X className="w-5 h-5" />
              </button>
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
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {searchedResumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  data-testid={resume.id ? `resume-card-${resume.id}` : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <article className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition-colors hover:border-[#d4a18a]">
                    <Link href={`/resumes/${resume.id}`} className="block p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600">
                      <div aria-hidden="true" className="mx-auto flex aspect-[1.25/1] max-h-40 max-w-48 flex-col overflow-hidden border border-stone-200 bg-[#fffefb] p-3 shadow-sm">
                        <p className="truncate text-center font-display text-[9px] font-semibold text-stone-800">{resume.personalInfo?.fullName || "Seu nome"}</p>
                        <div className="mt-1 h-px bg-stone-300" />
                        <p className="mt-2 text-[5px] font-bold uppercase tracking-widest text-[#a64b28]">Resumo</p>
                        <div className="mt-1 space-y-1"><div className="h-1 w-full bg-stone-200"/><div className="h-1 w-4/5 bg-stone-200"/></div>
                        <p className="mt-2 text-[5px] font-bold uppercase tracking-widest text-[#a64b28]">Experiência</p>
                        <div className="mt-1 space-y-1"><div className="h-1 w-full bg-stone-200"/><div className="h-1 w-11/12 bg-stone-200"/><div className="h-1 w-3/4 bg-stone-200"/></div>
                        <p className="mt-2 text-[5px] font-bold uppercase tracking-widest text-[#a64b28]">Formação · Habilidades</p>
                        <div className="mt-1 h-1 w-5/6 bg-stone-200"/>
                      </div>
                      <h2 className="mt-4 truncate font-display text-lg font-semibold text-stone-900 group-hover:text-[#a64b28]">{resume.title || t('resumes.untitledMasterpiece')}</h2>
                      <p className="mt-1 truncate text-sm text-stone-600">{resume.personalInfo?.fullName || t('resumes.noNameProvided')}</p>
                      <span className="mt-3 inline-flex rounded-full bg-[#f7f1ec] px-2.5 py-1 text-[11px] font-medium text-[#8e4e32]">Uma coluna · ATS</span>
                    </Link>
                    <footer className="flex items-center justify-between border-t border-stone-100 px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-stone-500"><Clock className="h-3.5 w-3.5"/>{formatDate(resume.updatedAt)}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => handleDownloadPdf(e, resume)} aria-label="Baixar PDF" title="Baixar PDF" className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600">{downloadingId === resume.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4"/>}</button>
                        <button onClick={(e) => handleDuplicate(e, resume.id!)} aria-label="Duplicar currículo" title="Duplicar currículo" className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600">{duplicatingId === resume.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Copy className="h-4 w-4"/>}</button>
                        <button onClick={(e) => handleDelete(e, resume.id!)} aria-label="Excluir currículo" title="Excluir currículo" className="rounded-md p-2 text-stone-500 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">{deletingId === resume.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}</button>
                      </div>
                    </footer>
                  </article>
                </motion.div>
              ))}

            </motion.div>
          )}

          {/* Empty Search State */}
          {!isLoading && resumes.length === 0 && (
            <section className="rounded-xl border border-dashed border-stone-300 bg-white/70 px-5 py-14 text-center">
              <FileText className="mx-auto mb-4 h-9 w-9 text-stone-400" aria-hidden="true" />
              <h2 className="font-display text-2xl font-medium text-stone-900">Seu próximo currículo começa aqui</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">Crie seu primeiro documento e organize suas experiências em um modelo claro e de uma coluna.</p>
              <Link href="/resumes/new" className="btn-primary mt-5 inline-flex h-11 gap-2 px-5"><Plus className="h-4 w-4"/>Criar currículo</Link>
            </section>
          )}

          {!isLoading && searchedResumes.length === 0 && resumes.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white px-5 py-12 text-center">
              <Search className="mx-auto mb-3 h-6 w-6 text-stone-400" aria-hidden="true" />
              <p className="text-sm text-stone-600">{t('resumes.noDocumentsFound')}</p>
            </div>
          )}

        </div>
      </main>
    </div>
  
    </ProtectedRoute>);
}
