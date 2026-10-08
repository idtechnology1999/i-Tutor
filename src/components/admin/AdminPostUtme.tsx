import React, { useState } from 'react';
import { ArrowRight, BookOpenCheck, Landmark, MapPin, ScanText, Search, X } from 'lucide-react';
import { CMS_SUBJECTS, paperSize, useCms } from '../../lib/cms';
import type { CmsSubject } from '../../lib/cms';
import { NIGERIAN_INSTITUTIONS } from '../../data/nigerian-curriculum';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

const TYPES = ['All', 'Federal', 'State', 'Private'] as const;
const THIS_YEAR = new Date().getFullYear();
// Papers from 2000 to last year, newest first.
const YEARS = Array.from({ length: THIS_YEAR - 2000 }, (_, i) => THIS_YEAR - 1 - i);
const SHOW = ['All schools', 'With questions', 'Empty'] as const;

/** Post-UTME is set by each school, so the admin works school by school. */
export const AdminPostUtme: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const { questions } = useCms();
  const [type, setType] = useState<(typeof TYPES)[number]>('All');
  const [show, setShow] = useState<(typeof SHOW)[number]>('All schools');
  const [search, setSearch] = useState('');
  // The school whose “add a paper” form is open, and what's picked in it.
  const [adding, setAdding] = useState<string | null>(null);
  const [subject, setSubject] = useState<CmsSubject>('English');
  const [year, setYear] = useState<number | null>(null);

  const postUtme = questions.filter((q) => q.examType === 'Post-UTME');
  const forSchool = (school: string) => postUtme.filter((q) => q.school === school);
  const covered = NIGERIAN_INSTITUTIONS.filter((i) => forSchool(i.shortName).length > 0).length;

  const term = search.trim().toLowerCase();
  const list = NIGERIAN_INSTITUTIONS.filter((i) => {
    const n = forSchool(i.shortName).length;
    return (
      (type === 'All' || i.type === type) &&
      (show === 'All schools' || (show === 'With questions' ? n > 0 : n === 0)) &&
      (!term || `${i.name} ${i.shortName} ${i.location}`.toLowerCase().includes(term))
    );
  }).sort((a, b) => forSchool(b.shortName).length - forSchool(a.shortName).length || a.name.localeCompare(b.name));

  const startAdding = (school: string) => {
    setAdding(school);
    setSubject('English');
    setYear(null);
  };
  const addPaper = (school: string) => nav.go('import', { preset: { exam: 'Post-UTME', school, subject, year } });
  const openBank = (school: string) =>
    nav.go('questions', {
      scope: { exam: 'Post-UTME', school, subject: 'All', year: null },
    });

  return (
    <div className="adm-page">
      <PageHead
        title="Post-UTME"
        sub="Every school sets its own Post-UTME. Pick a school to add its past papers or edit the questions students see."
      />

      <div className="adm-stats adm-pu__stats">
        <div className="adm-stat">
          <span className="adm-muted">Schools with questions</span>
          <strong>
            {covered} <small className="adm-muted">of {NIGERIAN_INSTITUTIONS.length}</small>
          </strong>
        </div>
        <div className="adm-stat">
          <span className="adm-muted">Post-UTME questions</span>
          <strong>{postUtme.length}</strong>
        </div>
        <div className="adm-stat">
          <span className="adm-muted">Published</span>
          <strong>{postUtme.filter((q) => q.status === 'published').length}</strong>
        </div>
      </div>

      <label className="adm-input adm-input--icon adm-search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schools, e.g. UNILAG or Ibadan"
          aria-label="Search schools"
        />
      </label>

      <div className="adm-pu__filters">
        <div className="adm-tabs" role="tablist" aria-label="School type">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              className={type === t ? 'is-on' : ''}
              onClick={() => setType(t)}
            >
              {t === 'All' ? 'All types' : t}
            </button>
          ))}
        </div>
        <select
          className="adm-input adm-pu__show"
          value={show}
          onChange={(e) => setShow(e.target.value as (typeof SHOW)[number])}
          aria-label="Show"
        >
          {SHOW.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {list.length === 0 && (
        <div className="adm-empty">
          <h3>No school matches</h3>
          <p>Try another name or filter.</p>
        </div>
      )}

      <ul className="adm-pu">
        {list.map((i) => {
          const qs = forSchool(i.shortName);
          const live = qs.filter((q) => q.status === 'published').length;
          const subjects = [...new Set(qs.map((q) => q.subject))].sort();
          return (
            <li key={i.id} className="adm-card adm-pu__school">
              <div className="adm-pu__top">
                <span className="adm-facset__icon">
                  <Landmark size={18} aria-hidden />
                </span>
                <div className="adm-pu__name">
                  <strong>
                    {i.name} ({i.shortName})
                  </strong>
                  <small className="adm-muted">
                    <MapPin size={12} aria-hidden /> {i.location} · {i.type}
                  </small>
                </div>
                {qs.length > 0 ? (
                  <span className="adm-chip is-live">{live} live</span>
                ) : (
                  <span className="adm-chip is-draft">No papers</span>
                )}
              </div>

              {subjects.length > 0 ? (
                <ul className="adm-pu__papers">
                  {subjects.map((s) => {
                    const inSubject = qs.filter((q) => q.subject === s);
                    const years = [
                      ...new Set(inSubject.map((q) => q.year).filter((y): y is number => y !== null)),
                    ].sort((a, b) => b - a);
                    return (
                      <li key={s}>
                        <strong>{s}</strong>
                        <span className="adm-muted">{years.length ? years.join(', ') : 'No year'}</span>
                        <b>{inSubject.length}</b>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="adm-muted adm-pu__none">No {i.shortName} Post-UTME papers yet.</p>
              )}

              {adding === i.shortName ? (
                <div className="adm-pu__add">
                  <div className="adm-pu__add-row">
                    <label className="adm-field">
                      <small className="adm-muted">Subject</small>
                      <select
                        className="adm-input"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value as CmsSubject)}
                      >
                        {CMS_SUBJECTS.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="adm-field">
                      <small className="adm-muted">Year</small>
                      <select
                        className="adm-input"
                        value={year ?? ''}
                        onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Choose year</option>
                        {YEARS.map((y) => {
                          const taken = paperSize(questions, subject, 'Post-UTME', y, i.shortName) > 0;
                          return (
                            <option key={y} value={y} disabled={taken}>
                              {y}
                              {taken ? ' — already added' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>
                  <div className="adm-pu__actions">
                    <button
                      type="button"
                      className="adm-btn adm-btn--primary"
                      disabled={year === null}
                      onClick={() => addPaper(i.shortName)}
                    >
                      Continue <ArrowRight size={16} aria-hidden />
                    </button>
                    <button type="button" className="adm-btn" onClick={() => setAdding(null)}>
                      <X size={16} aria-hidden /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="adm-pu__actions">
                  <button type="button" className="adm-btn adm-btn--primary" onClick={() => startAdding(i.shortName)}>
                    <ScanText size={16} aria-hidden /> Add {i.shortName} paper
                  </button>
                  {qs.length > 0 && (
                    <button type="button" className="adm-btn" onClick={() => openBank(i.shortName)}>
                      <BookOpenCheck size={16} aria-hidden /> Edit questions
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
