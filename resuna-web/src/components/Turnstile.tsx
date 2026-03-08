'use client';

import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef } from 'react';

interface TurnstileWrapperProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

/**
 * Cloudflare Turnstile CAPTCHA Component
 *
 * Invisível na maioria dos casos - só mostra checkbox quando necessário
 * Sem puzzles chatos de selecionar placas/semáforos
 *
 * @example
 * <TurnstileWrapper
 *   onSuccess={(token) => setCaptchaToken(token)}
 *   onError={() => setCaptchaToken(null)}
 * />
 */
export default function TurnstileWrapper({
  onSuccess,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
}: TurnstileWrapperProps) {
  const turnstileRef = useRef<TurnstileInstance>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={() => {
          if (process.env.NODE_ENV !== 'production') console.error('Turnstile error');
          onError?.();
        }}
        onExpire={() => {
          if (process.env.NODE_ENV !== 'production') console.warn('Turnstile token expired');
          onExpire?.();
        }}
        options={{
          theme,
          size,
          language: 'pt-BR',
          appearance: 'interaction-only',
        }}
      />
    </div>
  );
}
