"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { coverLetterApi } from "@/lib/api";
import type { CoverLetter } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const THEME = {
  bg: "bg-[#F8F6F1]",
  fontHeading: "font-serif",
  fontBody: "font-sans",
};

const TONE_LABELS: Record<string, string> = {
  professional: "Profissional",
  enthusiastic: "Entusiasmado",
  formal: "Formal",
};

function CoverLettersContent() {
  const { user } = useAuth();
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    coverLetterApi
      .getAll()
      .then(setLetters)
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    await coverLetterApi.delete(id);
    setLetters((prev) => prev.filter((l) => l.id !== id));
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900`}>
      <Header />

      <main className="relative z-10 pt-24 lg:pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl lg:text-3xl ${THEME.fontHeading} text-stone-900`}>
                  Cartas de Apresentação
                </h1>
                <p className="text-stone-500 text-sm mt-0.5">
                  {letters.length} {letters.length === 1 ? "carta gerada" : "cartas geradas"}
                </p>
              </div>
            </div>
            <Link href="/resumes">
              <Button className="!bg-orange-600 hover:!bg-orange-700 !text-white !text-sm !px-4 !py-2 !rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nova carta
              </Button>
            </Link>
          </motion.div>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && letters.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="!bg-white/70 border border-stone-200/60 !shadow-none">
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-5">
                    <FileText className="w-8 h-8 text-stone-400" />
                  </div>
                  <h2 className={`text-xl ${THEME.fontHeading} text-stone-700 mb-3`}>
                    Nenhuma carta ainda
                  </h2>
                  <p className="text-stone-500 text-sm mb-8 max-w-sm mx-auto">
                    Gere sua primeira carta de apresentação a partir de um currículo existente.
                  </p>
                  <Link href="/resumes">
                    <Button className="!bg-orange-600 hover:!bg-orange-700 !text-white !px-6 !py-3 !rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Ir para meus currículos
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Letter grid */}
          {!isLoading && letters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {letters.map((letter, i) => (
                <motion.div
                  key={letter.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="!bg-white border border-stone-200/60 !shadow-none hover:!shadow-md hover:border-stone-300 transition-all group">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-orange-500" />
                        </div>
                        <button
                          onClick={() => letter.id && handleDelete(letter.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className={`${THEME.fontHeading} text-stone-800 font-medium mb-0.5 line-clamp-1`}>
                        {letter.jobTitle}
                      </h3>
                      <p className="text-stone-500 text-sm mb-3">{letter.company}</p>

                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="default" className="!text-xs !capitalize">
                          {TONE_LABELS[letter.tone] ?? letter.tone}
                        </Badge>
                        {letter.createdAt && (
                          <span className="text-xs text-stone-400">{formatDate(letter.createdAt)}</span>
                        )}
                      </div>

                      <p className="text-stone-500 text-xs leading-relaxed line-clamp-3 mb-4">
                        {letter.content}
                      </p>

                      <Link
                        href={`/resumes/${letter.resumeId}/cover-letter`}
                        className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
                      >
                        Ver e editar
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CoverLettersPage() {
  return (
    <ProtectedRoute>
      <CoverLettersContent />
    </ProtectedRoute>
  );
}
