import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, CircleDashed, FileUp, LoaderCircle, MinusCircle, Upload, X } from 'lucide-react';
import { CMS_SUBJECTS, syncQuestions } from '../../lib/cms';
import { isBySchool, liveExams } from '../../lib/exams';
import { SCHOOLS } from '../../lib/schools';
import { bulkUpload } from '../../services/bulk';
import type { BulkJob, BulkPaper } from '../../services/bulk';
import type { AdminNav } from './AdminApp';

/* Bulk upload: drop in files that each hold several past papers (e.g. JAMB
   English 1999–2004). The server finds every paper in a file and files each
   one under its exam, subject and year, as drafts to check and publish.
   Files are done one after another; a year already in the bank is skipped. */

const STATE: Record<BulkPaper['state'], { label: string; icon: typeof CheckCircle2 }> = {
  waiting: { label: 'Waiting', icon: CircleDashed },
  reading: { label: 'Reading…', icon: LoaderCircle },
  saved: { label: 'Saved as drafts', icon: CheckCircle2 },
  skipped: { label: 'Skipped', icon: MinusCircle },
  failed: { label: 'Failed', icon: CircleAlert },
};

interface Row {
  file: File;
  job: BulkJob | null;
  error: string;
}

export const BulkUpload: React.FC<{ nav: AdminNav; defaultExam: string; onClose: () => void }> = ({ nav, defaultExam, onClose }) => {
  const exams = liveExams();
  const [exam, setExam] = useState(exams.some((e) => e.id === defaultExam) ? defaultExam : (exams[0]?.id ?? 'UTME'));
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bySchool = isBySchool(exam);
  const finished = !running && rows.some((r) => r.job?.stage === 'done' || r.error || r.job?.stage === 'failed');

  // Closing mid-upload would lose sight of it; ask first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !running && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, onClose]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const ok = [...list].filter((f) => /\.(pdf|docx|xlsx|txt|jpe?g|png|webp)$/i.test(f.name));
    if (ok.length < list.length) nav.notify('Some files were left out: use PDF, Word, Excel, text or photos.');
    setRows((prev) => [...prev, ...ok.map((file) => ({ file, job: null, error: '' }))]);
  };

  const start = async () => {
    if (bySchool && !school) return nav.notify('Choose the university for Post-UTME papers.');
    setRunning(true);
    let papers = 0;
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i]!.job || rows[i]!.error) continue;
      try {
        const job = await bulkUpload(rows[i]!.file, { exam, school, subject }, (j) =>
          setRows((prev) => prev.map((r, k) => (k === i ? { ...r, job: j } : r))),
        );
        papers += job.papers.filter((p) => p.state === 'saved').length;
      } catch (e) {
        setRows((prev) => prev.map((r, k) => (k === i ? { ...r, error: (e as Error).message } : r)));
      }
    }
    setRunning(false);
    if (!papers) return nav.notify('No new papers were saved. See the notes beside each file.');
    // The new drafts appear in the bank.
    await syncQuestions('admin').catch(() => undefined);
    nav.notify(`${papers} paper${papers === 1 ? '' : 's'} saved as drafts. Check them, then publish.`);
  };

  const pending = rows.filter((r) => !r.job && !r.error).length;

  return (
    <div className="cms-modal" onClick={() => !running && onClose()}>
      <div className="cms-modal__panel bulk" role="dialog" aria-modal="true" aria-labelledby="bulk-title" onClick={(e) => e.stopPropagation()}>
        <header className="cms-modal__head">
          <h2 id="bulk-title">
            <FileUp size={20} aria-hidden /> Bulk upload
          </h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} disabled={running} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>

        <div className="cms-modal__body bulk__body">
          <p className="adm-muted">
            Upload files that hold one or many past papers, for example <b>JAMB English 1999–2004</b> in one PDF. The AI finds each paper and files it under
            its own year. Everything arrives as drafts for you to check; a year already in the bank is left as it is.
          </p>

          <div className="bulk__opts">
            <label className="adm-field">
              <span>Exam</span>
              <select className="adm-input" value={exam} onChange={(e) => setExam(e.target.value)} disabled={running}>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </label>
            {bySchool && (
              <label className="adm-field">
                <span>University</span>
                <select className="adm-input" value={school} onChange={(e) => setSchool(e.target.value)} disabled={running}>
                  <option value="">Choose…</option>
                  {SCHOOLS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} · {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="adm-field">
              <span>Subject</span>
              <select className="adm-input" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={running}>
                <option value="">Find it in the file</option>
                {CMS_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            className="bulk__drop"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            disabled={running}
          >
            <Upload size={22} aria-hidden />
            <strong>Choose files or drop them here</strong>
            <small>PDF, Word, Excel, text or photos · up to 18 MB each · several at once</small>
          </button>
          <input ref={fileRef} type="file" multiple hidden accept=".pdf,.docx,.xlsx,.txt,image/jpeg,image/png,image/webp" onChange={(e) => addFiles(e.target.files)} />

          {rows.length > 0 && (
            <ul className="bulk__files">
              {rows.map((r, i) => (
                <li key={`${r.file.name}-${i}`}>
                  <div className="bulk__file">
                    <strong>{r.file.name}</strong>
                    <small>{(r.file.size / 1024 / 1024).toFixed(1)} MB</small>
                    {!r.job && !r.error && !running && (
                      <button type="button" className="adm-link" onClick={() => setRows((prev) => prev.filter((_, k) => k !== i))}>
                        Remove
                      </button>
                    )}
                  </div>
                  {r.error && <p className="adm-users__error">{r.error}</p>}
                  {r.job && (
                    <>
                      <p className={`bulk__msg${r.job.stage === 'failed' ? ' is-bad' : ''}`}>
                        {r.job.stage !== 'done' && r.job.stage !== 'failed' && <LoaderCircle size={14} className="adm-spin" aria-hidden />}
                        {r.job.error || r.job.message}
                      </p>
                      {r.job.papers.length > 0 && (
                        <table className="bulk__papers">
                          <thead>
                            <tr>
                              <th>Paper</th>
                              <th>Questions</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.job.papers.map((p) => {
                              const s = STATE[p.state];
                              const Icon = s.icon;
                              return (
                                <tr key={`${p.subject}-${p.year}`} className={`is-${p.state}`}>
                                  <td>
                                    {p.subject} {p.year || '(no year)'}
                                  </td>
                                  <td>
                                    {p.saved || p.found}
                                    {p.expected ? ` / ${p.expected}` : ''}
                                    {p.needsReview ? <small> · {p.needsReview} to check</small> : null}
                                  </td>
                                  <td>
                                    <span className="bulk__state">
                                      <Icon size={15} className={p.state === 'reading' ? 'adm-spin' : ''} aria-hidden /> {s.label}
                                    </span>
                                    {p.note && <small className="bulk__note">{p.note}</small>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="cms-modal__foot">
          {running && <span className="adm-muted bulk__keep">Keep this window open until it finishes.</span>}
          <button type="button" className="adm-btn" onClick={onClose} disabled={running}>
            {finished ? 'Close' : 'Cancel'}
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => void start()} disabled={running || pending === 0}>
            {running ? <LoaderCircle size={16} className="adm-spin" aria-hidden /> : <FileUp size={16} aria-hidden />}
            {running ? 'Reading…' : pending > 1 ? `Upload ${pending} files` : 'Upload'}
          </button>
        </footer>
      </div>
    </div>
  );
};
