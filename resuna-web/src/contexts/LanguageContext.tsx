"use client";

import {
    createContext,
    useContext,
    useCallback,
    type ReactNode,
} from "react";
import { type Locale, type TranslationDict, dictionaries, translate } from "@/i18n";

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    dict: TranslationDict;
}

const FIXED_LOCALE: Locale = "pt-BR";

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const dict = dictionaries[FIXED_LOCALE];

    const t = useCallback(
        (key: string, params?: Record<string, string | number>) =>
            translate(dict, key, params),
        [dict],
    );

    const setLocale = useCallback((_locale: Locale) => {
        // No-op: site is Portuguese-only
    }, []);

    const value: LanguageContextType = {
        locale: FIXED_LOCALE,
        setLocale,
        t,
        dict,
    };

    return (
        <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
}
