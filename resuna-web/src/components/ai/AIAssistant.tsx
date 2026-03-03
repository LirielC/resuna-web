"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Wand2,
    X,
    Loader2,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { aiApi, subscriptionApi } from "@/lib/api";
import TurnstileWrapper from "@/components/Turnstile";

interface AIAssistantProps {
    resumeId: string;
    onRefineComplete?: (refinedBullets: string[]) => void;
}

const TONES = [
    { id: "professional", label: "Profissional", description: "Formal e corporativo" },
    { id: "creative", label: "Criativo", description: "Dinâmico e inovador" },
    { id: "technical", label: "Técnico", description: "Preciso e detalhado" },
];

export function AIAssistant({ resumeId, onRefineComplete }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const [captchaToken, setCaptchaToken] = useState<string | null>(turnstileSiteKey ? null : '');

    // Refine state
    const [targetRole, setTargetRole] = useState("");
    const [targetIndustry, setTargetIndustry] = useState("");
    const [tone, setTone] = useState<"professional" | "creative" | "technical">("professional");

    const handleRefine = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await aiApi.refineBullets({
                resumeId,
                targetRole: targetRole || undefined,
                targetIndustry: targetIndustry || undefined,
                tone,
                captchaToken: captchaToken || undefined,
            });
            setCaptchaToken(turnstileSiteKey ? null : '');
            onRefineComplete?.(result.refinedBullets);
            setSuccess(`${result.refinedBullets.length} tópicos refinados com sucesso!`);
            try {
                const credits = await subscriptionApi.getCredits();
                setToastMessage(`1 crédito usado. ${credits.creditsRemaining} restantes.`);
            } catch {
                setToastMessage("1 crédito usado.");
            }
        } catch (err: any) {
            setError(err.message || "Falha ao refinar. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            {/* AI Button */}
            <Button
                onClick={() => setIsOpen(true)}
                className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
                <Sparkles className="w-4 h-4" />
                Assistente IA
            </Button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900 dark:text-white">Assistente IA</h2>
                                        <p className="text-sm text-gray-500">Refine seu currículo com IA</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Error/Success Messages */}
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        {success}
                                    </div>
                                )}

                                {/* Refine Content */}
                                <div className="space-y-5">
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            A IA vai analisar e melhorar os tópicos da sua experiência para ficarem mais impactantes e otimizados para ATS.
                                        </p>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Cargo Desejado (opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={targetRole}
                                                onChange={(e) => setTargetRole(e.target.value)}
                                                placeholder="ex: Engenheiro de Software"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Indústria (opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={targetIndustry}
                                                onChange={(e) => setTargetIndustry(e.target.value)}
                                                placeholder="ex: FinTech, Saúde"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tom
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {TONES.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setTone(t.id as any)}
                                                        className={`p-3 rounded-lg border text-left transition-all ${tone === t.id
                                                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <p className={`font-medium text-sm ${tone === t.id ? "text-purple-700 dark:text-purple-300" : "text-gray-700 dark:text-gray-300"}`}>
                                                            {t.label}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <TurnstileWrapper
                                            onSuccess={(token) => setCaptchaToken(token)}
                                            onExpire={() => setCaptchaToken(null)}
                                            onError={() => setCaptchaToken(null)}
                                            size="compact"
                                        />

                                        <Button
                                            onClick={handleRefine}
                                            disabled={isLoading || captchaToken === null}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                                            {isLoading ? "Refinando..." : "Refinar Meu Currículo"}
                                        </Button>
                                    </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
