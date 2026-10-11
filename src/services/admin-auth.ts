import { api } from './api';

/* Admin accounts: email + password sign-in (an httpOnly cookie carries the
   session), password reset by emailed code, invitations, and — for the super
   admin only — inviting and removing admins. */

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  status: 'invited' | 'active';
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const post = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body });

/** The signed-in admin, or null when nobody is signed in. */
export async function currentAdminAccount(): Promise<AdminAccount | null> {
  try {
    return (await api<{ admin: AdminAccount }>('/api/admin-auth/me')).admin;
  } catch {
    return null;
  }
}

export const adminLogin = async (email: string, password: string) =>
  (await post<{ admin: AdminAccount }>('/api/admin-auth/login', { email, password })).admin;

export const adminLogout = () => post('/api/admin-auth/logout', {});

/** Emails a 6-digit reset code (the server answers the same for any email). */
export const adminForgot = (email: string) => post('/api/admin-auth/forgot', { email });

export const adminReset = (email: string, code: string, password: string) =>
  post('/api/admin-auth/reset', { email, code, password });

export const adminChangePassword = async (current: string, password: string) =>
  (await post<{ admin: AdminAccount }>('/api/admin-auth/change-password', { current, password })).admin;

export const adminAcceptInvite = async (email: string, code: string, name: string, password: string) =>
  (await post<{ admin: AdminAccount }>('/api/admin-auth/accept-invite', { email, code, name, password })).admin;

/* ---------------------------------------------------- Super admin only */

export const listAdmins = () => api<AdminAccount[]>('/api/admin/admins');

export const inviteAdmin = (email: string, name: string) => post<AdminAccount>('/api/admin/admins/invite', { email, name });

export const resendInvite = (id: string) => post(`/api/admin/admins/${id}/resend`, {});

/** Needs the super admin's own password again. */
export const removeAdmin = (id: string, password: string) =>
  api(`/api/admin/admins/${id}`, { method: 'DELETE', body: { password } });
