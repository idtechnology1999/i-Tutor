/**
 * Nigerian Phone Number Normalization Utility
 * Supports prefixes: 080..., 070..., 090..., 081..., +234..., 234...
 */
export function normalizeNigerianPhone(input: string): {
  isValid: boolean;
  formatted: string;
  e164: string;
  errorMessage?: string;
} {
  // Strip whitespace, dashes, and parentheses
  const cleaned = input.replace(/[\s\-()]/g, '');

  if (!cleaned) {
    return { isValid: false, formatted: '', e164: '', errorMessage: 'Phone number is required' };
  }

  // Check if it's an email instead
  if (cleaned.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(cleaned);
    return {
      isValid: isValidEmail,
      formatted: cleaned,
      e164: cleaned,
      errorMessage: isValidEmail ? undefined : 'Please enter a valid email address',
    };
  }

  let normalized = cleaned;

  // Handle +234 or 234 prefix
  if (normalized.startsWith('+234')) {
    normalized = normalized.slice(4);
  } else if (normalized.startsWith('234')) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith('0')) {
    normalized = normalized.slice(1);
  }

  // Valid Nigerian phone numbers have 10 digits after prefix removal (e.g. 8031234567)
  // Valid prefixes in Nigeria: 70, 80, 81, 90, 91
  const validNigerianPrefixes = /^(70|80|81|90|91)\d{8}$/;

  if (validNigerianPrefixes.test(normalized)) {
    const formatted = `0${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
    const e164 = `+234${normalized}`;
    return { isValid: true, formatted, e164 };
  }

  return {
    isValid: false,
    formatted: input,
    e164: '',
    errorMessage: 'Please enter a valid Nigerian mobile number (e.g. 0801 234 5678)',
  };
}

/**
 * Calculates password strength meter (0 - 4 bars)
 * Weak (1), Fair (2), Good (3), Strong (4)
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  label: 'Too Short' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  checks: {
    length: boolean;
    hasNumberOrSymbol: boolean;
    hasUppercase: boolean;
    hasSpecial: boolean;
  };
} {
  const checks = {
    length: password.length >= 8,
    hasNumberOrSymbol: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (checks.length) score += 1;
  if (checks.hasNumberOrSymbol) score += 1;
  if (checks.hasUppercase && checks.hasSpecial) score += 1;

  if (score === 0) return { score: 0, label: 'Too Short', color: '#D1D5DB', checks };
  if (score === 1) return { score: 1, label: 'Weak', color: '#DC2626', checks };
  if (score === 2) return { score: 2, label: 'Fair', color: '#F59E0B', checks };
  if (score === 3) return { score: 3, label: 'Good', color: '#10B981', checks };
  return { score: 4, label: 'Strong', color: '#059669', checks };
}
