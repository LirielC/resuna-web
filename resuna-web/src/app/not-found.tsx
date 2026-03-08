import Link from "next/link";
import { FileText } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center font-serif text-stone-900 px-6">
            {/* Texture Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            <div className="relative z-10 max-w-lg text-center space-y-8">
                {/* Logo */}
                <Link href="/" className="inline-flex items-center gap-2 group mb-4">
                    <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold text-stone-900 tracking-tight">Resuna</span>
                </Link>

                {/* 404 Number */}
                <div className="relative">
                    <p className="text-[10rem] leading-none font-display font-bold text-stone-100 select-none">
                        404
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-px w-24 bg-orange-500" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-3">
                    <h1 className="font-display text-3xl font-semibold text-stone-900">
                        Página não encontrada
                    </h1>
                    <p className="text-stone-500 text-lg italic">
                        Este arquivo não existe ou você não tem permissão para acessá-lo.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link
                        href="/"
                        className="px-8 py-3 bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
                    >
                        Voltar ao início
                    </Link>
                    <Link
                        href="/resumes"
                        className="px-8 py-3 border border-stone-300 text-stone-700 font-medium hover:border-orange-400 hover:text-orange-600 transition-colors"
                    >
                        Meus currículos
                    </Link>
                </div>
            </div>
        </div>
    );
}
