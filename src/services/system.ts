import { API_BASE, api } from './api';
import { PIECE, sendPiece } from './upload-piece';

/* Whole-system backup and restore, and resetting one exam (backend
   routes/admin/system.ts). Everything needs the super admin password. Files
   move in 3 MB pieces, because the website's proxy limits one request. */

export interface BackupSummary {
  createdAt: string;
  counts: Record<string, number>;
}


/** Downloads a backup of everything (questions, users, admins, settings…) as a .json.gz file. */
export async function downloadBackup(password: string, onProgress?: (text: string) => void): Promise<BackupSummary> {
  onProgress?.('Preparing the backup…');
  const job = await api<{ id: string; parts: number; bytes: number; summary: BackupSummary }>('/api/admin/system/backup', {
    method: 'POST',
    body: { password },
    timeout: 300_000,
  });
  const parts: ArrayBuffer[] = [];
  for (let i = 0; i < job.parts; i += 1) {
    onProgress?.(`Downloading: ${Math.round((i / job.parts) * 100)}%…`);
    const res = await fetch(`${API_BASE}/api/admin/system/backup/${job.id}/${i}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`The download stopped (${res.status}). Try again.`);
    parts.push(await res.arrayBuffer());
  }
  const blob = new Blob(parts, { type: 'application/gzip' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `itutor-backup-${job.summary.createdAt.slice(0, 16).replace(/[:T]/g, '-')}.json.gz`;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  return job.summary;
}

/** Sends a backup file to the server and says what it holds (nothing changes yet). */
export async function uploadBackup(file: File, password: string, onProgress?: (text: string) => void): Promise<{ id: string; summary: BackupSummary }> {
  const { id } = await api<{ id: string }>('/api/admin/system/restore', { method: 'POST', body: { password } });
  for (let at = 0; at < file.size; at += PIECE) {
    onProgress?.(`Uploading: ${Math.round((at / file.size) * 100)}%…`);
    await sendPiece(`/api/admin/system/restore/${id}/chunk`, file.slice(at, at + PIECE));
  }
  onProgress?.('Checking the file…');
  const summary = await api<BackupSummary>(`/api/admin/system/restore/${id}/check`, { method: 'POST', body: {} });
  return { id, summary };
}

/** Replaces everything with the uploaded backup (a safety copy is kept on the server first). */
export const runRestore = (id: string, password: string) =>
  api<{ restored: Record<string, number>; safety: string }>(`/api/admin/system/restore/${id}/run`, {
    method: 'POST',
    body: { password, confirm: 'RESTORE' },
    timeout: 300_000,
  });

export interface ExamCount {
  /** '' = the shared practice bank. */
  exam: string;
  label: string;
  past: number;
  practice: number;
}

export const questionCounts = () => api<ExamCount[]>('/api/admin/system/counts');

/** Empties one exam (its past questions and its own practice bank); 'shared' = the shared practice bank. */
export const resetExam = (exam: string, password: string, confirm: string) =>
  api<{ removed: number; safety: string }>(`/api/admin/system/reset/${encodeURIComponent(exam || 'shared')}`, {
    method: 'POST',
    body: { password, confirm },
    timeout: 300_000,
  });
