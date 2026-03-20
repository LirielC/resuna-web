'use client';

import { useState, FormEvent } from 'react';
import TurnstileWrapper from '../Turnstile';
import { useTurnstile } from '@/hooks/useTurnstile';

/**
 * EXEMPLO: Formulário de Signup com Cloudflare Turnstile
 *
 * Este é um EXEMPLO de como usar o Turnstile no signup.
 * Adapte para o seu sistema de autenticação existente.
 *
 * Para usar:
 * 1. Copie este código para seu componente de signup
 * 2. Adapte para usar seu AuthContext/Firebase
 * 3. Envie o captchaToken para o backend no signup
 */
export default function SignupFormWithTurnstile() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { token: captchaToken, setToken, reset } = useTurnstile();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar CAPTCHA
    if (!captchaToken) {
      setError('Por favor, complete a verificação de segurança');
      return;
    }

    setLoading(true);

    try {
      // ENVIAR captchaToken para o backend
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          captchaToken, // ← Token do Turnstile
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      // Sucesso!
      alert('Conta criada com sucesso!');
      // Redirecionar ou fazer login automático...

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
      reset(); // Reset CAPTCHA em caso de erro
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Criar Conta</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="seu@email.com"
          />
        </div>

        {/* Senha */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {/* CAPTCHA Cloudflare Turnstile */}
        <div className="py-2">
          <TurnstileWrapper
            onSuccess={setToken}
            onError={reset}
            onExpire={reset}
            theme="light"
          />
        </div>

        {/* Erro */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Botão Submit */}
        <button
          type="submit"
          disabled={loading || !captchaToken}
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </button>

        {/* Aviso CAPTCHA */}
        <p className="text-xs text-gray-500 text-center">
          Este site é protegido por Cloudflare Turnstile e a{' '}
          <a
            href="https://www.cloudflare.com/privacypolicy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Política de Privacidade
          </a>{' '}
          da Cloudflare se aplica.
        </p>
      </form>
    </div>
  );
}
