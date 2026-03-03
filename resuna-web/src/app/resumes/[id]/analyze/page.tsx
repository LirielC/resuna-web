"use client";

import Link from "next/link";
import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Check,
  AlertTriangle,
  Zap,
  Shield,
  Loader2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { aiApi, ApiRequestError } from "@/lib/api";
import TurnstileWrapper from "@/components/Turnstile";
import { CritiqueResponse } from "@/lib/types";
import { useTranslation } from "@/contexts/LanguageContext";

const THEME = {
  bg: "bg-[#F8F6F1]",
  fontHeading: "font-serif",
  fontBody: "font-sans",
};

export default function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [critique, setCritique] = useState<CritiqueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useTranslation();

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState<string | null>(turnstileSiteKey ? null : '');

  const handleCritique = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await aiApi.critiqueResume(id, locale, captchaToken || undefined);
      setCaptchaToken(turnstileSiteKey ? null : '');
      setCritique(result);
    } catch (err: unknown) {
      let message: string;
      if (err instanceof ApiRequestError) {
        if (err.status === 403) {
          message = err.message.includes('CAPTCHA') || err.message.includes('segurança')
            ? 'Verificação de segurança falhou. Tente novamente.'
            : err.message.includes('credit') || err.message.includes('credit')
            ? 'Créditos insuficientes para esta operação.'
            : err.message;
        } else if (err.status >= 500) {
          message = 'Erro no servidor. Tente novamente em alguns instantes.';
        } else {
          message = err.message || t("analyze.failedAnalyze");
        }
      } else {
        message = err instanceof Error ? err.message : t("analyze.failedAnalyze");
      }
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCritique(null);
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-emerald-500";
    if (score >= 60) return "stroke-amber-500";
    return "stroke-red-500";
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-l-red-500 bg-red-50/50";
      case "important":
        return "border-l-amber-500 bg-amber-50/50";
      default:
        return "border-l-stone-300 bg-stone-50/50";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical":
        return { text: t("analyze.critical"), color: "text-red-700 bg-red-100" };
      case "important":
        return { text: t("analyze.important"), color: "text-amber-700 bg-amber-100" };
      default:
        return { text: t("analyze.minor"), color: "text-stone-600 bg-stone-100" };
    }
  };

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900`}>
      <Header />

      <main className="relative z-10 pt-24 lg:pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href={`/resumes/${id}`}
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('analyze.backToEditor')}
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-800 to-stone-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#F8F6F1]" />
              </div>
              <div>
                <h1 className={`text-2xl lg:text-3xl ${THEME.fontHeading} text-stone-900`}>
                  {t('analyze.editorialReview')}
                </h1>
                <p className="text-stone-500 text-sm mt-0.5">
                  {t('analyze.aiCritique')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Pre-Analysis State */}
          <AnimatePresence mode="wait">
            {!critique && !isAnalyzing && (
              <motion.div
                key="pre-analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="!bg-white/70 backdrop-blur-sm border border-stone-200/60 !shadow-none">
                  <div className="text-center py-10 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-8 h-8 text-stone-600" />
                    </div>
                    <h2 className={`text-xl ${THEME.fontHeading} text-stone-800 mb-3`}>
                      {t('analyze.readyForReview')}
                    </h2>
                    <p className="text-stone-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                      {t('analyze.readyDesc')}
                    </p>
                    {error && (
                      <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                        {error}
                      </div>
                    )}
                    <TurnstileWrapper
                      onSuccess={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                      size="compact"
                    />
                    <Button
                      onClick={handleCritique}
                      disabled={captchaToken === null}
                      className="!bg-stone-800 hover:!bg-stone-900 !text-[#F8F6F1] !px-8 !py-3 !rounded-xl disabled:!opacity-50"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('analyze.startEditorialReview')}
                    </Button>
                    <p className="text-xs text-stone-400 mt-4">{t('analyze.usesOneCredit')}</p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Analyzing State */}
            {isAnalyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <Card className="!bg-white/70 backdrop-blur-sm border border-stone-200/60 !shadow-none">
                  <div className="text-center py-16 px-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 mx-auto mb-6"
                    >
                      <Loader2 className="w-12 h-12 text-stone-400" />
                    </motion.div>
                    <h2 className={`text-lg ${THEME.fontHeading} text-stone-700 mb-2`}>
                      {t('analyze.reviewingManuscript')}
                    </h2>
                    <p className="text-stone-400 text-sm">
                      {t('analyze.reviewingDesc')}
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Results */}
            {critique && !isAnalyzing && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Score Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="!bg-white/70 backdrop-blur-sm border border-stone-200/60 !shadow-none overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-6">
                      {/* Score Ring */}
                      <div className="relative flex-shrink-0">
                        <svg viewBox="0 0 120 120" className="w-28 h-28">
                          <circle
                            cx="60" cy="60" r="52"
                            fill="none"
                            stroke="#e7e5e4"
                            strokeWidth="8"
                          />
                          <motion.circle
                            cx="60" cy="60" r="52"
                            fill="none"
                            className={getScoreRingColor(critique.overallScore)}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 52}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                            animate={{
                              strokeDashoffset: 2 * Math.PI * 52 * (1 - critique.overallScore / 100),
                            }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-3xl font-bold ${THEME.fontHeading} ${getScoreColor(critique.overallScore)}`}>
                            {critique.overallScore}
                          </span>
                        </div>
                      </div>

                      {/* Verdict */}
                      <div className="text-center sm:text-left flex-1">
                        <h2 className={`text-xl ${THEME.fontHeading} text-stone-800 mb-1`}>
                          {t('analyze.overallAssessment')}
                        </h2>
                        <p className="text-stone-600 text-sm leading-relaxed">
                          {critique.overallVerdict}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleReset}
                            className="!text-sm !rounded-lg"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            {t('analyze.newReview')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Strengths */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="!bg-white/70 backdrop-blur-sm border border-stone-200/60 !shadow-none">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className={`text-lg ${THEME.fontHeading} text-stone-800`}>
                          {t('analyze.strengths')}
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        {critique.strengths.map((strength, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            className="flex items-start gap-3 text-sm text-stone-700"
                          >
                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{strength}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </motion.div>

                {/* Weaknesses */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="!bg-white/70 backdrop-blur-sm border border-stone-200/60 !shadow-none">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                        <h3 className={`text-lg ${THEME.fontHeading} text-stone-800`}>
                          {t('analyze.improvements')}
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {critique.weaknesses.map((weakness, i) => {
                          const severity = getSeverityLabel(weakness.severity);
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45 + i * 0.08 }}
                              className={`border-l-4 rounded-r-lg p-4 ${getSeverityStyles(weakness.severity)}`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severity.color}`}>
                                  {severity.text}
                                </span>
                                <span className="text-xs text-stone-400 font-medium uppercase tracking-wide">
                                  {weakness.section}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-stone-800 mb-1">
                                {weakness.issue}
                              </p>
                              <div className="flex items-start gap-2 mt-2">
                                <ChevronRight className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-stone-500 leading-relaxed">
                                  {weakness.suggestion}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Quick Wins */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <Card className="!bg-white/70 backdrop-blur-sm border border-stone-200/60 !shadow-none">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-orange-600" />
                        </div>
                        <h3 className={`text-lg ${THEME.fontHeading} text-stone-800`}>
                          {t('analyze.quickWins')}
                        </h3>
                        <span className="text-xs text-stone-400 ml-auto">{t('analyze.doTheseFirst')}</span>
                      </div>
                      <ul className="space-y-3">
                        {critique.quickWins.map((win, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.08 }}
                            className="flex items-start gap-3 text-sm text-stone-700"
                          >
                            <Zap className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{win}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </motion.div>

                {/* Footer CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-center py-6"
                >
                  <div className="flex items-center justify-center gap-2 text-stone-400 text-xs mb-4">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{t('analyze.privacyNote')}</span>
                  </div>
                  <Link href={`/resumes/${id}`}>
                    <Button className="!bg-stone-800 hover:!bg-stone-900 !text-[#F8F6F1] !px-8 !py-3 !rounded-xl">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t('analyze.returnToEditor')}
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
