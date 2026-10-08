import React from 'react';
import { BriefcaseBusiness, Check, FlaskConical, Lock, Palette } from 'lucide-react';
import type { SchoolCert } from '../../types';
import { SSCE_CLASSES } from '../../data/courses';
import { CMS_SUBJECTS } from '../../lib/cms';
import { SCHOOL_CERT_CORE, SCHOOL_CERT_MAX, SCHOOL_CERT_MIN } from '../../lib/student-exams';

const CLASS_ICON: Record<string, typeof Check> = {
  Science: FlaskConical,
  Arts: Palette,
  Commercial: BriefcaseBusiness,
};

const CLASS_NOTE: Record<string, string> = {
  Science: 'Physics, Chemistry, Biology…',
  Arts: 'Literature, Government, CRS/IRS…',
  Commercial: 'Economics, Commerce, Accounting…',
};

interface Props {
  value?: SchoolCert;
  onChange: (value: SchoolCert) => void;
}

/** Class (Science / Arts / Commercial), then the 7–9 subjects the student sits. */
export const SchoolCertPicker: React.FC<Props> = ({ value, onChange }) => {
  const subjects = value?.subjects ?? [];
  const count = subjects.length;

  const pickClass = (name: string) => {
    const preset = SSCE_CLASSES.find((c) => c.name === name)?.subjects ?? SCHOOL_CERT_CORE;
    onChange({ className: name, subjects: [...preset] });
  };

  const toggle = (s: string) => {
    if (!value || SCHOOL_CERT_CORE.includes(s)) return;
    const has = subjects.includes(s);
    if (!has && count >= SCHOOL_CERT_MAX) return;
    onChange({ ...value, subjects: has ? subjects.filter((x) => x !== s) : [...subjects, s] });
  };

  return (
    <>
      <div className="sc-classes" role="radiogroup" aria-label="Class">
        {SSCE_CLASSES.map((c) => {
          const Icon = CLASS_ICON[c.name] ?? Check;
          const on = value?.className === c.name;
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={on}
              className={`sc-class${on ? ' is-on' : ''}`}
              onClick={() => pickClass(c.name)}
            >
              <span className="sc-class__icon">
                <Icon size={22} aria-hidden />
              </span>
              <strong>{c.name}</strong>
              <small>{CLASS_NOTE[c.name]}</small>
            </button>
          );
        })}
      </div>

      {value?.className && (
        <section className="sc-subjects" aria-label="Subjects">
          <header>
            <h2>Your subjects</h2>
            <span className={count < SCHOOL_CERT_MIN ? 'is-low' : ''}>
              {count} of {SCHOOL_CERT_MAX}
            </span>
          </header>
          <div className="sc-chips">
            {CMS_SUBJECTS.map((s) => {
              const on = subjects.includes(s);
              const core = SCHOOL_CERT_CORE.includes(s);
              const full = !on && count >= SCHOOL_CERT_MAX;
              return (
                <button
                  key={s}
                  type="button"
                  className={`sc-chip${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  disabled={core || full}
                  onClick={() => toggle(s)}
                >
                  {core ? <Lock size={13} aria-hidden /> : on ? <Check size={14} aria-hidden /> : null}
                  {s}
                </button>
              );
            })}
          </div>
          <p className="sc-note">
            {count < SCHOOL_CERT_MIN
              ? `Add ${SCHOOL_CERT_MIN - count} more — most candidates sit at least ${SCHOOL_CERT_MIN}.`
              : count >= SCHOOL_CERT_MAX
                ? `That’s the most you can sit (${SCHOOL_CERT_MAX}). Remove one to swap it.`
                : (SSCE_CLASSES.find((c) => c.name === value.className)?.note ?? '')}
          </p>
        </section>
      )}

    </>
  );
};
