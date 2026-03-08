"use client";

interface ConfirmDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "default";
}

export function ConfirmDialog({
    message,
    onConfirm,
    onCancel,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "default",
}: ConfirmDialogProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onCancel}
        >
            <div
                className="bg-white border border-stone-200 shadow-xl p-8 max-w-sm w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-stone-700 font-serif text-base mb-6 leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-400 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm text-white transition-colors ${
                            variant === "danger"
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-stone-900 hover:bg-stone-700"
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
