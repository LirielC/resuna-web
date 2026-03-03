"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  TrendingUp,
  BarChart3,
  Clock,
  Zap,
  Sparkles,
  ChevronRight,
  MoreVertical,
  Download,
  Share2,
  Star,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CircularProgress } from "@/components/ui/Progress";
import { resumeApi, subscriptionApi } from "@/lib/api";
import { computeCompleteness } from "@/lib/completeness";
import type { Resume } from "@/lib/types";
import { useTranslation } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [credits, resumeList] = await Promise.allSettled([
          subscriptionApi.getCredits(),
          resumeApi.getAll(),
        ]);
        if (credits.status === "fulfilled") setCreditsRemaining(credits.value.creditsRemaining);
        if (resumeList.status === "fulfilled") setResumes(resumeList.value);
      } catch {
        // silently ignore — dashboard degrades gracefully
      }
    };
    loadData();
  }, []);

  const avgCompleteness = useMemo(() => {
    if (resumes.length === 0) return null;
    const total = resumes.reduce((sum, r) => sum + computeCompleteness(r).score, 0);
    return Math.round(total / resumes.length);
  }, [resumes]);

  const stats = useMemo(() => {
    const baseStats = [
      {
        label: t("dashboard.resumes"),
        value: resumes.length,
        icon: FileText,
        change: resumes.length === 1 ? "1 documento" : `${resumes.length} documentos`,
      },
      {
        label: t("dashboard.avgScore"),
        value: avgCompleteness !== null ? `${avgCompleteness}%` : "—",
        icon: TrendingUp,
        change: "média de completude",
      },
    ];
    if (creditsRemaining !== null) {
      baseStats.push({
        label: t("dashboard.credits"),
        value: creditsRemaining,
        icon: Zap,
        change: t("dashboard.availableNow"),
      });
    }
    return baseStats;
  }, [resumes, avgCompleteness, creditsRemaining, t]);

  const recentResumes = useMemo(() =>
    [...resumes]
      .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
      .slice(0, 3)
      .map((r, i) => ({
        id: r.id!,
        name: r.title || t("resumes.untitledMasterpiece"),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) : "—",
        score: computeCompleteness(r).score,
        isDefault: i === 0,
      }))
  , [resumes, t]);

  const quickActions = [
    {
      label: t("dashboard.createResume"),
      description: t("dashboard.startFromScratch"),
      icon: Plus,
      href: "/resumes/new",
      color: "bg-orange-100 text-orange-600",
    },
    {
      label: t("dashboard.analyzeJob"),
      description: t("dashboard.checkCompatibility"),
      icon: Zap,
      href: "/analyze",
      color: "bg-green-100 text-green-600",
    },
    {
      label: t("dashboard.aiRefine"),
      description: t("dashboard.improveWithAi"),
      icon: Sparkles,
      href: recentResumes.length > 0 ? `/resumes/${recentResumes[0].id}` : "/resumes",
      color: "bg-purple-100 text-purple-600",
      premium: true,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />

      <main className="pt-24 lg:pt-28 pb-16">
        <div className="container-custom">
          {/* Trial Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="gradient-primary rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{t('dashboard.premiumTrialActive')}</h3>
                  <p className="text-orange-100 text-sm">
                    {t('dashboard.trialRemaining')}
                  </p>
                </div>
              </div>
              <Link href="/billing">
                <Button className="bg-white text-orange-600 hover:bg-orange-50">
                  {t('dashboard.upgradeNow')}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.welcomeBack', { name: 'Alex' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('dashboard.jobSearchStatus')}
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <stat.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Resumes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('dashboard.recentResumes')}
                  </h2>
                  <Link
                    href="/resumes"
                    className="text-sm text-orange-600 hover:underline"
                  >
                    {t('dashboard.viewAll')}
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentResumes.length === 0 ? (
                    <Card variant="outline">
                      <div className="text-center py-6">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">{t('dashboard.noResumesYet') || 'Nenhum currículo ainda.'}</p>
                        <Link href="/resumes/new" className="text-sm text-orange-600 font-medium hover:underline mt-2 inline-block">
                          Criar primeiro currículo →
                        </Link>
                      </div>
                    </Card>
                  ) : (
                    recentResumes.map((resume) => (
                      <Card key={resume.id} className="group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {resume.name}
                                </h3>
                                {resume.isDefault && (
                                  <Badge variant="success">{t('dashboard.default')}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {resume.updatedAt}
                                </span>
                                <span className={`flex items-center gap-1 ${resume.score >= 80 ? 'text-green-600' : resume.score >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                                  <Star className="w-3 h-3" />
                                  {resume.score}% completo
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link href={`/resumes/${resume.id}`}>
                              <Button variant="ghost" size="sm">
                                {t('common.edit')}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('dashboard.quickActions')}
                </h2>

                <div className="space-y-3">
                  {quickActions.map((action) => (
                    <Link key={action.label} href={action.href}>
                      <Card className="group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {action.label}
                              </p>
                              {action.premium && (
                                <Badge variant="premium">Pro</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{action.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card variant="outline">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('dashboard.proTip')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('dashboard.proTipContent')}
                  </p>
                  <Link
                    href="/tips"
                    className="text-sm text-orange-600 font-medium hover:underline"
                  >
                    {t('dashboard.readMoreTips')}
                  </Link>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}
