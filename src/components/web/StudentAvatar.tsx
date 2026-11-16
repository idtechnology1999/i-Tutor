import React from 'react';
import { UserRound } from 'lucide-react';
import { mediaSrc } from '../../cms/read';

/* A student's picture on reviews and in setup: their photo; without one, a
   drawn female or male avatar from their gender; without either, a plain
   person icon. */

interface Props {
  photo?: string;
  gender?: 'female' | 'male' | '';
  /** For the photo's alt text. */
  name?: string;
  size?: number;
}

const skin = '#8d5a3b';
const hair = '#1f1410';

/** Drawn avatars: same face, different hair, so neither looks like a stock icon. */
const Female: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <rect width="64" height="64" fill="#fde8d9" />
    {/* hair behind the head, braids to the shoulders */}
    <path d="M14 34c0-14 8-23 18-23s18 9 18 23v14H14z" fill={hair} />
    <rect x="25" y="40" width="14" height="10" fill={skin} />
    <path d="M10 64c2-10 11-15 22-15s20 5 22 15z" fill="#b8520b" />
    <ellipse cx="32" cy="31" rx="11" ry="13" fill={skin} />
    {/* front hair line */}
    <path d="M20 28c2-9 8-13 12-13s10 4 12 13c-4-4-8-6-12-6s-8 2-12 6z" fill={hair} />
    <circle cx="27.5" cy="32" r="1.4" fill={hair} />
    <circle cx="36.5" cy="32" r="1.4" fill={hair} />
    <path d="M28.5 37.5c2 1.6 5 1.6 7 0" stroke={hair} strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </svg>
);

const Male: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <rect width="64" height="64" fill="#dceeea" />
    <rect x="25" y="40" width="14" height="10" fill={skin} />
    <path d="M10 64c2-10 11-15 22-15s20 5 22 15z" fill="#0e3b3a" />
    <ellipse cx="32" cy="31" rx="11" ry="13" fill={skin} />
    {/* short hair */}
    <path d="M21 27c0-8 5-12 11-12s11 4 11 12c-2-3-6-5-11-5s-9 2-11 5z" fill={hair} />
    <ellipse cx="20.6" cy="32" rx="1.8" ry="3" fill={skin} />
    <ellipse cx="43.4" cy="32" rx="1.8" ry="3" fill={skin} />
    <circle cx="27.5" cy="32" r="1.4" fill={hair} />
    <circle cx="36.5" cy="32" r="1.4" fill={hair} />
    <path d="M28.5 37.5c2 1.6 5 1.6 7 0" stroke={hair} strokeWidth="1.4" fill="none" strokeLinecap="round" />
  </svg>
);

export const StudentAvatar: React.FC<Props> = ({ photo, gender, name, size = 48 }) => (
  <span className="student-avatar" style={{ width: size, height: size }}>
    {photo ? (
      <img src={photo.startsWith('data:') ? photo : mediaSrc(photo)} alt={name ? `${name}’s photo` : ''} width={size} height={size} loading="lazy" />
    ) : gender === 'female' ? (
      <Female size={size} />
    ) : gender === 'male' ? (
      <Male size={size} />
    ) : (
      <UserRound size={Math.round(size * 0.55)} aria-hidden />
    )}
  </span>
);
