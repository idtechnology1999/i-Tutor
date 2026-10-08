import React from 'react';
import { Check } from 'lucide-react';
import { TUTORS } from '../../data/tutors';

interface Props {
  selected?: string;
  onSelect: (id: string) => void;
}

/** Premium: pick the personal AI tutor who'll help you from now on. */
export const TutorPicker: React.FC<Props> = ({ selected, onSelect }) => (
  <div className="tutor-pick" role="radiogroup" aria-label="Choose your tutor">
    {TUTORS.map((t) => {
      const on = selected === t.id;
      return (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={on}
          className={`tutor-pick__card${on ? ' is-on' : ''}`}
          onClick={() => onSelect(t.id)}
        >
          <span className={`tutor-avatar tutor-avatar--${t.id}`} aria-hidden>
            {t.name.charAt(0)}
          </span>
          <span className="tutor-pick__text">
            <strong>{t.name}</strong>
            <small>{t.style}</small>
            <span>{t.blurb}</span>
          </span>
          <span className="tutor-pick__tick" aria-hidden>
            {on && <Check size={14} strokeWidth={3} />}
          </span>
        </button>
      );
    })}
    <p className="tutor-pick__note">All three are AI tutors. You can switch any time.</p>
  </div>
);
