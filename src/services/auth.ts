import { api, demoDelay, isLive } from './api';
import type { UserProfile } from '../types';

/* Accounts: sign-up with a one-time code, login, password reset.
   Demo mode accepts any valid-looking input, as the screens always have. */

export interface SignUpInput {
  fullName: string;
  phoneOrEmail: string;
  password: string;
}

/** Creates the account and sends a 6-digit code by SMS or email. */
export async function signUp(input: SignUpInput) {
  if (!isLive) return demoDelay(400);
  await api('/api/auth/signup', { method: 'POST', body: input });
}

/** Confirms the code; the backend starts the session (httpOnly cookie). */
export async function verifyCode(phoneOrEmail: string, code: string): Promise<{ profile?: UserProfile }> {
  if (!isLive) {
    await demoDelay(700);
    return {};
  }
  return api('/api/auth/verify', { method: 'POST', body: { phoneOrEmail, code } });
}

export async function resendCode(phoneOrEmail: string) {
  if (!isLive) return;
  await api('/api/auth/resend', { method: 'POST', body: { phoneOrEmail } });
}

export async function logIn(phoneOrEmail: string, password: string): Promise<{ profile?: UserProfile }> {
  if (!isLive) {
    await demoDelay(650);
    return {};
  }
  return api('/api/auth/login', { method: 'POST', body: { phoneOrEmail, password } });
}

/** Always "succeeds" so nobody can probe which accounts exist. */
export async function requestPasswordReset(phoneOrEmail: string) {
  if (!isLive) return demoDelay(700);
  await api('/api/auth/forgot', { method: 'POST', body: { phoneOrEmail } });
}

export async function resetPassword(phoneOrEmail: string, code: string, password: string) {
  if (!isLive) return demoDelay(800);
  await api('/api/auth/reset', { method: 'POST', body: { phoneOrEmail, code, password } });
}

export async function logOut() {
  if (!isLive) return;
  await api('/api/auth/logout', { method: 'POST' });
}
