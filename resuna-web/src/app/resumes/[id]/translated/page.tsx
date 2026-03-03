"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    FileText,
    Loader2,
    Download,
    Globe,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { resumeApi } from "@/lib/api";
import type { Resume } from "@/lib/types";

// Design System: Editorial Luxury
const THEME = {
    bg: "bg-[#F8F6F1]",
    fontDisplay: "font-display",
    fontBody: "font-serif",
};

export default function TranslatedPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const resumeId = params.id as string;

    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadResume = async () => {
            try {
                const data = await resumeApi.getById(resumeId);
                setResume(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Falha ao carregar currículo");
            } finally {
                setLoading(false);
            }
        };
        loadResume();
    }, [resumeId]);

    const handleDownloadPdf = useCallback(async () => {
        if (!resume) return;
        setDownloading(true);
        try {
            const blob = await resumeApi.downloadPdf(resumeId, "en");
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const fileName = resume.personalInfo?.fullName || "resume";
            a.download = `${fileName}-en.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setToastMessage("PDF baixado com sucesso!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao baixar PDF");
        } finally {
            setDownloading(false);
        }
    }, [resume, resumeId]);

    // Loading state
    if (loading) {
        return (
            <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody}`}>
                <Header />
                <main className="relative z-10 pt-28 lg:pt-36 pb-24">
                    <div className="container-custom max-w-3xl flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-4" />
                        <p className="text-stone-500 font-serif italic">Carregando currículo traduzido...</p>
                    </div>
                </main>
            </div>
        );
    }

    // Error state
    if (error && !resume) {
        return (
            <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody}`}>
                <Header />
                <main className="relative z-10 pt-28 lg:pt-36 pb-24">
                    <div className="container-custom max-w-3xl text-center py-20">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={() => router.push("/resumes")} className="font-serif">
                            Voltar aos Currículos
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    if (!resume) return null;

    return (
        <div className={`min-h-screen ${THEME.bg} ${THEME.fontBody} text-stone-900 selection:bg-orange-100 selection:text-orange-900`}>
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

            {/* Texture Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            <Header />

            <main className="relative z-10 pt-28 lg:pt-36 pb-24">
                <div className="container-custom max-w-3xl">
                    {/* Back button */}
                    <button
                        onClick={() => router.push("/resumes")}
                        className="inline-flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-10 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar aos Currículos
                    </button>

                    {/* Page Title */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Globe className="w-6 h-6 text-orange-600" />
                            <h1 className="text-3xl font-display font-bold text-stone-900">
                                Currículo Traduzido
                            </h1>
                        </div>
                        <p className="text-stone-500 font-serif italic ml-9">
                            Versão em inglês do seu currículo, pronta para download.
                        </p>
                    </div>

                    {/* Resume Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white border border-stone-200 shadow-lg p-8 md:p-12 max-w-2xl mx-auto mb-10"
                        style={{ transform: "rotate(0.5deg)" }}
                    >
                        {/* Paper Header */}
                        <div className="text-center border-b border-stone-200 pb-6 mb-6">
                            <h2 className="text-3xl font-display font-bold text-stone-900 mb-2">
                                {resume.personalInfo.fullName || "Your Name"}
                            </h2>
                            <div className="text-sm text-stone-500 font-serif italic space-x-3">
                                <span>{resume.personalInfo.email}</span>
                                {resume.personalInfo.phone && <span>• {resume.personalInfo.phone}</span>}
                                {resume.personalInfo.location && <span>• {resume.personalInfo.location}</span>}
                            </div>
                            {(resume.personalInfo.linkedin || resume.personalInfo.github) && (
                                <div className="text-xs text-stone-400 font-serif mt-2 space-x-3">
                                    {resume.personalInfo.linkedin && <span>{resume.personalInfo.linkedin}</span>}
                                    {resume.personalInfo.github && <span>{resume.personalInfo.github}</span>}
                                </div>
                            )}
                        </div>

                        {/* Sections */}
                        <div className="space-y-6 text-stone-800 font-serif text-sm leading-relaxed">
                            {/* Profile / Summary */}
                            {resume.summary && (
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                                        PROFILE
                                    </span>
                                    <p>{resume.summary}</p>
                                </div>
                            )}

                            {/* Experience */}
                            {resume.experience && resume.experience.length > 0 && resume.experience[0].title && (
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
                                        EXPERIENCE
                                    </span>
                                    <div className="space-y-4">
                                        {resume.experience.filter(e => e.title || e.company).map((exp, i) => (
                                            <div key={i}>
                                                <p className="font-semibold">{exp.title} {exp.company && `• ${exp.company}`}</p>
                                                {(exp.startDate || exp.endDate) && (
                                                    <p className="text-xs text-stone-400 mt-0.5">
                                                        {exp.startDate} {exp.endDate ? `— ${exp.endDate}` : "— Present"}
                                                    </p>
                                                )}
                                                {exp.bullets && exp.bullets.filter(b => b.trim()).length > 0 && (
                                                    <ul className="list-disc ml-5 mt-1 space-y-0.5 text-stone-600">
                                                        {exp.bullets.filter(b => b.trim()).map((bullet, bi) => (
                                                            <li key={bi}>{bullet}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {resume.education && resume.education.length > 0 && resume.education[0].degree && (
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
                                        EDUCATION
                                    </span>
                                    <div className="space-y-3">
                                        {resume.education.filter(e => e.degree || e.institution).map((edu, i) => (
                                            <div key={i}>
                                                <p className="font-semibold">{edu.degree}</p>
                                                <p className="text-stone-500 italic">{edu.institution}</p>
                                                {edu.graduationDate && (
                                                    <p className="text-xs text-stone-400">{edu.graduationDate}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Projects */}
                            {resume.projects && resume.projects.length > 0 && resume.projects[0].name && (
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
                                        PROJECTS
                                    </span>
                                    <div className="space-y-3">
                                        {resume.projects.filter(p => p.name).map((project, i) => (
                                            <div key={i}>
                                                <p className="font-semibold">{project.name}</p>
                                                {project.description && (
                                                    <p className="text-stone-600 text-xs">{project.description}</p>
                                                )}
                                                {project.technologies && project.technologies.length > 0 && (
                                                    <p className="text-xs text-stone-400 mt-0.5">
                                                        {project.technologies.join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {resume.skills && resume.skills.length > 0 && (
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                                        SKILLS
                                    </span>
                                    <p>{resume.skills.join(", ")}</p>
                                </div>
                            )}

                            {/* Certifications */}
                            {resume.certifications && resume.certifications.length > 0 && resume.certifications[0].name && (
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                                        CERTIFICATIONS
                                    </span>
                                    <div className="space-y-1">
                                        {resume.certifications.filter(c => c.name).map((cert, i) => (
                                            <p key={i}>
                                                <span className="font-semibold">{cert.name}</span>
                                                {cert.issuer && <span className="text-stone-500"> — {cert.issuer}</span>}
                                                {cert.date && <span className="text-stone-400 text-xs"> ({cert.date})</span>}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Languages */}
                            {resume.languages && resume.languages.length > 0 && resume.languages[0].name && (
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                                        LANGUAGES
                                    </span>
                                    <p>{resume.languages.map(l => `${l.name} (${l.level})`).join(", ")}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="flex flex-col items-center gap-4 max-w-sm mx-auto"
                    >
                        {/* Main: Download PDF */}
                        <Button
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                            className="w-full font-serif bg-orange-600 hover:bg-orange-700 text-white py-3 text-base"
                        >
                            {downloading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Baixando...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Baixar PDF em Inglês
                                </>
                            )}
                        </Button>

                    </motion.div>

                    {/* Error display */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-sm max-w-2xl mx-auto">
                            {error}
                        </div>
                    )}
                </div>
            </main>

        </div>
    );
}
