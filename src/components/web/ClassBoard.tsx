import React, { useRef, useState } from 'react';
import { Check, PenLine, X } from 'lucide-react';
import type { BoardLine } from '../../data/syllabus';
import { lenOf } from '../../lib/board';
import { cleanSvg } from '../../lib/svg-clean';
import { Maths } from './Maths';

/* One line on the classroom whiteboard, at any stage of being written, and
   the student's own ink on top of the board. */

const Pen = () => <PenLine size={20} className="cls__pen" aria-hidden />;

const BOARD_FONT = "Caveat, 'Segoe Print', cursive";

interface ItemProps {
  line: BoardLine;
  /** Pen letters written so far; ignored once `done`. */
  chars: number;
  done: boolean;
  /** The teacher is talking about this line. */
  focused?: boolean;
  /** Tap a written line to ask about it. */
  onTap?: () => void;
  /** Ask lines: the student's pick, and how to send one. */
  picked?: string;
  onPick?: (label: string) => void;
}

export const BoardItem: React.FC<ItemProps> = ({ line, chars, done, focused, onTap, picked, onPick }) => {
  const pct = done ? 1 : Math.min(1, chars / lenOf(line));
  const typed = done ? line.text : line.text.slice(0, chars);
  const tap =
    onTap && done
      ? {
          role: 'button',
          tabIndex: 0,
          onClick: onTap,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTap();
            }
          },
          title: 'Tap to ask about this',
        }
      : {};
  const cls = `bl bl--${line.kind}${focused ? ' is-focus' : ''}${onTap && done ? ' is-tappable' : ''}`;

  if (line.kind === 'formula' && line.tex) {
    return (
      <div className={cls} {...tap}>
        {/* The formula appears left to right, as if written. */}
        <span className="bl__wipe" style={done ? undefined : { clipPath: `inset(-20% ${100 - pct * 100}% -20% 0)` }}>
          <Maths tex={line.tex} />
        </span>
        {!done && <Pen />}
      </div>
    );
  }

  if (line.kind === 'diagram') {
    const svg = line.svg ? cleanSvg(line.svg, { draw: true, font: BOARD_FONT }) : null;
    const shapes = svg ? (svg.match(/--i:/g) ?? []).length : 0;
    return (
      <figure className={cls} {...tap}>
        {svg && <div className="bl__drawing" style={{ '--n': Math.max(shapes, 1) } as React.CSSProperties} dangerouslySetInnerHTML={{ __html: svg }} />}
        {(pct > 0.7 || !svg) && <figcaption>{line.text}</figcaption>}
        {!done && <Pen />}
      </figure>
    );
  }

  if (line.kind === 'ask') {
    const answered = picked !== undefined;
    const right = picked === line.answer;
    return (
      <div className={cls}>
        <p className="bl-ask__q">
          {typed}
          {!done && <Pen />}
        </p>
        {done && (
          <div className="bl-ask__opts" role="group" aria-label="Your answer">
            {(line.options ?? []).map((o) => {
              const state = !answered ? '' : o.label === line.answer ? ' is-right' : o.label === picked ? ' is-wrong' : ' is-dim';
              return (
                <button key={o.label} type="button" className={`bl-ask__opt${state}`} disabled={answered} onClick={() => onPick?.(o.label)}>
                  <b>{o.label}</b> {o.text}
                  {answered && o.label === line.answer && <Check size={20} aria-hidden />}
                  {answered && o.label === picked && !right && <X size={20} aria-hidden />}
                </button>
              );
            })}
          </div>
        )}
        {done && !answered && <p className="bl-ask__wait">Tap your answer, or type A, B, C…</p>}
        {answered && (
          <p className={`bl-ask__why ${right ? 'is-right' : 'is-wrong'}`}>
            {right ? 'Correct! ' : `It’s ${line.answer}. `}
            {line.why}
          </p>
        )}
      </div>
    );
  }

  return (
    <p className={cls} {...tap}>
      {typed}
      {!done && <Pen />}
    </p>
  );
};

/* ------------------------------------------------------------------ Ink */

/** The student's pen: draw on the board with a finger, stylus or mouse. */
export const InkLayer: React.FC<{ active: boolean; strokes: string[]; onStroke: (d: string) => void }> = ({ active, strokes, onStroke }) => {
  const [live, setLive] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);

  const point = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return `${Math.round(e.clientX - r.left)} ${Math.round(e.clientY - r.top)}`;
  };

  return (
    <svg
      ref={svgRef}
      className={`cls__ink${active ? ' is-active' : ''}`}
      aria-hidden
      onPointerDown={(e) => {
        if (!active) return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Not every pointer can be captured; drawing still works.
        }
        drawing.current = true;
        setLive(`M${point(e)}`);
      }}
      onPointerMove={(e) => {
        if (drawing.current) setLive((d) => `${d} L${point(e)}`);
      }}
      onPointerUp={() => {
        if (!drawing.current) return;
        drawing.current = false;
        // A tap without moving still leaves a dot.
        if (live) onStroke(live.includes('L') ? live : `${live} l0.1 0`);
        setLive('');
      }}
    >
      {strokes.map((d, i) => (
        <path key={i} d={d} />
      ))}
      {live && <path d={live} />}
    </svg>
  );
};
