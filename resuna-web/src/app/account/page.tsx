"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    Calendar,
    LogOut,
    PenTool,
    FileText,
    Star,
    ChevronRight,
    ArrowLeft,
    Trash2,
    AlertTriangle,
    Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { userApi, subscriptionApi, resumeApi, ApiRequestError } from "@/lib/api";
import { reauthenticateWithPopup } from "firebase/auth";
import { googleProvider } from "@/lib/firebase";
import { localResumeStorage, localCoverLetterStorage } from "@/lib/storage";
import { useTranslation } from "@/contexts/LanguageContext";
import { THEME } from "@/lib/theme";

export default function AccountPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [stats, setStats] = useState<{ resumeCount: number; avgAtsScore: number } | null>(null);
    const [credits, setCredits] = useState<{ creditsRemaining: number; dailyLimit: number } | null>(null);
    const [recentResumes, setRecentResumes] = useState<Array<{ id?: string; title: string; updatedAt?: string }>>([]);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            userApi.getStats().then(setStats).catch(() => {});
            subscriptionApi.getCredits().then(setCredits).catch(() => {});
            resumeApi
                .getAll()
                .then((all) => {
                    const sorted = [...all]
                        .sort((a, b) => {
                            const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                            const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                            return db - da;
                        })
                        .slice(0, 3);
                    setRecentResumes(sorted);
                })
                .catch(() => setRecentResumes([]));
        }
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await reauthenticateWithPopup(user, googleProvider);
            await user.getIdToken(true);

            // Backend deletes Firebase Auth user via Admin SDK + all Firestore data
            await userApi.deleteAccount();
            localResumeStorage.clear();
            localCoverLetterStorage.clear();
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(`resuna_resumes_cloud_migrated_${user.uid}`);
            }
            // Sign out locally — Auth user was already deleted on the backend
            await signOut();
            router.push("/");
        } catch (err: unknown) {
            const code =
                err && typeof err === "object" && "code" in err
                    ? String((err as { code: string }).code)
                    : "";
            if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
                setDeleteError(t("account.deleteReauthCanceled"));
            } else if (err instanceof ApiRequestError && err.errorCode === "REAUTH_REQUIRED") {
                setDeleteError(t("account.deleteReauthRequired"));
            } else if (err instanceof Error) {
                setDeleteError(err.message);
            } else {
                setDeleteError(t("common.error"));
            }
        } finally {
            setIsDeleting(false);
        }
    };

    if (!user) {
        // Should behave like a protected route, usually handled by middleware or redirect
        // but showing a placeholder just in case
        return null;
    }

    return (
        <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900 pb-20`}>
            <Header />

            {/* Texture Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            <main className="relative z-10 pt-24 lg:pt-32 container-custom max-w-4xl">
                <Link
                    href="/resumes"
                    className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-8 transition-colors font-medium group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {t('common.backToArchives')}
                </Link>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

                    {/* Left Column: Member Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full lg:w-1/3"
                    >
                        <div className="bg-white p-8 border border-stone-200 shadow-xl relative overflow-hidden group">
                            {/* Decorative Strip */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-stone-900" />

                            <div className="flex justify-center mb-6">
                                {user.photoURL ? (
                                    <div className="relative">
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || t('account.member')}
                                            className="w-24 h-24 rounded-full border-4 border-white shadow-sm object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                        />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Active Member" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center text-4xl font-display text-stone-400 border-4 border-white shadow-sm">
                                        {user.displayName?.charAt(0) || "M"}
                                    </div>
                                )}
                            </div>

                            <div className="text-center mb-8">
                                <h1 className={`${THEME.fontDisplay} text-2xl font-bold text-stone-900 mb-1`}>
                                    {user.displayName || t('account.valuedMember')}
                                </h1>
                                <p className="text-stone-500 text-sm font-sans flex items-center justify-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    {user.email}
                                </p>
                            </div>

                            <div className="space-y-4 border-t border-dashed border-stone-200 pt-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-stone-500 font-sans uppercase tracking-widest text-xs">{t('account.memberSince')}</span>
                                    <span className="font-semibold text-stone-900">
                                        {user.metadata.creationTime
                                            ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                            : "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-stone-500 font-sans uppercase tracking-widest text-xs">{t('account.status')}</span>
                                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-semibold border border-green-100">
                                        {t('account.active')}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-100">
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    {t('account.signOut')}
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Stats & Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="w-full lg:w-2/3 space-y-8"
                    >
                        {/* Section: Overview */}
                        <div>
                            <h2 className={`${THEME.fontDisplay} text-3xl font-medium text-stone-900 mb-6 flex items-center gap-3`}>
                                {t('account.memberOverview')}
                                <div className="h-px bg-stone-200 flex-1 ml-4" />
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-orange-50 rounded-full">
                                            <PenTool className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <span className="text-4xl font-display font-medium text-stone-900">
                                            {stats ? stats.resumeCount : "—"}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">{t('account.resumesDrafted')}</h3>
                                </div>

                                <div className="bg-white p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-blue-50 rounded-full">
                                            <Star className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <span className="text-4xl font-display font-medium text-stone-900 flex items-start gap-1">
                                            {stats ? stats.avgAtsScore : "—"}<span className="text-lg text-stone-400 mt-1">%</span>
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">{t('account.avgAtsScore')}</h3>
                                </div>

                                <div className="bg-white p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-emerald-50 rounded-full">
                                            <Zap className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <span className="text-4xl font-display font-medium text-stone-900">
                                            {credits ? credits.creditsRemaining : "—"}
                                            <span className="text-lg text-stone-400 font-sans font-normal">
                                                {credits ? ` / ${credits.dailyLimit}` : ""}
                                            </span>
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">Créditos de IA hoje</h3>
                                    {credits && (
                                        <div className="mt-3 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all"
                                                style={{ width: `${Math.round((credits.creditsRemaining / credits.dailyLimit) * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                    <p className="text-xs text-stone-400 mt-2">Reinicia diariamente à meia-noite (horário de Brasília)</p>
                                </div>
                            </div>
                        </div>

                        {/* Section: Recent Manuscripts */}
                        <div>
                            <h2 className={`${THEME.fontDisplay} text-2xl font-medium text-stone-900 mb-6 flex items-center gap-3`}>
                                {t('account.recentManuscripts')}
                                <div className="h-px bg-stone-200 flex-1 ml-4" />
                            </h2>

                            <div className="bg-white border border-stone-200 divide-y divide-stone-100">
                                {recentResumes.length === 0 ? (
                                    <div className="p-8 text-center text-stone-400 font-serif italic">
                                        {t('account.noResumesYet')}
                                    </div>
                                ) : (
                                    recentResumes.map((resume) => (
                                        <Link
                                            key={resume.id ?? resume.title}
                                            href={`/resumes/${resume.id ?? ''}`}
                                            className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-stone-100 flex items-center justify-center text-stone-400">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-stone-900 group-hover:text-orange-600 transition-colors">
                                                        {resume.title || t('account.untitledResume')}
                                                    </h4>
                                                    <p className="text-xs text-stone-500">
                                                        {resume.updatedAt
                                                            ? new Date(resume.updatedAt).toLocaleDateString()
                                                            : "—"}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500" />
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Section: Danger Zone */}
                        <div>
                            <h2 className={`${THEME.fontDisplay} text-2xl font-medium text-red-700 mb-6 flex items-center gap-3`}>
                                <AlertTriangle className="w-5 h-5" />
                                {t('account.dangerZone')}
                                <div className="h-px bg-red-200 flex-1 ml-4" />
                            </h2>

                            <div className="bg-white border border-red-200 p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-stone-900">{t('account.deleteAccount')}</p>
                                        <p className="text-sm text-stone-500 mt-1">{t('account.deleteAccountDesc')}</p>
                                    </div>
                                    {!isConfirmingDelete && (
                                        <Button
                                            variant="outline"
                                            className="shrink-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                                            onClick={() => setIsConfirmingDelete(true)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {t('account.deleteAccount')}
                                        </Button>
                                    )}
                                </div>

                                {isConfirmingDelete && (
                                    <div className="mt-6 pt-6 border-t border-red-100 space-y-4">
                                        <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            {t('account.deleteAccountConfirm')}
                                        </p>
                                        {deleteError && (
                                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">
                                                {deleteError}
                                            </p>
                                        )}
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                className="border-stone-200 text-stone-600 hover:bg-stone-50"
                                                onClick={() => { setIsConfirmingDelete(false); setDeleteError(null); }}
                                                disabled={isDeleting}
                                            >
                                                {t('account.deleteAccountCancel')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="border-red-400 bg-red-600 text-white hover:bg-red-700 transition-colors"
                                                onClick={handleDeleteAccount}
                                                disabled={isDeleting}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                {isDeleting ? t('account.deleteAccountDeleting') : t('account.deleteAccountConfirmBtn')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </motion.div>
                </div>
            </main>
        </div>
    );
}
