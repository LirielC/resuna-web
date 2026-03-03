import en from './en.json';
import ptBR from './pt-BR.json';

export type Locale = 'en' | 'pt-BR';

export type TranslationDict = typeof en;

export const dictionaries: Record<Locale, TranslationDict> = {
    'en': en,
    'pt-BR': ptBR as TranslationDict,
};

/**
 * Look up a translation key using dot-notation.
 * Supports simple interpolation: {{key}} placeholders.
 *
 * @example t(dict, 'create.basics.title') => "Start with the Basics"
 * @example t(dict, 'common.creditUsedRemaining', { count: 5 }) => "1 credit used. 5 remaining."
 */
export function translate(
    dict: TranslationDict,
    key: string,
    params?: Record<string, string | number>,
): string {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = dict;

    for (const k of keys) {
        if (result == null || typeof result !== 'object') return key;
        result = result[k];
    }

    if (typeof result !== 'string') return key;

    if (params) {
        return result.replace(/\{\{(\w+)\}\}/g, (_, name) =>
            params[name] != null ? String(params[name]) : `{{${name}}}`,
        );
    }

    return result;
}
