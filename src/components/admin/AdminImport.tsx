import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CircleAlert,
  ClipboardPaste,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  ScanText,
  Upload,
  X,
} from 'lucide-react';
import { CMS_SUBJECTS, EXAM_TYPES, cms } from '../../lib/cms';
import type { CmsSubject, ExamType, QuestionDraft } from '../../lib/cms';
import { organiseWithAI } from '../../lib/question-import';
import type { ImportResult, ParsedQuestion } from '../../lib/question-import';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';
import { publishProblems } from '../../lib/question-rules';

const SAMPLE = `JAMB UTME 2019 PHYSICS (extract)

1. A car accelerates uniformly from rest and covers 100 m in 10 s. What is its acceleration?
A. 1.0 m/s²   B. 2.0 m/s²   C. 5.0 m/s²   D. 10.0 m/s²

2. Which of the following is a scalar quantity?
A. Velocity
B. Force
C. Speed
D. Momentum

3. The SI unit of power is
(A) Joule (B) Watt (C) Newton (D) Pascal

4. A body of mass 2 kg moving at 3 m/s has kinetic energy of
A. 3 J
B. 6 J
C. 9 J
D. 18 J

Answers
1. B   2. C   3. B   4. C`;

const STEPS = ['Reading the paper', 'Finding questions and options', 'Matching answers', 'Writing explanations'];

type Stage = 'setup' | 'working' | 'review' | 'done';

interface ReviewItem extends ParsedQuestion {
  key: number;
  include: boolean;
}

export const AdminImport: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const [stage, setStage] = useState<Stage>('setup');
  const [subject, setSubject] = useState<CmsSubject>('Physics');
  const [examType, setExamType] = useState<ExamType>('UTME');
  const [year, setYear] = useState('');
  const [source, setSource] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [openKey, setOpenKey] = useState<number | null>(null);
  const [summary, setSummary] = useState({ published: 0, drafts: 0 });
  const fileInput = useRef<HTMLInputElement>(null);

  // Walk through the progress steps while the import runs.
  useEffect(() => {
    if (stage !== 'working') return;
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900);
    return () => window.clearInterval(id);
  }, [stage]);

  const acceptFile = async (f: File) => {
    setError('');
    if (f.type === 'text/plain' || f.name.toLowerCase().endsWith('.txt')) {
      setText(await f.text());
      setFile(null);
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Use a PDF, a photo (JPG, PNG, WebP) or a .txt file.');
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setError('That file is over 4 MB. Split the paper into smaller parts.');
      return;
    }
    setFile(f);
  };

  const run = async () => {
    if (!text.trim() && !file) {
      setError('Paste the paper or attach a file first.');
      return;
    }
    setError('');
    setStep(0);
    setStage('working');
    const started = Date.now();
    try {
      const res = await organiseWithAI({
        subject,
        examType,
        year: year ? Number(year) : null,
        source,
        text,
        file,
      });
      // Let the progress animation read as real work, not a flicker.
      await new Promise((r) => window.setTimeout(r, Math.max(0, 2400 - (Date.now() - started))));
      setResult(res);
      setItems(
        res.questions.map((q, i) => ({
          ...q,
          key: i,
          year: q.year || (year ? Number(year) : 0),
          include: true,
        })),
      );
      setStage('review');
    } catch (e) {
      setError((e as Error).message);
      setStage('setup');
    }
  };

  const update = (key: number, patch: Partial<ReviewItem>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  const chosen = items.filter((i) => i.include);
  const ready = chosen.filter((i) => publishProblems(i).length === 0 && i.answerSource !== 'ai');

  const toDraft = (it: ReviewItem, publish: boolean): QuestionDraft => ({
    subject,
    examType,
    year: it.year || null,
    topic: it.topic,
    question: it.question.trim(),
    options: it.options.filter((o) => o.text.trim()),
    correctAnswer: it.correctAnswer,
    explanation: it.explanation,
    answerSource: it.answerSource,
    source: source || `${examType}${it.year ? ` ${it.year}` : ''} ${subject}`,
    status: publish ? 'published' : 'draft',
    needsReview: !publish && (it.needsReview || it.answerSource === 'ai' || publishProblems(it).length > 0),
    reviewNote: it.reviewNote,
  });

  const save = (publishReady: boolean) => {
    const readyKeys = new Set(ready.map((r) => r.key));
    const drafts = chosen.map((it) => toDraft(it, publishReady && readyKeys.has(it.key)));
    const published = drafts.filter((d) => d.status === 'published').length;
    cms.addQuestions(
      drafts,
      `Imported ${drafts.length} ${subject} question${drafts.length === 1 ? '' : 's'}${published ? ` (${published} published)` : ''}.`,
    );
    setSummary({ published, drafts: drafts.length - published });
    setStage('done');
  };

  const reset = () => {
    setStage('setup');
    setText('');
    setFile(null);
    setResult(null);
    setItems([]);
    setError('');
  };

  /* ------------------------------------------------------------- Working */
  if (stage === 'working') {
    return (
      <div className="adm-page">
        <div className="adm-working" role="status" aria-live="polite">
          <span className="adm-working__icon">
            <ScanText size={28} aria-hidden />
          </span>
          <h2>Organising your paper…</h2>
          <p>This usually takes under a minute.</p>
          <ol className="adm-steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i < step ? 'is-done' : i === step ? 'is-now' : ''}>
                <span>
                  {i < step ? <Check size={14} aria-hidden /> : i === step ? <LoaderCircle size={14} className="adm-spin" aria-hidden /> : null}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- Done */
  if (stage === 'done') {
    return (
      <div className="adm-page">
        <div className="adm-working">
          <span className="adm-working__icon is-ok">
            <Check size={30} aria-hidden />
          </span>
          <h2>Questions added</h2>
          <p>
            {summary.published > 0 && <>{summary.published} published and live for students. </>}
            {summary.drafts > 0 && <>{summary.drafts} saved as drafts for you to check.</>}
          </p>
          <div className="adm-row-actions">
            <button type="button" className="adm-btn adm-btn--primary" onClick={() => nav.go('questions', { filter: summary.drafts ? 'review' : 'all' })}>
              {summary.drafts ? 'Review drafts' : 'View questions'}
            </button>
            <button type="button" className="adm-btn" onClick={reset}>
              Import another paper
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- Review */
  if (stage === 'review' && result) {
    const flagged = items.filter((i) => i.needsReview || i.answerSource === 'ai' || publishProblems(i).length > 0).length;
    return (
      <div className="adm-page">
        <PageHead
          title={`We found ${items.length} question${items.length === 1 ? '' : 's'}`}
          sub={`${subject} · ${examType}${year ? ` ${year}` : ''} — check them, untick any you don’t want, then save.`}
          actions={
            <button type="button" className="adm-btn" onClick={() => setStage('setup')}>
              <ArrowLeft size={16} aria-hidden /> Back
            </button>
          }
        />

        {result.engine === 'basic' && (
          <div className="adm-banner">
            <strong>Read by the built-in reader.</strong> {result.fallbackReason} It copies questions as written and can’t
            work out missing answers or explanations — the AI will once it’s connected.
          </div>
        )}
        {result.warnings.length > 0 && (
          <ul className="adm-warnings">
            {result.warnings.map((w) => (
              <li key={w}>
                <CircleAlert size={16} aria-hidden /> {w}
              </li>
            ))}
          </ul>
        )}

        <div className="adm-review-bar">
          <span>
            <strong>{chosen.length}</strong> selected · <strong>{ready.length}</strong> ready to publish
            {flagged > 0 && (
              <>
                {' '}
                · <span className="adm-text-warn">{flagged} to check</span>
              </>
            )}
          </span>
          <button
            type="button"
            className="adm-link"
            onClick={() => {
              const all = items.every((i) => i.include);
              setItems((prev) => prev.map((i) => ({ ...i, include: !all })));
            }}
          >
            {items.every((i) => i.include) ? 'Untick all' : 'Tick all'}
          </button>
        </div>

        <ol className="adm-review">
          {items.map((it) => {
            const issues = publishProblems(it);
            const open = openKey === it.key;
            return (
              <li key={it.key} className={`adm-rq${it.include ? '' : ' is-off'}`}>
                <div className="adm-rq__top">
                  <label className="adm-check">
                    <input
                      type="checkbox"
                      checked={it.include}
                      onChange={(e) => update(it.key, { include: e.target.checked })}
                      aria-label={`Include question ${it.number || it.key + 1}`}
                    />
                  </label>
                  <span className="adm-rq__num">{it.number || it.key + 1}</span>
                  <textarea
                    className="adm-rq__q"
                    rows={2}
                    value={it.question}
                    onChange={(e) => update(it.key, { question: e.target.value })}
                    aria-label="Question text"
                  />
                </div>

                <div className="adm-rq__opts">
                  {it.options.map((o, oi) => (
                    <div key={o.label} className={`adm-option adm-option--sm${it.correctAnswer === o.label ? ' is-correct' : ''}`}>
                      <button
                        type="button"
                        className="adm-option__key"
                        onClick={() => update(it.key, { correctAnswer: o.label, answerSource: it.answerSource === 'ai' ? 'paper' : it.answerSource })}
                        aria-label={`Mark ${o.label} as correct`}
                        aria-pressed={it.correctAnswer === o.label}
                      >
                        {o.label}
                      </button>
                      <input
                        className="adm-option__input"
                        value={o.text}
                        onChange={(e) =>
                          update(it.key, {
                            options: it.options.map((x, xi) => (xi === oi ? { ...x, text: e.target.value } : x)),
                          })
                        }
                        aria-label={`Option ${o.label}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="adm-rq__foot">
                  {it.answerSource === 'ai' && it.correctAnswer ? (
                    <span className="adm-chip is-review">AI-suggested answer — tap the right option to confirm</span>
                  ) : issues.length ? (
                    <span className="adm-chip is-review">{issues[0]}</span>
                  ) : (
                    <span className="adm-chip is-live">
                      <Check size={12} aria-hidden /> Ready
                    </span>
                  )}
                  {it.reviewNote && !issues.length && it.answerSource !== 'ai' && <span className="adm-muted">{it.reviewNote}</span>}
                  <button type="button" className="adm-link" onClick={() => setOpenKey(open ? null : it.key)}>
                    {open ? 'Hide details' : 'Topic & explanation'}
                  </button>
                </div>

                {open && (
                  <div className="adm-rq__more">
                    <label className="adm-field">
                      <span>Topic</span>
                      <input className="adm-input" value={it.topic} onChange={(e) => update(it.key, { topic: e.target.value })} />
                    </label>
                    <label className="adm-field">
                      <span>Explanation</span>
                      <textarea
                        className="adm-input adm-textarea"
                        rows={3}
                        value={it.explanation}
                        onChange={(e) => update(it.key, { explanation: e.target.value })}
                        placeholder="How to get the answer, in 2–4 short sentences"
                      />
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <div className="adm-save-bar">
          <button type="button" className="adm-btn" onClick={() => save(false)} disabled={!chosen.length}>
            Save all as drafts
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => save(true)} disabled={!chosen.length}>
            Publish {ready.length} ready{chosen.length > ready.length ? `, draft ${chosen.length - ready.length}` : ''}
          </button>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------- Setup */
  return (
    <div className="adm-page">
      <PageHead
        title="Import with AI"
        sub="Paste a past-question paper or upload it. The AI sorts it into questions, options, answers and explanations for you to check."
      />

      <div className="adm-import">
        <section className="adm-card">
          <h2 className="adm-card__title">
            <span className="adm-num">1</span> About this paper
          </h2>
          <div className="adm-field">
            <span>Subject</span>
            <div className="adm-pills" role="radiogroup" aria-label="Subject">
              {CMS_SUBJECTS.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={subject === s} className={subject === s ? 'is-on' : ''} onClick={() => setSubject(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="adm-field">
            <span>Exam</span>
            <div className="adm-seg" role="radiogroup" aria-label="Exam">
              {EXAM_TYPES.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={examType === t} className={examType === t ? 'is-on' : ''} onClick={() => setExamType(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="adm-grid-2">
            <label className="adm-field">
              <span>Year</span>
              <input className="adm-input" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="e.g. 2019" />
            </label>
            <label className="adm-field">
              <span>Source (optional)</span>
              <input className="adm-input" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. JAMB official past questions book" />
            </label>
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-card__title">
              <span className="adm-num">2</span> Paste or upload the paper
            </h2>
            <button type="button" className="adm-link" onClick={() => { setText(SAMPLE); setFile(null); setSubject('Physics'); setExamType('UTME'); setYear('2019'); }}>
              <ClipboardPaste size={16} aria-hidden /> Try a sample paper
            </button>
          </div>

          <textarea
            className="adm-input adm-textarea adm-paste"
            rows={11}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Paste the questions here exactly as you copied them — messy is fine.\n\n1. Which of the following…\nA. …  B. …  C. …  D. …\n\nAnswers: 1. B  2. D …'}
            aria-label="Paper text"
          />

          <div
            className={`adm-drop${dragging ? ' is-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) void acceptFile(f);
            }}
          >
            {file ? (
              <div className="adm-file">
                {file.type === 'application/pdf' ? <FileText size={20} aria-hidden /> : <ImageIcon size={20} aria-hidden />}
                <span>
                  <strong>{file.name}</strong>
                  <small>{(file.size / 1024).toFixed(0)} KB</small>
                </span>
                <button type="button" className="adm-icon-btn" onClick={() => setFile(null)} aria-label="Remove file">
                  <X size={16} aria-hidden />
                </button>
              </div>
            ) : (
              <button type="button" className="adm-drop__btn" onClick={() => fileInput.current?.click()}>
                <Upload size={20} aria-hidden />
                <span>
                  <strong>Or upload a file</strong>
                  <small>PDF, photo of the pages (JPG, PNG) or .txt · drag it here</small>
                </span>
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.txt,image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void acceptFile(f);
                e.target.value = '';
              }}
            />
          </div>

          {error && <p className="adm-error">{error}</p>}

          <button type="button" className="adm-btn adm-btn--primary adm-btn--lg adm-btn--block" onClick={run}>
            <ScanText size={20} aria-hidden /> Organise with AI
          </button>
          <p className="adm-muted adm-center">Nothing is published until you review it.</p>
        </section>
      </div>
    </div>
  );
};
