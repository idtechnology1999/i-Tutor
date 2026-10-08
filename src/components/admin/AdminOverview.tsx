import React from 'react';
import { ArrowRight, BookOpenCheck, CircleAlert, FilePlus2, Newspaper, ScanText, Shapes } from 'lucide-react';
import { CMS_SUBJECTS, EXAM_FULL_NAME, EXAM_LABEL, EXAM_TYPES, useCms } from '../../lib/cms';
import type { AdminNav } from './AdminApp';
import { PageHead, StatusChip } from './AdminApp';

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const AdminOverview: React.FC<{ nav: AdminNav; mode: 'live' | 'demo' }> = ({ nav, mode }) => {
  const { questions, news, activity } = useCms();
  const published = questions.filter((q) => q.status === 'published');
  const toReview = questions.filter((q) => q.needsReview || q.status === 'draft');
  const subjectsCovered = new Set(published.map((q) => q.subject)).size;
  const maxPerExam = Math.max(1, ...EXAM_TYPES.map((t) => questions.filter((q) => q.examType === t).length));

  const stats = [
    { label: 'Published questions', value: published.length, icon: BookOpenCheck, tone: 'brand' },
    { label: 'Waiting for review', value: toReview.length, icon: CircleAlert, tone: toReview.length ? 'warn' : 'ok' },
    { label: 'Subjects covered', value: `${subjectsCovered}/${CMS_SUBJECTS.length}`, icon: Shapes, tone: 'brand' },
    { label: 'News posts', value: news.filter((n) => n.status === 'published').length, icon: Newspaper, tone: 'brand' },
  ];

  return (
    <div className="adm-page">
      <PageHead
        title="Overview"
        sub="What’s on the site and what needs your attention."
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => nav.go('import')}>
            <ScanText size={18} aria-hidden /> Import a paper
          </button>
        }
      />

      {mode === 'demo' && (
        <div className="adm-banner">
          <strong>Demo mode.</strong> The AI backend isn’t connected yet, so imports use the built-in question
          reader. Everything you publish is saved in this browser.
        </div>
      )}

      <div className="adm-stats">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`adm-stat is-${tone}`}>
            <span className="adm-stat__icon">
              <Icon size={20} aria-hidden />
            </span>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="adm-cols">
        <section className="adm-card">
          <div className="adm-card__head">
            <h2>Questions by exam</h2>
            <button type="button" className="adm-link" onClick={() => nav.go('questions', { filter: 'all' })}>
              Open bank <ArrowRight size={14} aria-hidden />
            </button>
          </div>
          <ul className="adm-bars">
            {EXAM_TYPES.map((t) => {
              const all = questions.filter((q) => q.examType === t).length;
              const live = questions.filter((q) => q.examType === t && q.status === 'published').length;
              return (
                <li key={t}>
                  <span className="adm-bars__name" title={EXAM_FULL_NAME[t]}>
                    {EXAM_LABEL[t]}
                  </span>
                  <span className="adm-bars__track" aria-hidden>
                    <i style={{ width: `${(all / maxPerExam) * 100}%` }} className="is-all" />
                    <i style={{ width: `${(live / maxPerExam) * 100}%` }} />
                  </span>
                  <span className="adm-bars__num">
                    {live}
                    {all > live && <small> +{all - live}</small>}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="adm-muted adm-legend">
            <i /> Published <i className="is-all" /> Draft or in review
          </p>
        </section>

        <section className="adm-card">
          <div className="adm-card__head">
            <h2>Needs your review</h2>
            {toReview.length > 0 && (
              <button type="button" className="adm-link" onClick={() => nav.go('questions', { filter: 'review' })}>
                See all {toReview.length} <ArrowRight size={14} aria-hidden />
              </button>
            )}
          </div>
          {toReview.length === 0 ? (
            <div className="adm-empty adm-empty--small">
              <p>Nothing waiting. Import a paper to add more questions.</p>
              <button type="button" className="adm-btn" onClick={() => nav.go('import')}>
                <FilePlus2 size={16} aria-hidden /> Import a paper
              </button>
            </div>
          ) : (
            <ul className="adm-mini-list">
              {toReview.slice(0, 5).map((q) => (
                <li key={q.id}>
                  <button type="button" onClick={() => nav.go('questions', { filter: 'review' })}>
                    <span className="adm-mini-list__text">{q.question}</span>
                    <span className="adm-mini-list__meta">
                      {EXAM_LABEL[q.examType]} · {q.subject}
                      {q.year ? ` ${q.year}` : ''}
                    </span>
                    <StatusChip status={q.status} review={q.needsReview} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="adm-card">
        <div className="adm-card__head">
          <h2>Recent activity</h2>
        </div>
        <ol className="adm-activity">
          {activity.slice(0, 8).map((a, i) => (
            <li key={`${a.at}-${i}`}>
              <span className="adm-activity__dot" aria-hidden />
              <span>{a.text}</span>
              <time dateTime={a.at}>{timeAgo(a.at)}</time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
