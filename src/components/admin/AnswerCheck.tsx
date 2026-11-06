import React, { useEffect, useState } from 'react';
import { LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { CMS_SUBJECTS, syncQuestions } from '../../lib/cms';
import { liveExams } from '../../lib/exams';
import { PAPER_YEARS } from '../../lib/years';
import { api, isLive } from '../../services/api';
import type { AdminNav } from './AdminApp';

/* Admin → Past questions → Check answers. Runs on the server (backend
   ai/answer-check.ts): each answer is solved again, blind, by a second AI.
   Agree → confirmed. Disagree → flagged for an admin (and taken off the site
   if it was published). Blank answers are worked out and confirmed the same
   way. Nothing is published by it. */

interface AnswerJob {
  id: string;
  stage: 'running' | 'done' | 'failed';
  message: string;
  total: number;
  done: number;
  agreed: number;
  filled: number;
  flagged: number;
  unpublished: number;
  skipped: number;
  failed: number;
  error: string;
}

const MODES = [
  { id: 'both', label: 'Check answers and fill blanks' },
  { id: 'check', label: 'Only check existing answers' },
  { id: 'fill', label: 'Only fill blank answers' },
] as const;

export const AnswerCheck: React.FC<{ nav: AdminNav; defaultExam: string; onClose: () => void }> = ({ nav, defaultExam, onClose }) => {
  const exams = liveExams();
  const [exam, setExam] = useState(exams.some((e) => e.id === defaultExam) ? defaultExam : (exams[0]?.id ?? 'UTME'));
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('both');
  const [redo, setRedo] = useState(false);
  const [job, setJob] = useState<AnswerJob | null>(null);
  const [error, setError] = useState('');
  const running = job?.stage === 'running';

  // A check already running (started earlier, or by another admin): follow it.
  useEffect(() => {
    if (!isLive) return;
    void api<AnswerJob | null>('/api/admin/answer-check/current')
      .then((j) => j && setJob(j))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!job || job.stage !== 'running') return;
    const t = window.setTimeout(() => {
      api<AnswerJob>(`/api/admin/answer-check/${job.id}`)
        .then((j) => {
          setJob(j);
          if (j.stage !== 'running') {
            void syncQuestions('admin').catch(() => undefined);
            nav.notify(j.stage === 'done' ? 'Answer check finished.' : 'The answer check stopped.');
          }
        })
        .catch(() => setJob({ ...job }));
    }, 3000);
    return () => window.clearTimeout(t);
  }, [job, nav]);

  const start = async () => {
    setError('');
    try {
      const j = await api<AnswerJob>('/api/admin/answer-check', {
        method: 'POST',
        body: { exam, subject, year: year ? Number(year) : null, mode, redo },
      });
      setJob(j);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const pct = job && job.total ? Math.round((job.done / job.total) * 100) : 0;

  return (
    <div className="cms-modal" onClick={onClose}>
      <div className="cms-modal__panel cms-modal__panel--narrow" role="dialog" aria-modal="true" aria-labelledby="ac-title" onClick={(e) => e.stopPropagation()}>
        <header className="cms-modal__head">
          <h2 id="ac-title">
            <ShieldCheck size={20} aria-hidden /> Check answers
          </h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="cms-modal__body cms-newpage">
          <p className="adm-muted">
            A second AI solves every question again <b>without being told the answer</b>. When both agree, the answer is confirmed. When they
            don’t, the question is flagged “Check this one” for you, and taken off the site if it was published. Blank answers are worked out and
            confirmed the same way. Nothing is published automatically. It runs on the server, so you can close this window.
          </p>
          {!isLive && <p className="adm-note">This needs the live site.</p>}

          {!running && (
            <>
              <label className="adm-field">
                <span>Exam</span>
                <select className="adm-input" value={exam} onChange={(e) => setExam(e.target.value)}>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adm-field">
                <span>Subject</span>
                <select className="adm-input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">All subjects</option>
                  {CMS_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adm-field">
                <span>Year</span>
                <select className="adm-input" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">All years</option>
                  {PAPER_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adm-field">
                <span>What to do</span>
                <select className="adm-input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
                  {MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="adm-check">
                <input type="checkbox" checked={redo} onChange={(e) => setRedo(e.target.checked)} />
                <span>Also re-check answers already confirmed</span>
              </label>
            </>
          )}

          {job && (
            <div className="ac-progress" role="status">
              <p>
                {running && <LoaderCircle size={15} className="adm-spin" aria-hidden />} {job.error || job.message}
              </p>
              {job.total > 0 && (
                <>
                  <div className="adm-bars__track" aria-hidden>
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <p className="adm-muted">
                    {job.done} of {job.total} · {job.agreed} confirmed · {job.filled} filled · {job.flagged} flagged
                    {job.unpublished ? ` · ${job.unpublished} taken off the site` : ''}
                    {job.failed ? ` · ${job.failed} not reached` : ''}
                    {job.skipped ? ` · ${job.skipped} already confirmed earlier` : ''}
                  </p>
                </>
              )}
            </div>
          )}
          {error && <p className="adm-error">{error}</p>}
        </div>
        <footer className="cms-modal__foot">
          {job && !running && job.flagged > 0 && (
            <button
              type="button"
              className="adm-btn"
              onClick={() => {
                onClose();
                nav.go('questions', { filter: 'review' });
              }}
            >
              See flagged questions
            </button>
          )}
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => void start()} disabled={!isLive || running}>
            {running ? 'Checking…' : job ? 'Run again' : 'Start check'}
          </button>
        </footer>
      </div>
    </div>
  );
};
