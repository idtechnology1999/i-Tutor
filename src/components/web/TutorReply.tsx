import React, { useEffect, useRef, useState } from 'react';
import { Maths } from './Maths';
import { svgUrl } from '../../lib/svg-clean';
import { ArrowDown, CircleCheck, Sigma, TriangleAlert } from 'lucide-react';
import { parseReply, stripMath } from '../../lib/tutor-reply';
import type { Piece } from '../../lib/tutor-reply';

/* A tutor reply drawn piece by piece. The AI writes blocks on their own lines
   (the backend's ai/tutors.ts asks for these; keep the two in step):

     :::step Title      one step of the working, shown one at a time
     :::formula         LaTeX, shown as real maths on a card
     :::diagram Caption one SVG drawing
     :::answer          the result
     :::trap            the mistake examiners expect

   Each block ends with a line holding only ":::". Blocks can sit inside a
   step. Anything else is plain text with **bold** and $inline maths$. */

/** **bold** and $maths$ inside a line of text. */
const Inline: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$|\\\([^\n]+?\\\)|\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) return <Maths key={i} tex={part.slice(2, -2)} />;
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) return <Maths key={i} tex={part.slice(1, -1)} />;
      if (part.startsWith('\\(') && part.endsWith('\\)')) return <Maths key={i} tex={part.slice(2, -2)} />;
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
      return part;
    })}
  </>
);

/** Paragraphs, with "1." / "•" / "-" lines as lists. */
const Text: React.FC<{ text: string }> = ({ text }) => {
  const paras = text.split(/\n\s*\n/);
  return (
    <>
      {paras.map((para, i) => {
        const lines = para.split('\n').filter((l) => l.trim());
        // A line that is only a $$display$$ formula becomes a formula card.
        if (lines.length === 1 && /^\s*\$\$[\s\S]+\$\$\s*$/.test(lines[0]!)) return <FormulaCard key={i} tex={stripMath(lines[0]!.trim())} />;
        const bullet = /^\s*([•*-]|\d+[.)])\s+/;
        if (lines.length > 1 && lines.every((l) => bullet.test(l))) {
          const ordered = /^\s*\d/.test(lines[0]!);
          const items = lines.map((l, j) => (
            <li key={j}>
              <Inline text={l.replace(bullet, '')} />
            </li>
          ));
          return ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>;
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                <Inline text={l} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
};

const FormulaCard: React.FC<{ tex: string }> = ({ tex }) => (
  <div className="tr-formula">
    <Sigma size={16} aria-hidden className="tr-formula__icon" />
    <Maths tex={tex} display />
  </div>
);

/* ---------------------------------------------------------------- Diagrams */

const Diagram: React.FC<{ svg: string; caption: string }> = ({ svg, caption }) => {
  const url = svgUrl(svg);
  if (!url) return null;
  return (
    <figure className="tr-diagram">
      <img src={url} alt={caption || 'Diagram'} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
};

/* ------------------------------------------------------------------ Pieces */

const Pieces: React.FC<{ pieces: Piece[] }> = ({ pieces }) => (
  <>
    {pieces.map((p, i) => {
      switch (p.kind) {
        case 'text':
          return <Text key={i} text={p.text} />;
        case 'formula':
          return <FormulaCard key={i} tex={p.tex} />;
        case 'diagram':
          return <Diagram key={i} svg={p.svg} caption={p.caption} />;
        case 'answer':
          return (
            <div key={i} className="tr-answer">
              <CircleCheck size={18} aria-hidden />
              <div>
                <Pieces pieces={p.body} />
              </div>
            </div>
          );
        case 'trap':
          return (
            <div key={i} className="tr-trap">
              <TriangleAlert size={18} aria-hidden />
              <div>
                <strong className="tr-trap__label">Exam trap</strong>
                <Pieces pieces={p.body} />
              </div>
            </div>
          );
        case 'step':
          return <Step key={i} title={p.title} body={p.body} />;
      }
    })}
  </>
);

const Step: React.FC<{ title: string; body: Piece[]; label?: string }> = ({ title, body, label }) => (
  <section className="tr-step">
    <header className="tr-step__head">
      {label && <span className="tr-step__num">{label}</span>}
      <strong>
        <Inline text={title || 'Next'} />
      </strong>
    </header>
    <div className="tr-step__body">
      <Pieces pieces={body} />
    </div>
  </section>
);


/**
 * One tutor reply. With `stepwise`, worked steps open one at a time ("Next
 * step"), and the answer waits until the last step is shown.
 */
export const TutorReply: React.FC<{ text: string; stepwise?: boolean }> = ({ text, stepwise }) => {
  const pieces = parseReply(text);

  // Intro before the first step; each step keeps the loose pieces after it.
  const firstStep = pieces.findIndex((p) => p.kind === 'step');
  const intro = firstStep < 0 ? pieces : pieces.slice(0, firstStep);
  const steps: Array<{ step: Extract<Piece, { kind: 'step' }>; extra: Piece[] }> = [];
  const outro: Piece[] = [];
  for (const p of firstStep < 0 ? [] : pieces.slice(firstStep)) {
    if (p.kind === 'step') steps.push({ step: p, extra: [] });
    else if (p.kind === 'answer' || p.kind === 'trap' || steps.length === 0) outro.push(p);
    else if (outro.length) outro.push(p);
    else steps[steps.length - 1]!.extra.push(p);
  }

  const [shown, setShown] = useState(stepwise && steps.length > 1 ? 1 : steps.length);
  const visible = stepwise ? Math.min(shown, steps.length) : steps.length;
  const done = visible >= steps.length;
  const lastRef = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);

  useEffect(() => {
    if (!revealed.current || !stepwise) return;
    lastRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [visible, stepwise]);

  const next = (all = false) => {
    revealed.current = true;
    setShown(all ? steps.length : visible + 1);
  };

  return (
      <div className="tr">
        <Pieces pieces={intro} />
        {steps.slice(0, visible).map(({ step, extra }, i) => (
          <div key={i} ref={i === visible - 1 ? lastRef : undefined} className="tr-reveal">
            <Step label={steps.length > 1 ? String(i + 1) : undefined} title={step.title} body={[...step.body, ...extra]} />
          </div>
        ))}
        {!done && (
          <div className="tr-next">
            <button type="button" className="tr-next__btn" onClick={() => next()}>
              Next step <span className="tr-next__count">{visible + 1} of {steps.length}</span>
              <ArrowDown size={16} aria-hidden />
            </button>
            <button type="button" className="tr-next__all" onClick={() => next(true)}>
              Show all steps
            </button>
          </div>
        )}
        {done && (
          <div ref={steps.length ? undefined : lastRef} className={steps.length > 1 ? 'tr-reveal' : undefined}>
            <Pieces pieces={outro} />
          </div>
        )}
      </div>
  );
};
