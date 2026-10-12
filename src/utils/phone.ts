/** Accounts are email only. Trims and lower-cases the address. */
export function validateEmail(input: string): { isValid: boolean; formatted: string; errorMessage?: string } {
  const formatted = input.trim().toLowerCase();
  if (!formatted) return { isValid: false, formatted, errorMessage: 'Email address is required' };
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formatted);
  return { isValid, formatted, errorMessage: isValid ? undefined : 'Please enter a valid email address' };
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
