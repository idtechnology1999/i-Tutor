/** Accounts are email only. Trims and lower-cases the address. */
export function validateEmail(input: string): { isValid: boolean; formatted: string; errorMessage?: string } {
  const formatted = input.trim().toLowerCase();
  if (!formatted) return { isValid: false, formatted, errorMessage: 'Email address is required' };
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formatted);
  return { isValid, formatted, errorMessage: isValid ? undefined : 'Please enter a valid email address' };
}

/* Passwords: at least 8 characters, any kind (words, spaces, numbers, a
   sentence). No uppercase/number/symbol rules: students kept forgetting
   passwords made to fit them. Only the most guessed passwords are refused
   (the server checks the same list, and locks an account after 5 wrong tries). */
export const PASSWORD_MIN = 8;
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', '12341234', '11223344',
  'password', 'password1', 'password123', 'passw0rd', 'qwertyui', 'qwerty123', 'asdfghjk', 'abcd1234',
  'abcdefgh', 'iloveyou', 'itutor123', 'i-tutor123', 'jamb2025', 'jamb2026', 'jamb2027', 'nigeria1', 'nigeria123',
]);
export const isCommonPassword = (pw: string) => COMMON_PASSWORDS.has(pw.trim().toLowerCase());
/** What's wrong with a new password, or '' when it's fine. */
export function passwordProblem(pw: string): string {
  if (pw.length < PASSWORD_MIN) return 'Use at least 8 characters. A short sentence you’ll remember works well.';
  if (isCommonPassword(pw)) return 'That password is too easy to guess. Try a short sentence you’ll remember.';
  return '';
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
