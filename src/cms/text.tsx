import React from 'react';
import { isExternal, safeHref, useCmsEnv } from './read';
import type { CmsLink } from './types';

/* Text an admin types, turned into elements (never raw HTML, so a page can't
   carry scripts). Headings use *stars* for the coloured words; long text
   uses a small Markdown subset. */

/** "Study smarter. *Score higher.*" → the starred part in the accent colour;
    a new line is a line break. */
export const Accent: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {line.split(/(\*[^*\n]+\*)/g).map((part, j) =>
          part.length > 2 && part.startsWith('*') && part.endsWith('*') ? <span key={j}>{part.slice(1, -1)}</span> : part,
        )}
      </React.Fragment>
    ))}
  </>
);

/** A link inside text or a button. Internal links stay in the app. */
export const CmsAnchor: React.FC<{ href: string; className?: string; children: React.ReactNode }> = ({ href, className, children }) => {
  const { run, editing } = useCmsEnv();
  const to = safeHref(href);
  if (!to || to.startsWith('action:')) {
    return (
      <button type="button" className={className} onClick={() => !editing && to && run(to)}>
        {children}
      </button>
    );
  }
  const external = isExternal(to);
  return (
    <a
      href={to}
      className={className}
      target={external && !to.startsWith('mailto:') && !to.startsWith('tel:') ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      onClick={(e) => {
        if (editing) return e.preventDefault();
        if (external || to.startsWith('#') || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        run(to);
      }}
    >
      {children}
    </a>
  );
};

/** A button from a CmsLink; nothing when it has no label. */
export const CmsButton: React.FC<{ link: CmsLink; className: string; icon?: React.ReactNode }> = ({ link, className, icon }) =>
  link.label.trim() ? (
    <CmsAnchor href={link.href} className={className}>
      {link.label}
      {icon}
    </CmsAnchor>
  ) : null;

const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\))/g;

const inline = (text: string): React.ReactNode[] =>
  text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (m) return <CmsAnchor key={i} href={m[2]!}>{m[1]}</CmsAnchor>;
    return part;
  });

const withBreaks = (text: string) =>
  text.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {inline(line)}
    </React.Fragment>
  ));

/** Paragraphs, ## headings, - bullets, 1. numbers, > quotes, **bold**,
    *italic* and [links](/page). Blank lines separate paragraphs. */
export const Markdown: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <div className={`cms-prose${className ? ` ${className}` : ''}`}>
    {text
      .replace(/\r/g, '')
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk, i) => {
        const rows = chunk.split('\n');
        if (chunk.startsWith('### ')) return <h4 key={i}>{inline(chunk.slice(4))}</h4>;
        if (chunk.startsWith('## ')) return <h3 key={i}>{inline(chunk.slice(3))}</h3>;
        if (rows.every((r) => /^[-*] /.test(r))) return <ul key={i}>{rows.map((r, j) => <li key={j}>{inline(r.slice(2))}</li>)}</ul>;
        if (rows.every((r) => /^\d+[.)] /.test(r)))
          return <ol key={i}>{rows.map((r, j) => <li key={j}>{inline(r.replace(/^\d+[.)] /, ''))}</li>)}</ol>;
        if (rows.every((r) => r.startsWith('>'))) return <blockquote key={i}>{withBreaks(rows.map((r) => r.replace(/^> ?/, '')).join('\n'))}</blockquote>;
        return <p key={i}>{withBreaks(chunk)}</p>;
      })}
  </div>
);
