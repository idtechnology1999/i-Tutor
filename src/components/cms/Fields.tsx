import React, { useContext, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Copy, ImagePlus, Plus, Trash2 } from 'lucide-react';
import type { FieldSpec } from '../../cms/registry';
import { ICONS, iconFor } from '../../cms/icons';
import { image, items, link, mediaSrc, str } from '../../cms/read';
import type { BlockData } from '../../cms/types';
import { pagePath } from '../../services/pages';
import { MediaPicker } from './MediaLibrary';
import { FieldContext } from './field-context';

/* The sidebar form for a block: one control per field in its definition. */

/** Where a button can go, besides any address typed in. */
const DESTINATIONS: Array<[string, string]> = [
  ['action:cbt', 'Start a mock exam'],
  ['action:tutor', 'Open the AI tutor'],
  ['/register', 'Sign up'],
  ['/login', 'Log in'],
  ['/dashboard', 'Student dashboard'],
  ['/syllabus', 'Past questions'],
  ['/post-utme', 'Post-UTME'],
  ['/upgrade', 'Upgrade to Premium'],
  ['/', 'Homepage'],
];

type Change = (key: string, value: unknown) => void;

export const FieldList: React.FC<{ fields: FieldSpec[]; data: BlockData; onChange: Change }> = ({ fields, data, onChange }) => (
  <>
    {fields
      .filter((f) => !f.show || f.show(data))
      .map((f) => (
        <Field key={f.key} spec={f} value={data[f.key]} onChange={(v) => onChange(f.key, v)} />
      ))}
  </>
);

const Label: React.FC<{ spec: FieldSpec; children: React.ReactNode; as?: 'label' | 'div' }> = ({ spec, children, as = 'label' }) => {
  const Tag = as;
  return (
    <Tag className="adm-field cms-field">
      <span>{spec.label}</span>
      {children}
      {spec.help && <small className="adm-muted">{spec.help}</small>}
    </Tag>
  );
};

const Field: React.FC<{ spec: FieldSpec; value: unknown; onChange: (v: unknown) => void }> = ({ spec, value, onChange }) => {
  switch (spec.kind) {
    case 'text':
      return (
        <Label spec={spec}>
          <input className="adm-input" value={str(value)} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
        </Label>
      );
    case 'textarea':
      return (
        <Label spec={spec}>
          <textarea
            className="adm-input adm-textarea"
            rows={spec.rows ?? 3}
            value={str(value)}
            placeholder={spec.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Label>
      );
    case 'title':
      return (
        <Label spec={{ ...spec, help: spec.help ?? 'Put *stars* around words to colour them. Enter starts a new line.' }}>
          <textarea className="adm-input adm-textarea cms-field__title" rows={2} value={str(value)} onChange={(e) => onChange(e.target.value)} />
        </Label>
      );
    case 'markdown':
      return (
        <Label
          spec={{
            ...spec,
            help: spec.help ?? 'Empty line = new paragraph · **bold** · *italic* · [link text](/page) · “- ” for bullets · “## ” for a subheading',
          }}
        >
          <textarea className="adm-input adm-textarea" rows={8} value={str(value)} onChange={(e) => onChange(e.target.value)} />
        </Label>
      );
    case 'lines': {
      const text = Array.isArray(value) ? value.filter((s) => typeof s === 'string').join('\n') : str(value);
      return (
        <Label spec={{ ...spec, help: spec.help ?? 'One per line.' }}>
          <textarea
            className="adm-input adm-textarea"
            rows={Math.min(8, Math.max(3, text.split('\n').length + 1))}
            value={text}
            // Keep empty lines while typing; the page skips them.
            onChange={(e) => onChange(e.target.value.split('\n'))}
          />
        </Label>
      );
    }
    case 'select':
      return (
        <Label spec={spec}>
          <select className="adm-input" value={str(value, spec.options[0]?.[0])} onChange={(e) => onChange(e.target.value)}>
            {spec.options.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Label>
      );
    case 'toggle':
      return (
        <label className="cms-toggle-row">
          <Switch on={value === true} onChange={onChange} label={spec.label} />
          <span>{spec.label}</span>
          {spec.help && <small className="adm-muted">{spec.help}</small>}
        </label>
      );
    case 'icon':
      return (
        <Label spec={spec}>
          <span className="cms-icon-pick">
            <span className="cms-icon-pick__preview">{React.createElement(iconFor(value), { size: 18, 'aria-hidden': true })}</span>
            <select className="adm-input" value={str(value, 'check')} onChange={(e) => onChange(e.target.value)}>
              {Object.entries(ICONS).map(([k, { label }]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </span>
        </Label>
      );
    case 'image':
      return <ImageField spec={spec} value={value} onChange={onChange} />;
    case 'link':
      return <LinkField spec={spec} value={value} onChange={onChange} />;
    case 'list':
      return <ListField spec={spec} value={value} onChange={onChange} />;
  }
};

/** An on/off switch. */
export const Switch: React.FC<{ on: boolean; onChange: (on: boolean) => void; label: string; small?: boolean }> = ({ on, onChange, label, small }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    title={label}
    className={`cms-switch${on ? ' is-on' : ''}${small ? ' is-small' : ''}`}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!on);
    }}
  >
    <span />
  </button>
);

const ImageField: React.FC<{ spec: FieldSpec; value: unknown; onChange: (v: unknown) => void }> = ({ spec, value, onChange }) => {
  const { notify } = useContext(FieldContext);
  const [open, setOpen] = useState(false);
  const im = image(value);
  return (
    <Label spec={spec} as="div">
      <div className="cms-image-field">
        <button type="button" className="cms-image-field__thumb" onClick={() => setOpen(true)} aria-label={im.src ? 'Change image' : 'Choose image'}>
          {im.src ? <img src={mediaSrc(im.src)} alt="" /> : <ImagePlus size={26} aria-hidden />}
        </button>
        <div className="cms-image-field__side">
          <button type="button" className="adm-btn" onClick={() => setOpen(true)}>
            <ImagePlus size={16} aria-hidden /> {im.src ? 'Change' : 'Choose image'}
          </button>
          {im.src && (
            <button type="button" className="adm-link" onClick={() => onChange({ src: '', alt: '' })}>
              Remove
            </button>
          )}
        </div>
      </div>
      {im.src && (
        <input
          className="adm-input"
          value={im.alt}
          placeholder="Describe the image (alt text)"
          aria-label="Image description"
          onChange={(e) => onChange({ ...im, alt: e.target.value })}
        />
      )}
      {open && (
        <MediaPicker
          notify={notify}
          onClose={() => setOpen(false)}
          onPick={(picked) => {
            onChange({ src: picked.src, alt: picked.alt || im.alt });
            setOpen(false);
          }}
        />
      )}
    </Label>
  );
};

const LinkField: React.FC<{ spec: FieldSpec; value: unknown; onChange: (v: unknown) => void }> = ({ spec, value, onChange }) => {
  const { pages } = useContext(FieldContext);
  const l = link(value);
  const pageOptions = pages.filter((p) => p.slug !== 'home' && p.slug !== 'screens').map((p) => [pagePath(p.slug), `Page: ${p.title}`] as [string, string]);
  const known = [...DESTINATIONS, ...pageOptions].some(([v]) => v === l.href);
  const [custom, setCustom] = useState(!known && l.href !== '');
  return (
    <Label spec={spec} as="div">
      <div className="cms-link-field">
        <input className="adm-input" value={l.label} placeholder="Button text (empty = no button)" onChange={(e) => onChange({ ...l, label: e.target.value })} />
        <select
          className="adm-input"
          aria-label="Where it goes"
          value={custom ? '__custom' : l.href}
          onChange={(e) => {
            if (e.target.value === '__custom') {
              setCustom(true);
              return;
            }
            setCustom(false);
            onChange({ ...l, href: e.target.value });
          }}
        >
          {!known && !custom && <option value={l.href}>Choose where it goes…</option>}
          <optgroup label="App">
            {DESTINATIONS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </optgroup>
          {pageOptions.length > 0 && (
            <optgroup label="Your pages">
              {pageOptions.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </optgroup>
          )}
          <option value="__custom">Another address…</option>
        </select>
        {custom && (
          <input
            className="adm-input"
            value={l.href}
            placeholder="https://…, /page or #section"
            onChange={(e) => onChange({ ...l, href: e.target.value })}
            autoFocus
          />
        )}
      </div>
    </Label>
  );
};

const ListField: React.FC<{ spec: Extract<FieldSpec, { kind: 'list' }>; value: unknown; onChange: (v: unknown) => void }> = ({
  spec,
  value,
  onChange,
}) => {
  const list = items(value);
  const [open, setOpen] = useState<number | null>(list.length === 1 ? 0 : null);
  const set = (next: BlockData[]) => onChange(next);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it!);
    set(next);
    setOpen(to);
  };
  const full = spec.max !== undefined && list.length >= spec.max;

  return (
    <div className="adm-field cms-field cms-list">
      <span>
        {spec.label} <small className="adm-muted">({list.length})</small>
      </span>
      {list.map((it, i) => {
        const title = str(it[spec.titleKey]).replace(/\*/g, '') || `${spec.item[0]!.toUpperCase()}${spec.item.slice(1)} ${i + 1}`;
        const isOpen = open === i;
        return (
          <div key={i} className={`cms-list__item${isOpen ? ' is-open' : ''}`}>
            <div className="cms-list__head">
              <button type="button" className="cms-list__title" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                <ChevronDown size={16} aria-hidden />
                <span>{title}</span>
              </button>
              <button type="button" className="adm-icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp size={15} aria-hidden />
              </button>
              <button type="button" className="adm-icon-btn" onClick={() => move(i, i + 1)} disabled={i === list.length - 1} aria-label="Move down">
                <ArrowDown size={15} aria-hidden />
              </button>
              <button
                type="button"
                className="adm-icon-btn"
                disabled={full}
                onClick={() => {
                  const next = [...list];
                  next.splice(i + 1, 0, structuredClone(it));
                  set(next);
                  setOpen(i + 1);
                }}
                aria-label="Duplicate"
              >
                <Copy size={15} aria-hidden />
              </button>
              <button
                type="button"
                className="adm-icon-btn"
                onClick={() => {
                  set(list.filter((_, j) => j !== i));
                  setOpen(null);
                }}
                aria-label={`Remove ${spec.item}`}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </div>
            {isOpen && (
              <div className="cms-list__body">
                <FieldList
                  fields={spec.fields}
                  data={{ ...spec.blank, ...it }}
                  onChange={(key, v) => set(list.map((x, j) => (j === i ? { ...x, [key]: v } : x)))}
                />
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="adm-btn cms-list__add"
        disabled={full}
        onClick={() => {
          set([...list, structuredClone(spec.blank)]);
          setOpen(list.length);
        }}
      >
        <Plus size={16} aria-hidden /> Add {spec.item}
      </button>
    </div>
  );
};
