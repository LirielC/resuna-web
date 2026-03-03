import { useEffect } from "react";

interface ToastProps {
    message: string;
    onClose: () => void;
    durationMs?: number;
}

export function Toast({ message, onClose, durationMs = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, durationMs);
        return () => clearTimeout(timer);
    }, [onClose, durationMs]);

    return (
        <div className="fixed top-6 right-6 z-50">
            <div className="bg-stone-900 text-white px-4 py-3 rounded-md shadow-lg text-sm">
                {message}
            </div>
        </div>
    );
}
