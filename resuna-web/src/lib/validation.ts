/**
 * Utilitários de validação para formulários
 */

/**
 * Valida se um email é válido
 */
export function isValidEmail(email: string): boolean {
  if (!email) return true; // Campo vazio é válido (use required separadamente)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida se uma URL é válida
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true; // Campo vazio é válido (use required separadamente)

  try {
    // Adiciona https:// se não tiver protocolo
    const urlToTest = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

    new URL(urlToTest);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida se a data de término é posterior à data de início
 */
export function isEndDateAfterStartDate(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return true; // Se algum campo vazio, não valida

  const start = new Date(startDate + '-01'); // Adiciona dia para comparação
  const end = new Date(endDate + '-01');

  return end >= start;
}

/**
 * Valida se uma data está em um range razoável (1950 até 10 anos no futuro)
 */
export function isValidDateRange(date: string): boolean {
  if (!date) return true;

  const year = parseInt(date.split('-')[0]);
  const currentYear = new Date().getFullYear();

  return year >= 1950 && year <= currentYear + 10;
}

/**
 * Valida se um campo obrigatório está preenchido
 */
export function isRequired(value: string | undefined | null): boolean {
  if (value === undefined || value === null) return false;
  return value.trim().length > 0;
}

/**
 * Valida comprimento mínimo
 */
export function minLength(value: string, min: number): boolean {
  if (!value) return true;
  return value.trim().length >= min;
}

/**
 * Valida comprimento máximo
 */
export function maxLength(value: string, max: number): boolean {
  if (!value) return true;
  return value.trim().length <= max;
}

/**
 * Normaliza URL adicionando https:// se necessário
 */
export function normalizeUrl(url: string): string {
  if (!url) return url;

  const trimmed = url.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * Valida telefone brasileiro (formato flexível)
 */
export function isValidPhoneBR(phone: string): boolean {
  if (!phone) return true;

  // Remove todos os caracteres não numéricos
  const digitsOnly = phone.replace(/\D/g, '');

  // Aceita 10 dígitos (fixo) ou 11 dígitos (celular com 9)
  return digitsOnly.length === 10 || digitsOnly.length === 11;
}

/**
 * Retorna mensagem de erro para email inválido
 */
export function getEmailErrorMessage(email: string): string | null {
  if (!email) return null;
  if (!isValidEmail(email)) {
    return 'Email inválido. Use o formato: exemplo@dominio.com';
  }
  return null;
}

/**
 * Retorna mensagem de erro para URL inválida
 */
export function getUrlErrorMessage(url: string): string | null {
  if (!url) return null;
  if (!isValidUrl(url)) {
    return 'URL inválida. Exemplo: linkedin.com/in/seunome';
  }
  return null;
}

/**
 * Retorna mensagem de erro para telefone inválido
 */
export function getPhoneErrorMessage(phone: string): string | null {
  if (!phone) return null;
  if (!isValidPhoneBR(phone)) {
    return 'Telefone inválido. Use o formato: (11) 91234-5678';
  }
  return null;
}

/**
 * Retorna mensagem de erro para datas inválidas
 */
export function getDateRangeErrorMessage(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return null;
  if (!isEndDateAfterStartDate(startDate, endDate)) {
    return 'A data de término deve ser posterior à data de início';
  }
  return null;
}
