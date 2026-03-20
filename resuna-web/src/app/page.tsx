"use client";

import Link from "next/link";
import { FileText, Target, Globe, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { useTranslation } from "@/contexts/LanguageContext";
import { THEME } from "@/lib/theme";

const featureIcons = [FileText, Globe, Target] as const;

export default function Home() {
  const { t } = useTranslation();

  const features = [
    {
      title: t("landing.feature01Title"),
      description: t("landing.feature01Desc"),
      icon: featureIcons[0],
    },
    {
      title: t("landing.feature02Title"),
      description: t("landing.feature02Desc"),
      icon: featureIcons[1],
    },
    {
      title: t("landing.feature03Title"),
      description: t("landing.feature03Desc"),
      icon: featureIcons[2],
    },
  ];

  return (
    <div
      className={`relative min-h-screen ${THEME.bg} ${THEME.fontBody} ${THEME.text} selection:bg-orange-200 selection:text-orange-900 overflow-hidden`}
    >
      <GrainOverlay />
      <Header />

      <main className="relative z-10">
        {/* Soft & Human Hero Section */}
        <section className="container-custom pt-32 pb-20 lg:pt-40 lg:pb-32 relative">
          {/* Decorative background blur/glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-400/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
            {/* Text Content */}
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-orange-200/50 text-orange-700 text-sm font-medium mb-8 shadow-sm backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>{t("landing.resumeIntelligence")}</span>
              </div>
              
              <h1
                className={`${THEME.fontDisplay} text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] text-ink mb-6 font-medium tracking-tight`}
              >
                {t("landing.heroTitle")}{" "}
                <span className="text-orange-600 italic font-normal block mt-2">{t("landing.heroTitleEmphasis")}</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-ink-soft leading-relaxed mb-10 font-medium">
                {t("landing.heroDescription")}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/signup"
                  className="btn-primary w-full sm:w-auto min-w-[220px] text-base h-14"
                >
                  {t("landing.beginJourney")}
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
                </Link>
                <Link href="/login" className="btn-secondary w-full sm:w-auto min-w-[220px] text-base h-14">
                  {t("landing.signIn")}
                </Link>
              </div>
              
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-stone-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Grátis para usar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Sempre de graça para usar sem assinatura </span>
                </div>
              </div>
            </div>

            {/* Visual Mockup */}
            <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
              <div className="relative w-full aspect-[1/1.2] lg:aspect-[4/5] bg-white rounded-3xl shadow-elevated border border-stone-200/60 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-700">
                {/* Mockup Header */}
                <div className="absolute top-0 inset-x-0 h-24 bg-stone-50 border-b border-stone-100 flex flex-col justify-center px-8">
                  <div className="w-1/2 h-6 bg-stone-200 rounded-md mb-3" />
                  <div className="w-1/3 h-4 bg-stone-100 rounded-md" />
                </div>
                {/* Mockup Body */}
                <div className="absolute top-24 inset-x-0 bottom-0 p-8 space-y-6">
                  <div className="space-y-3">
                    <div className="w-1/4 h-4 bg-orange-100 rounded-md" />
                    <div className="w-full h-3 bg-stone-100 rounded-md" />
                    <div className="w-full h-3 bg-stone-100 rounded-md" />
                    <div className="w-5/6 h-3 bg-stone-100 rounded-md" />
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="w-1/4 h-4 bg-orange-100 rounded-md" />
                    <div className="w-full h-3 bg-stone-100 rounded-md" />
                    <div className="w-full h-3 bg-stone-100 rounded-md" />
                    <div className="w-4/6 h-3 bg-stone-100 rounded-md" />
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="w-1/4 h-4 bg-orange-100 rounded-md" />
                    <div className="flex gap-2">
                      <div className="w-16 h-6 bg-stone-100 rounded-full" />
                      <div className="w-20 h-6 bg-stone-100 rounded-full" />
                      <div className="w-14 h-6 bg-stone-100 rounded-full" />
                    </div>
                  </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -right-4 top-32 bg-white px-4 py-3 rounded-2xl shadow-lg border border-orange-100 flex items-center gap-3 transform -rotate-6">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">98</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Score ATS</p>
                    <p className="text-sm font-bold text-stone-800">Excelente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Soft Cards */}
        <section
          id="features"
          className="relative py-24 lg:py-32"
        >
          {/* Subtle curved background separation */}
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-t-[3rem] lg:rounded-t-[5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.02)]" />
          
          <div className="container-custom max-w-6xl relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
              <h2 className={`${THEME.fontDisplay} text-3xl lg:text-4xl text-ink mb-6 font-medium`}>
                {t("landing.precisionTitle")}
              </h2>
              <p className="text-ink-soft text-lg leading-relaxed">{t("landing.capabilities")}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
              {features.map(({ title, description, icon: Icon }) => (
                <div key={title} className="card-editorial h-full bg-white/80 backdrop-blur-md border-white/40 hover:bg-white transition-all duration-500">
                  <div className="flex flex-col h-full text-left p-8">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6 shadow-sm border border-orange-100/50">
                      <Icon className="w-7 h-7" strokeWidth={1.5} aria-hidden />
                    </div>
                    <h3 className={`${THEME.fontDisplay} text-2xl text-ink mb-4 font-medium`}>{title}</h3>
                    <p className="text-ink-soft leading-relaxed flex-1 text-[15px]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-orange-50/50" />
          <div className="container-custom max-w-3xl text-center relative z-10">
            <h2 className={`${THEME.fontDisplay} text-3xl lg:text-4xl text-ink mb-6 font-medium`}>
              {t("landing.ctaTitle")}
            </h2>
            <p className="text-ink-soft text-lg mb-10 leading-relaxed max-w-xl mx-auto">{t("landing.ctaDescription")}</p>
            <Link href="/signup" className="btn-primary inline-flex items-center gap-2 h-14 px-8 text-base">
              {t("landing.startFree")}
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
