"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    Calendar,
    Shield,
    LogOut,
    PenTool,
    FileText,
    Star,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { userApi } from "@/lib/api";
import { useTranslation } from "@/contexts/LanguageContext";

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

export default function AccountPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const [stats, setStats] = useState<{ resumeCount: number; avgAtsScore: number } | null>(null);

    useEffect(() => {
        if (user) {
            userApi.getStats().then(setStats).catch(console.error);
        }
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
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
                            </div>
                        </div>

                        {/* Section: Subscription */}
                        <div>
                            <h2 className={`${THEME.fontDisplay} text-2xl font-medium text-stone-900 mb-6 flex items-center gap-3`}>
                                {t('account.authorPlan')}
                                <div className="h-px bg-stone-200 flex-1 ml-4" />
                            </h2>

                            <div className="bg-stone-900 text-white p-8 shadow-2xl relative overflow-hidden group">
                                {/* Texture on dark card */}
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />

                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-5 h-5 text-orange-400" />
                                            <span className="text-orange-400 font-bold tracking-widest uppercase text-xs">{t('account.currentPlan')}</span>
                                        </div>
                                        <h3 className="text-3xl font-display mb-2">{t('account.freeEdition')}</h3>
                                        <p className="text-stone-400 text-sm max-w-md">
                                            {t('account.freeEditionDesc')}
                                        </p>
                                    </div>
                                    <button className="bg-white text-stone-900 px-6 py-3 font-medium hover:bg-orange-50 transition-colors shadow-lg active:transform active:scale-95">
                                        {t('account.upgradePlan')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section: Recent Activity (Mock - keeping for now as dynamic list requires more complex query) */}
                        <div>
                            <h2 className={`${THEME.fontDisplay} text-2xl font-medium text-stone-900 mb-6 flex items-center gap-3`}>
                                {t('account.recentManuscripts')}
                                <div className="h-px bg-stone-200 flex-1 ml-4" />
                            </h2>

                            <div className="bg-white border border-stone-200 divide-y divide-stone-100">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-stone-100 flex items-center justify-center text-stone-400 font-serif text-lg">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-stone-900 group-hover:text-orange-600 transition-colors">{t('account.softwareEngineerResume')}{i}</h4>
                                                <p className="text-xs text-stone-500">{t('account.edited2DaysAgo')}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500" />
                                    </div>
                                ))}
                            </div>
                        </div>

                    </motion.div>
                </div>
            </main>
        </div>
    );
}
