import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, Trash2, UserRound, X } from 'lucide-react';
import { deleteTeamMember, listTeam, saveTeamMember } from '../../services/admin';
import type { TeamInput, TeamMember } from '../../services/admin';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

/* Team: the people shown in "Meet the team" on the website. Photos are
   cropped to a square and shrunk to 400×400 in the browser before upload. */

const PHOTO_SIZE = 400;

/** Centre-crops an image file to a square JPEG data URL. */
function squarePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = PHOTO_SIZE;
      canvas.height = PHOTO_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Your browser can’t resize photos.'));
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        PHOTO_SIZE,
        PHOTO_SIZE,
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file isn’t a photo we can read. Try a JPEG or PNG.'));
    };
    img.src = url;
  });
}

const MemberEditor: React.FC<{
  initial: TeamMember | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (m: TeamMember) => void;
  onDeleted: (id: string) => void;
}> = ({ initial, nextOrder, onClose, onSaved, onDeleted }) => {
  const [form, setForm] = useState<TeamInput>(
    initial ? { fullName: initial.fullName, role: initial.role, image: initial.image, order: initial.order } : { fullName: '', role: '', image: '', order: nextOrder },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const pickPhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose a photo (JPEG, PNG or WebP).');
    setError('');
    squarePhoto(file)
      .then((image) => setForm((f) => ({ ...f, image })))
      .catch((err: Error) => setError(err.message));
  };

  const save = () => {
    if (form.fullName.trim().length < 2) return setError('Enter their full name.');
    if (form.role.trim().length < 2) return setError('Enter their role, e.g. “Head of Mathematics”.');
    setBusy(true);
    setError('');
    saveTeamMember({ ...form, fullName: form.fullName.trim(), role: form.role.trim() }, initial?.id)
      .then(onSaved)
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  const remove = () => {
    if (!initial || !window.confirm(`Remove ${initial.fullName} from the team?`)) return;
    setBusy(true);
    deleteTeamMember(initial.id)
      .then(() => onDeleted(initial.id))
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="adm-drawer" onClick={onClose}>
      <aside className="adm-drawer__panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Team member">
        <header className="adm-drawer__head">
          <h2>{initial ? 'Edit team member' : 'Add team member'}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="adm-drawer__body">
          <div className="adm-field">
            <span>Photo</span>
            <div className="adm-team__photo-pick">
              <button
                type="button"
                className="adm-team__photo"
                onClick={() => fileRef.current?.click()}
                aria-label={form.image ? 'Change photo' : 'Upload a photo'}
              >
                {form.image ? <img src={form.image} alt="" /> : <UserRound size={40} aria-hidden />}
              </button>
              <div>
                <button type="button" className="adm-btn" onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={18} aria-hidden /> {form.image ? 'Change photo' : 'Upload photo'}
                </button>
                {form.image && (
                  <button type="button" className="adm-link" onClick={() => setForm((f) => ({ ...f, image: '' }))}>
                    Remove photo
                  </button>
                )}
                <p className="adm-muted">A clear head-and-shoulders photo works best. We crop it to a square.</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  pickPhoto(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          <label className="adm-field">
            <span>Full name</span>
            <input
              className="adm-input"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="e.g. Amina Chinedu"
              autoFocus
            />
          </label>
          <label className="adm-field">
            <span>Role</span>
            <input
              className="adm-input"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Founder, Head of Mathematics, Physics tutor"
            />
          </label>
          <label className="adm-field">
            <span>Position on the website</span>
            <input
              className="adm-input"
              type="number"
              min={0}
              max={1000}
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: Math.max(0, Number(e.target.value) || 0) }))}
            />
            <small className="adm-muted">Lower numbers show first.</small>
          </label>
          {error && <p className="adm-users__error">{error}</p>}
        </div>
        <footer className="adm-drawer__foot">
          {initial && (
            <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={remove} disabled={busy}>
              <Trash2 size={18} aria-hidden /> Remove
            </button>
          )}
          <span className="adm-spacer" />
          <button type="button" className="adm-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Add to team'}
          </button>
        </footer>
      </aside>
    </div>
  );
};

export const AdminTeam: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<TeamMember | 'new' | null>(null);

  useEffect(() => {
    listTeam()
      .then(setTeam)
      .catch((err: Error) => setError(err.message));
  }, []);

  const sorted = [...(team ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="adm-page">
      <PageHead
        title="Team"
        sub="The people shown in “Meet the team” on the website."
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>
            <Plus size={18} aria-hidden /> Add member
          </button>
        }
      />

      {error && <p className="adm-users__error">{error}</p>}

      {team && team.length === 0 ? (
        <div className="adm-empty">
          <h3>No team members yet</h3>
          <p>Add the people behind i-Tutor. The “Meet the team” section appears on the website once you add someone.</p>
        </div>
      ) : (
        <ul className="adm-team">
          {sorted.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setEditing(m)}>
                <span className="adm-team__photo">{m.image ? <img src={m.image} alt="" /> : <UserRound size={34} aria-hidden />}</span>
                <strong>{m.fullName}</strong>
                <span className="adm-muted">{m.role}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <MemberEditor
          initial={editing === 'new' ? null : editing}
          nextOrder={sorted.length ? sorted[sorted.length - 1].order + 1 : 0}
          onClose={() => setEditing(null)}
          onSaved={(m) => {
            setTeam((t) => {
              const list = t ?? [];
              return list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m];
            });
            nav.notify(editing === 'new' ? `${m.fullName} added to the team.` : 'Changes saved.');
            setEditing(null);
          }}
          onDeleted={(id) => {
            setTeam((t) => (t ?? []).filter((x) => x.id !== id));
            nav.notify('Removed from the team.');
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};
