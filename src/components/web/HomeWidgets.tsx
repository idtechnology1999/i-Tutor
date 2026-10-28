import React, { useEffect, useState } from 'react';
import { BadgeCheck, BookOpenCheck, MessageSquareText, PenLine } from 'lucide-react';
import { publicTeam } from '../../services/team';
import type { TeamMember } from '../../services/admin';
import { NIGERIAN_INSTITUTIONS } from '../../data/nigerian-curriculum';
import { SSCE_CLASSES } from '../../data/courses';
import { Accent } from '../../cms/text';

/* The live parts of the homepage designs, used by the CMS blocks in
   cms/render.tsx: the sample question, the team, and the exam visuals. */

/* "Try it now": one question per stream, so Arts and Commercial students see
   their own subjects too. Only the Physics one is from a real paper; the rest
   are written by i-Tutor and labelled that way. */
const SAMPLES = [
  {
    tab: 'Physics',
    stream: 'Science',
    verified: true,
    meta: 'Physics · UTME 2019 · Q14',
    stem: 'A car accelerates uniformly from rest and covers 100 m in 10 s. What is its acceleration?',
    options: ['1.0 m/s²', '2.0 m/s²', '5.0 m/s²', '10.0 m/s²'],
    answer: 1,
    wrong:
      'Not quite. Which equation links distance, time and acceleration when the car starts from rest? Try writing s = ut + ½at² with u = 0.',
    right:
      'Correct. With u = 0, s = ½at², so 100 = ½ × a × 10², which gives a = 2 m/s². You worked it out — that is the point.',
  },
  {
    tab: 'English',
    stream: 'All students',
    verified: false,
    meta: 'English · Lexis and structure',
    stem: 'Choose the option nearest in meaning to the word in capitals: The chairman’s reply was TERSE.',
    options: ['long and detailed', 'brief and abrupt', 'polite and warm', 'loud and angry'],
    answer: 1,
    wrong: 'Not quite. Picture a terse text message — does it use many words or very few? Now look at the options again.',
    right: 'Correct. Terse means using very few words, often in a way that sounds abrupt. Watch for it in comprehension passages too.',
  },
  {
    tab: 'Economics',
    stream: 'Commercial',
    verified: false,
    meta: 'Economics · Demand and supply',
    stem: 'When the price of a good rises and, other things being equal, the quantity demanded falls, this illustrates the',
    options: ['law of supply', 'law of demand', 'law of diminishing returns', 'equilibrium price'],
    answer: 1,
    wrong: 'Not quite. The question is about buyers reacting to a price change. Which law describes what buyers do?',
    right: 'Correct. The law of demand: as price rises, quantity demanded falls, ceteris paribus (other things being equal).',
  },
  {
    tab: 'Government',
    stream: 'Arts',
    verified: false,
    meta: 'Government · Political theories',
    stem: 'The doctrine of separation of powers is most closely associated with',
    options: ['John Locke', 'Baron de Montesquieu', 'A. V. Dicey', 'Jean-Jacques Rousseau'],
    answer: 1,
    wrong: 'Not quite. Think of the French writer of “The Spirit of the Laws” (1748). Dicey is the name to remember for the rule of law.',
    right: 'Correct. Montesquieu set out separation of powers in “The Spirit of the Laws” (1748): legislature, executive and judiciary kept apart.',
  },
] as const;

export const SampleQuestion: React.FC<{ onOpenTutor: () => void }> = ({ onOpenTutor }) => {
  const [which, setWhich] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const sample = SAMPLES[which]!;
  const isRight = picked === sample.answer;

  return (
    <div className={`lp-sample${picked === null ? '' : isRight ? ' is-solved' : ' is-missed'}`} aria-live="polite">
      <div className="lp-sample__tabs" role="tablist" aria-label="Choose a subject">
        {SAMPLES.map((q, i) => (
          <button
            key={q.tab}
            type="button"
            role="tab"
            aria-selected={i === which}
            className={i === which ? 'is-on' : ''}
            onClick={() => {
              setWhich(i);
              setPicked(null);
            }}
          >
            {q.tab}
            <small>{q.stream}</small>
          </button>
        ))}
      </div>

      <div className="lp-sample__bar">
        {sample.verified ? (
          <span className="lp-badge lp-badge--green">
            <BadgeCheck size={14} aria-hidden />
            Verified Past Question
          </span>
        ) : (
          <span className="lp-badge lp-badge--amber">
            <PenLine size={14} aria-hidden />
            i-Tutor Practice Question
          </span>
        )}
        <span className="lp-sample__meta">{sample.meta}</span>
      </div>

      <p className="lp-sample__stem">{sample.stem}</p>

      <div className="lp-sample__options" role="radiogroup" aria-label="Answer options">
        {sample.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const state = picked === null ? '' : index === picked ? (isRight ? 'is-right' : 'is-wrong') : '';
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={picked === index}
              className={`lp-option ${state}`}
              onClick={() => setPicked(index)}
            >
              <span className="lp-option__key">{letter}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div key={`${which}-${picked}`} className={`lp-sample__nudge ${isRight ? 'is-right' : ''}`}>
          <MessageSquareText size={18} aria-hidden />
          <div>
            <strong>{isRight ? 'Nice work' : 'Tutor hint'}</strong>
            <p>{isRight ? sample.right : sample.wrong}</p>
            {!isRight && (
              <div className="lp-sample__nudge-actions">
                <button type="button" onClick={() => setPicked(null)}>
                  Try again
                </button>
                <button type="button" onClick={onOpenTutor}>
                  Talk it through with the tutor
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* "Meet the team": shown only once the admin has added someone. */
export const TeamSection: React.FC<{ id?: string; kicker: string; title: string; editing?: boolean }> = ({ id, kicker, title, editing }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    publicTeam()
      .then(setTeam)
      .catch(() => setTeam([]));
  }, []);

  if (!team.length && !editing) return null;

  return (
    <section className="lp-section" id={id}>
      <div className="lp-wrap lp-panel lp-panel--mist">
        <span className="lp-deco lp-deco--steps-b" aria-hidden />
        <div className="lp-carve-head">
          {kicker && <p className="lp-kicker">{kicker}</p>}
          <h2 className="lp-h2">
            <Accent text={title} />
          </h2>
        </div>
        {!team.length && <p className="lp-body">No team members yet. Add them in Admin → Team; this section stays hidden until you do.</p>}
        <ul className="lp-team">
          {team.map((m) => (
            <li key={m.id}>
              <span className="lp-team__photo">
                {m.image ? (
                  <img src={m.image} alt={m.fullName} loading="lazy" />
                ) : (
                  <b aria-hidden>
                    {m.fullName
                      .split(' ')
                      .map((w) => w.charAt(0))
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </b>
                )}
              </span>
              <strong>{m.fullName}</strong>
              <small>{m.role}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

/* The pictures beside each exam service. */
export const ServiceVisual: React.FC<{ kind: string }> = ({ kind }) => {
  switch (kind) {
    case 'schools':
      return (
        <div className="lp-svc-card">
          <p className="lp-svc-card__title">Pick your school</p>
          <ul className="lp-svc-schools">
            {NIGERIAN_INSTITUTIONS.slice(0, 5).map((u) => (
              <li key={u.id}>
                <b>{u.shortName}</b>
                <span>
                  {u.name}
                  <small>{u.location}</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="lp-svc-card__more">+ {NIGERIAN_INSTITUTIONS.length - 5} more universities</p>
        </div>
      );
    case 'classes':
      return (
        <div className="lp-svc-classes">
          {SSCE_CLASSES.map((c) => (
            <div key={c.name} className="lp-svc-class">
              <p className="lp-svc-class__name">{c.name}</p>
              <ul>
                {c.subjects
                  .filter((sub) => sub !== 'English' && sub !== 'Mathematics' && sub !== 'Civic Education')
                  .slice(0, 4)
                  .map((sub) => (
                    <li key={sub}>{sub}</li>
                  ))}
              </ul>
            </div>
          ))}
          <p className="lp-svc-classes__note">English and Mathematics for every class</p>
        </div>
      );
    case 'room':
      return (
        <div className="lp-svc-card lp-svc-room">
          <p className="lp-svc-card__title">Your NECO room</p>
          <div className="lp-svc-room__tabs" aria-hidden>
            <span className="is-on">Science</span>
            <span>Arts</span>
            <span>Commercial</span>
          </div>
          <div className="lp-svc-room__windows">
            <div>
              <small>School candidates</small>
              <b>June / July</b>
            </div>
            <div>
              <small>Private candidates</small>
              <b>Nov / Dec</b>
            </div>
          </div>
          <span className="lp-svc-room__start" aria-hidden>
            Start NECO practice
          </span>
        </div>
      );
    case 'steps':
      return (
        <ol className="lp-svc-steps">
          <li>
            <b>1</b>
            <span>
              Pick the subjects to improve
              <small>Only the ones you need</small>
            </span>
          </li>
          <li>
            <b>2</b>
            <span>
              Practise past questions
              <small>Timed, like the real paper</small>
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              Fix what you got wrong
              <small>The tutor walks you through it</small>
            </span>
          </li>
        </ol>
      );
    case 'series':
      return (
        <div className="lp-svc-series">
          <div className="lp-svc-series__item">
            <b>May / June</b>
            <span>series</span>
          </div>
          <div className="lp-svc-series__item lp-svc-series__item--alt">
            <b>Nov / Dec</b>
            <span>series</span>
          </div>
          <div className="lp-svc-series__wide">
            <BookOpenCheck size={20} aria-hidden /> Business and technical subjects, practised your way
          </div>
        </div>
      );
    default:
      return null;
  }
};
