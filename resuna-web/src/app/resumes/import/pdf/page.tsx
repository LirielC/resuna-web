"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle, XCircle, Briefcase, GraduationCap, Wrench, Award } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { resumeApi } from "@/lib/api";
import { Resume, Experience, Education, Project, Certification, Language } from "@/lib/types";
import { useTranslation } from "@/contexts/LanguageContext";
import { THEME } from "@/lib/theme";
import { GrainOverlay } from "@/components/ui/GrainOverlay";

interface ExtractedData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  certifications?: Certification[];
  awards?: string[];
  languages?: Language[];
  skills?: string[];
  rawText?: string;
}

export default function ImportPdfPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [creating, setCreating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Por favor, selecione um arquivo PDF");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("O arquivo é muito grande (máximo 5MB)");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const data = await resumeApi.importFromPdf(file);
      setExtractedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar o PDF");
      if (process.env.NODE_ENV !== 'production') {
        console.error("PDF import error:", err);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCreateResume = async () => {
    if (!extractedData) return;

    setCreating(true);
    setError("");

    try {
      // Build resume object from extracted data
      // Backend requires fullName and email to be non-empty
      const fullName = extractedData.name?.trim() || "Nome não identificado";
      const email = extractedData.email?.trim() || "email@exemplo.com";

      const resume: Omit<Resume, "id" | "userId" | "createdAt" | "updatedAt"> = {
        title: `Currículo - ${extractedData.name || "Importado"}`,
        personalInfo: {
          fullName: fullName,
          email: email,
          phone: extractedData.phone?.trim() || undefined,
          location: extractedData.location?.trim() || undefined,
          linkedin: extractedData.linkedin?.trim() || undefined,
          github: extractedData.github?.trim() || undefined,
          website: extractedData.website?.trim() || undefined,
        },
        summary: extractedData.summary?.trim() || undefined,
        experience: extractedData.experience || [],
        education: extractedData.education || [],
        skills: (extractedData.skills || []).filter((s: string) => s?.trim().length > 0),
        certifications: extractedData.certifications || [],
        languages: extractedData.languages || [],
        projects: extractedData.projects || [],
      };

      const created = await resumeApi.create(resume);
      router.push(`/resumes/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar currículo");
      if (process.env.NODE_ENV !== 'production') {
        console.error("Resume creation error:", err);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} ${THEME.text} selection:bg-orange-100 selection:text-orange-900`}>
      <GrainOverlay />

      <Header />

      <main className="relative z-10 pt-28 lg:pt-36 pb-20">
        <div className="container-custom max-w-3xl">
          <Link
            href="/resumes/new"
            className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-8 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.backToSelection')}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className={`text-3xl lg:text-4xl font-bold ${THEME.fontDisplay} mb-2`}>
              Importar Currículo de PDF
            </h1>
            <p className="text-stone-500 mb-12">
              Faça upload de um currículo em PDF e extrairemos automaticamente as informações
            </p>

            {!extractedData ? (
              <div className="card-editorial animate-fade-in-up">
                <div className="text-center py-6">
                  <div className="mx-auto w-20 h-20 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-8 border border-orange-100">
                    <Upload className="w-10 h-10" />
                  </div>

                  <h3 className={`text-xl font-bold ${THEME.fontDisplay} mb-2`}>
                    Selecione um arquivo PDF
                  </h3>
                  <p className="text-stone-500 mb-8 text-sm">
                    Máximo 5MB • Somente arquivos PDF
                  </p>

                  <label className="inline-block">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="btn-primary cursor-pointer">
                      <FileText className="w-5 h-5 mr-2" />
                      Escolher Arquivo
                    </span>
                  </label>

                  {file && (
                    <div className="mt-10 animate-scale-in">
                      <div className="flex items-center justify-center gap-3 text-sm text-stone-600 mb-6 bg-stone-50 py-3 px-4 rounded-lg border border-stone-100 max-w-sm mx-auto">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <button
                          onClick={() => {
                            setFile(null);
                            setError("");
                          }}
                          className="text-stone-400 hover:text-red-600 transition-colors ml-auto"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={`btn-primary px-10 transition-all ${uploading ? "opacity-75" : "bg-stone-900 hover:bg-black"}`}
                        style={!uploading ? { background: 'black' } : {}}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mr-2" />
                            Extrair Dados
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="mt-8 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-sm text-left">
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in-up">
                <div className="card-editorial">
                  <div className="flex items-start justify-between mb-8 border-b border-stone-100 pb-6">
                    <div>
                      <h3 className={`text-2xl font-bold ${THEME.fontDisplay} mb-2`}>
                        Dados Extraídos
                      </h3>
                      <p className="text-sm text-stone-500 italic">
                        Revise os dados extraídos do PDF. Você poderá editá-los após criar o currículo.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setExtractedData(null);
                        setFile(null);
                      }}
                      className="text-stone-400 hover:text-orange-600 transition-colors"
                    >
                      <XCircle className="w-8 h-8" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {extractedData.name && (
                      <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 transition-colors group-hover:text-orange-600">
                          Nome
                        </label>
                        <p className="text-lg font-medium text-stone-900">{extractedData.name}</p>
                      </div>
                    )}

                    {extractedData.email && (
                      <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 transition-colors group-hover:text-orange-600">
                          Email
                        </label>
                        <p className="font-medium text-stone-900">{extractedData.email}</p>
                      </div>
                    )}

                    {extractedData.phone && (
                      <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 transition-colors group-hover:text-orange-600">
                          Telefone
                        </label>
                        <p className="font-medium text-stone-900">{extractedData.phone}</p>
                      </div>
                    )}

                    {extractedData.linkedin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          LinkedIn
                        </label>
                        <p className="text-gray-900 dark:text-white">{extractedData.linkedin}</p>
                      </div>
                    )}

                    {extractedData.github && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          GitHub
                        </label>
                        <p className="text-gray-900 dark:text-white">{extractedData.github}</p>
                      </div>
                    )}

                    {extractedData.location && (
                      <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 transition-colors group-hover:text-orange-600">
                          Localização
                        </label>
                        <p className="font-medium text-stone-900">{extractedData.location}</p>
                      </div>
                    )}

                    {extractedData.summary && (
                      <div className="group md:col-span-2 mt-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 transition-colors group-hover:text-orange-600">
                          Resumo Profissional
                        </label>
                        <div className="p-5 bg-stone-50 border border-stone-100 rounded-lg italic text-stone-700 text-sm leading-relaxed">
                          {extractedData.summary}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-12 space-y-8">
                    {extractedData.experience && extractedData.experience.length > 0 && (
                      <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 transition-colors group-hover:text-orange-600 flex items-center gap-2">
                          <Briefcase className="w-3 h-3" />
                          Experiência Profissional ({extractedData.experience.length})
                        </label>
                        <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-stone-200">
                          {extractedData.experience.map((exp: Experience, index: number) => (
                            <div key={index} className="relative pl-10">
                              <div className="absolute left-[14px] top-1.5 w-[11px] h-[11px] rounded-full border-2 border-orange-500 bg-white z-10" />
                              <p className="font-bold text-stone-900 text-lg leading-tight">{exp.title}</p>
                              <p className="text-orange-600 font-medium mb-1">{exp.company}</p>
                              {exp.startDate && (
                                <p className="text-xs text-stone-400 font-mono tracking-wider mb-2">
                                  {exp.startDate} - {exp.current ? "Presente" : exp.endDate || ""}
                                </p>
                              )}
                              {exp.bullets && exp.bullets.length > 0 && typeof exp.bullets[0] === 'string' && (
                                <ul className="mt-2 space-y-1">
                                  {exp.bullets.map((bullet: string, i: number) => (
                                    <li key={i} className="text-sm text-stone-600 leading-relaxed flex items-start gap-2">
                                      <span className="text-orange-500 mt-1.5 text-[10px] opacity-40">•</span>
                                      {bullet}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {extractedData.education && extractedData.education.length > 0 && (
                      <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 transition-colors group-hover:text-orange-600 flex items-center gap-2">
                          <GraduationCap className="w-3 h-3" />
                          Educação ({extractedData.education.length})
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {extractedData.education.map((edu: Education, index: number) => (
                            <div key={index} className="p-4 rounded-lg bg-stone-50 border border-stone-100 transition-all hover:bg-white hover:shadow-soft">
                              <p className="font-bold text-stone-900">{edu.degree}</p>
                              <p className="text-sm text-stone-500">{edu.institution}</p>
                              {edu.graduationDate && (
                                <p className="text-xs text-stone-400 mt-1 italic">{edu.graduationDate}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {extractedData.skills && extractedData.skills.length > 0 && (
                      <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 transition-colors group-hover:text-orange-600 flex items-center gap-2">
                          <Wrench className="w-3 h-3" />
                          Habilidades ({extractedData.skills.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {extractedData.skills.map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-4 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-full text-xs font-medium tracking-wide transition-all hover:border-orange-200 hover:text-orange-600"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {extractedData.certifications && extractedData.certifications.length > 0 && (
                      <div className="group">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 transition-colors group-hover:text-orange-600 flex items-center gap-2">
                          <Award className="w-3 h-3" />
                          Certificações ({extractedData.certifications.length})
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {extractedData.certifications.map((cert: Certification, index: number) => (
                            <div key={index} className="flex flex-col">
                              <p className="font-bold text-stone-900 text-sm">{cert.name}</p>
                              <p className="text-xs text-stone-500 uppercase tracking-tighter opacity-70">{cert.issuer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-16 pt-10 border-t border-stone-200">
                    <button
                      onClick={handleCreateResume}
                      disabled={creating}
                      className="btn-primary w-full py-5 text-lg"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                          Criando Currículo...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-6 h-6 mr-3" />
                          Finalizar e Editar Currículo
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-stone-400 mt-5 italic tracking-wide">
                      Você poderá revisar e complementar todos os detalhes no próximo passo.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
