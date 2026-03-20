"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { THEME } from "@/lib/theme";

export default function NewResumePage() {
  const { t } = useTranslation();
  const options = [
    {
      title: t("newResume.fromScratch"),
      description: t("newResume.fromScratchDesc"),
      icon: FileText,
      href: "/resumes/create",
      color: "bg-orange-50 text-orange-600 border border-orange-100",
      featured: false,
      badge: undefined as string | undefined,
    },
    {
      title: "Importar de PDF",
      description: "Extraia dados de um currículo existente em PDF",
      icon: Upload,
      href: "/resumes/import/pdf",
      color: "bg-blue-100 text-blue-600",
      featured: false,
      badge: "Novo" as string | undefined,
    },
  ];

  return (
    <ProtectedRoute>
    <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} ${THEME.text} selection:bg-orange-100 selection:text-orange-900`}>
      {/* Texture Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      <Header />

      <main className="pt-24 lg:pt-28 pb-16">
        <div className="container-custom max-w-3xl">
          <Link
            href="/resumes"
            className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-8 transition-colors font-medium border-b border-transparent hover:border-orange-600/30"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.backToResumes')}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className={`${THEME.fontDisplay} text-3xl lg:text-4xl font-bold text-stone-900 mb-2`}>
              {t('newResume.title')}
            </h1>
            <p className="text-stone-500 mb-12 italic text-base leading-relaxed">
              {t('newResume.subtitle')}
            </p>

            <div className="space-y-4">
              {options.map((option, index) => (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={option.href}>
                    <div className={`card-editorial group cursor-pointer transition-all duration-300 hover:-translate-y-1 ${option.featured ? 'border-orange-300 shadow-md ring-1 ring-orange-100' : ''}`}>
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-full ${option.color} flex items-center justify-center shrink-0`}>
                          <option.icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className={`${THEME.fontDisplay} text-xl font-bold text-stone-900`}>
                              {option.title}
                            </h3>
                            {option.badge && (
                              <span className="px-3 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider">
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-stone-500 text-sm mt-1 leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                        <ArrowLeft className="w-6 h-6 text-stone-300 rotate-180 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  
    </ProtectedRoute>);
}
