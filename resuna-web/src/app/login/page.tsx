"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";

// Design System: Editorial Luxury
const THEME = {
  bg: "bg-[#F8F6F1]", // Cream Paper
  card: "bg-white",
  text: "text-stone-900",
  textMuted: "text-stone-500",
  accent: "text-orange-600",
  border: "border-stone-200",
  fontDisplay: "font-display", // Playfair Display
  fontBody: "font-serif", // Crimson Pro / Source Serif
};

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  // Check if Firebase is properly configured
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (!apiKey || !authDomain || !projectId) {
        setConfigError(true);
        setError("Configuração do Firebase incompleta. Entre em contato com o administrador.");
        console.error("Firebase configuration is incomplete. Check your .env.local file.");
      }
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/resumes");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Popup resolved — onAuthStateChanged will fire and useEffect will redirect
    } catch (err: any) {
      // Show full error code for diagnostics
      const code = err?.code || 'unknown';
      const message = err?.message || 'Erro desconhecido';
      setError(`[${code}] ${message}`);
      console.error('Login error:', err);
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${THEME.bg} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
          <span className={`${THEME.fontDisplay} text-stone-900 tracking-widest uppercase text-xs`}>{t('login.accessingArchives')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${THEME.bg} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Texture Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Decorative Background Element (Abstract) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] border border-orange-100/50 rounded-full opacity-50 z-0 pointer-events-none animate-spin-slow-reverse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] border border-stone-200/50 rounded-full opacity-50 z-0 pointer-events-none" />


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* The Membership Card */}
        <div className="bg-white p-12 lg:p-16 border border-stone-200 shadow-xl relative text-center">

          {/* Top Logo Mark */}
          <div className="mb-10 flex justify-center">
            <div className="w-10 h-10 border border-stone-900 flex items-center justify-center rotate-45">
              <div className="w-6 h-6 border border-stone-400 -rotate-45" />
            </div>
          </div>

          <h1 className={`${THEME.fontDisplay} text-3xl font-medium text-stone-900 mb-2`}>
            {t('login.memberAccess')}
          </h1>

          <p className={`${THEME.fontBody} text-stone-500 text-lg mb-10 italic`}>
            {t('login.enterWritersRoom')}
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm border-l-2 border-red-500 text-left">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || configError}
            className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-white border border-stone-300 hover:border-stone-900 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="font-sans font-medium text-stone-600 group-hover:text-stone-900 tracking-wide uppercase text-xs">
              {isSigningIn ? t('login.verifyingCredentials') : t('login.continueWithGoogle')}
            </span>
          </button>

          <div className="mt-8 flex items-center justify-center gap-6">
            <Link href="/terms" className="text-xs text-stone-400 hover:text-stone-900 uppercase tracking-widest transition-colors">{t('login.termsOfService')}</Link>
            <span className="text-stone-300">•</span>
            <Link href="/privacy" className="text-xs text-stone-400 hover:text-stone-900 uppercase tracking-widest transition-colors">{t('login.privacyPolicy')}</Link>
          </div>

          {/* Corner accents */}
          <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-stone-300" />
          <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-stone-300" />
          <div className="absolute bottom-4 left-4 w-3 h-3 border-b border-l border-stone-300" />
          <div className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-stone-300" />
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-600 transition-colors font-serif italic text-sm group">
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            {t('common.returnToFrontDesk')}
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
