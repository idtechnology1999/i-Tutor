import React, { useRef, useState } from 'react';
import { Camera, LoaderCircle, Trash2 } from 'lucide-react';
import type { UserProfile } from '../../types';
import { uploadPhoto } from '../../services/reviews';
import { StudentAvatar } from './StudentAvatar';

/* Setup (and profile): the student's photo and gender, both optional. They
   show on reviews the student sends: their photo, or a female or male avatar,
   or a plain person icon when neither is given. */

const GENDERS: Array<{ value: 'female' | 'male' | ''; label: string }> = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: '', label: 'Prefer not to say' },
];

interface Props {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const AboutYouCard: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      onUpdateProfile({ photo: await uploadPhoto(file) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="about-you" aria-labelledby="about-you-title">
      <div className="about-you__photo">
        <StudentAvatar photo={profile.photo} gender={profile.gender} name={profile.fullName} size={76} />
        <div className="about-you__photo-actions">
          <button type="button" className="ui-btn ui-btn--ghost about-you__btn" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <LoaderCircle size={16} className="adm-spin" aria-hidden /> : <Camera size={16} aria-hidden />}
            {profile.photo ? 'Change photo' : 'Add a photo'}
          </button>
          {profile.photo && !busy && (
            <button type="button" className="about-you__remove" onClick={() => onUpdateProfile({ photo: '' })}>
              <Trash2 size={14} aria-hidden /> Remove
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void pick(f);
            }}
          />
        </div>
      </div>
      <div className="about-you__text">
        <h3 id="about-you-title">About you</h3>
        <p>Optional. Your photo shows next to any review you write about i-Tutor.</p>
        <div className="about-you__gender" role="radiogroup" aria-label="Gender">
          {GENDERS.map((g) => (
            <button
              key={g.label}
              type="button"
              role="radio"
              aria-checked={(profile.gender ?? '') === g.value}
              className={(profile.gender ?? '') === g.value ? 'is-on' : ''}
              onClick={() => onUpdateProfile({ gender: g.value })}
            >
              {g.label}
            </button>
          ))}
        </div>
        {error && <p className="about-you__error">{error}</p>}
      </div>
    </section>
  );
};
