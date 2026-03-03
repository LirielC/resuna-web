import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar estado do Turnstile CAPTCHA
 *
 * @example
 * const { token, setToken, isVerified, reset } = useTurnstile();
 *
 * <TurnstileWrapper
 *   onSuccess={setToken}
 *   onError={reset}
 * />
 *
 * <button disabled={!isVerified}>Submit</button>
 */
export function useTurnstile() {
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
  }, []);

  const reset = useCallback(() => {
    setTokenState(null);
  }, []);

  const isVerified = token !== null && token.length > 0;

  return {
    token,
    setToken,
    reset,
    isVerified,
  };
}
