import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calculator } from 'lucide-react';

/* -----------------------------------------------------------------------------
   Exam calculator: iPhone-style keypad inside a macOS-style window.
   - Red light closes (shrinks away), yellow minimises to a dock pill,
     green puts the window back where it started.
   - Drag by the title bar with mouse or finger; it stays on screen.
   - Type on the keyboard like the Mac app: digits, + − × ÷, Enter, Esc,
     Backspace, %.
   Arithmetic is a small state machine — no eval.
   -------------------------------------------------------------------------- */

type Op = '+' | '-' | '*' | '/';

interface Props {
  onClose: () => void;
}

const MAX_DIGITS = 9;

const compute = (a: number, b: number, op: Op) => {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? NaN : a / b;
  }
};

// iPhone-like formatting: grouping, at most 9 significant digits, then e-notation.
const format = (value: number) => {
  if (!Number.isFinite(value)) return 'Error';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e9 || abs < 1e-8)) return value.toExponential(4).replace('e+', 'e');
  const fixed = Number(value.toPrecision(MAX_DIGITS));
  return fixed.toLocaleString('en-US', { maximumFractionDigits: 8 });
};

// Display string (with grouping) -> number.
const parse = (display: string) => Number(display.replace(/,/g, ''));

// Raw typed digits keep trailing "." and zeros, but still get grouping.
const groupRaw = (raw: string) => {
  const negative = raw.startsWith('-');
  const body = negative ? raw.slice(1) : raw;
  const [int, frac] = body.split('.');
  const grouped = Number(int).toLocaleString('en-US');
  return `${negative ? '-' : ''}${grouped}${frac !== undefined ? `.${frac}` : ''}`;
};

const KEYS: Array<{ label: string; key: string; kind: 'fn' | 'num' | 'op'; wide?: boolean }> = [
  { label: 'AC', key: 'clear', kind: 'fn' },
  { label: '±', key: 'sign', kind: 'fn' },
  { label: '%', key: '%', kind: 'fn' },
  { label: '÷', key: '/', kind: 'op' },
  { label: '7', key: '7', kind: 'num' },
  { label: '8', key: '8', kind: 'num' },
  { label: '9', key: '9', kind: 'num' },
  { label: '×', key: '*', kind: 'op' },
  { label: '4', key: '4', kind: 'num' },
  { label: '5', key: '5', kind: 'num' },
  { label: '6', key: '6', kind: 'num' },
  { label: '−', key: '-', kind: 'op' },
  { label: '1', key: '1', kind: 'num' },
  { label: '2', key: '2', kind: 'num' },
  { label: '3', key: '3', kind: 'num' },
  { label: '+', key: '+', kind: 'op' },
  { label: '0', key: '0', kind: 'num', wide: true },
  { label: '.', key: '.', kind: 'num' },
  { label: '=', key: '=', kind: 'op' },
];

export const ExamCalculator: React.FC<Props> = ({ onClose }) => {
  const [raw, setRaw] = useState('0'); // what the student is typing
  const [display, setDisplay] = useState('0'); // what is shown
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true); // next digit starts a new number
  const [pressed, setPressed] = useState<string | null>(null);

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [phase, setPhase] = useState<'open' | 'closing' | 'minimising' | 'minimised' | 'restoring'>('open');
  const winRef = useRef<HTMLDivElement>(null);

  const showRaw = (next: string) => {
    setRaw(next);
    setDisplay(groupRaw(next));
  };

  const showValue = (value: number) => {
    const text = format(value);
    setDisplay(text);
    setRaw(Number.isFinite(value) ? String(Number(value.toPrecision(MAX_DIGITS))) : '0');
  };

  const press = useCallback(
    (key: string) => {
      setPressed(key);
      window.setTimeout(() => setPressed((p) => (p === key ? null : p)), 140);

      if (/^[0-9]$/.test(key)) {
        if (fresh || display === 'Error') {
          showRaw(key);
          setFresh(false);
        } else if (raw.replace(/[-.]/g, '').length < MAX_DIGITS) {
          showRaw(raw === '0' ? key : raw + key);
        }
        return;
      }

      switch (key) {
        case '.':
          if (fresh || display === 'Error') {
            showRaw('0.');
            setFresh(false);
          } else if (!raw.includes('.')) {
            showRaw(`${raw}.`);
          }
          return;
        case 'clear':
          // "C" clears the current entry; "AC" clears everything.
          if (!fresh && raw !== '0') {
            showRaw('0');
            setFresh(true);
          } else {
            showRaw('0');
            setAcc(null);
            setOp(null);
            setFresh(true);
          }
          return;
        case 'sign':
          if (display === 'Error') return;
          if (fresh && acc !== null && op) return;
          showRaw(raw.startsWith('-') ? raw.slice(1) : raw === '0' ? '0' : `-${raw}`);
          return;
        case '%':
          if (display === 'Error') return;
          showValue(parse(display) / 100);
          setFresh(true);
          return;
        case 'back':
          if (fresh || display === 'Error') return;
          showRaw(raw.length > 1 && raw !== '-0' ? raw.slice(0, -1).replace(/^-$/, '0') : '0');
          return;
        case '=': {
          if (op === null || acc === null) return;
          const result = compute(acc, parse(display), op);
          showValue(result);
          setAcc(null);
          setOp(null);
          setFresh(true);
          return;
        }
        default: {
          const nextOp = key as Op;
          if (display === 'Error') return;
          if (op !== null && acc !== null && !fresh) {
            const result = compute(acc, parse(display), op);
            showValue(result);
            setAcc(result);
          } else if (op === null || !fresh) {
            setAcc(parse(display));
          }
          setOp(nextOp);
          setFresh(true);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw, display, acc, op, fresh],
  );

  // Mac-style keyboard input while the calculator window has focus.
  useEffect(() => {
    const el = winRef.current;
    if (!el) return;
    const onKey = (event: KeyboardEvent) => {
      const map: Record<string, string> = {
        Enter: '=',
        '=': '=',
        Escape: 'clear',
        Backspace: 'back',
        Delete: 'back',
        x: '*',
        X: '*',
      };
      const key = map[event.key] ?? event.key;
      if (/^[0-9.+\-*/%=]$/.test(key) || key === 'clear' || key === 'back') {
        event.preventDefault();
        event.stopPropagation();
        press(key);
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [press]);

  useEffect(() => {
    winRef.current?.focus({ preventScroll: true });
  }, []);

  /* -------------------------------------------------------------- Window */
  const onDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    const box = winRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    box.classList.add('is-dragging');

    const move = (e: PointerEvent) => {
      setPos({
        x: Math.min(Math.max(8, e.clientX - offsetX), window.innerWidth - rect.width - 8),
        y: Math.min(Math.max(8, e.clientY - offsetY), window.innerHeight - rect.height - 8),
      });
    };
    const up = () => {
      box.classList.remove('is-dragging');
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  };

  const onAnimationEnd = () => {
    if (phase === 'closing') onClose();
    else if (phase === 'minimising') setPhase('minimised');
    else if (phase === 'restoring') {
      setPhase('open');
      winRef.current?.focus({ preventScroll: true });
    }
  };

  const clearLabel = !fresh && raw !== '0' ? 'C' : 'AC';
  const long = display.length > 9 ? (display.length > 11 ? ' is-xlong' : ' is-long') : '';

  return (
    <>
      {phase !== 'minimised' && (
        <div
          ref={winRef}
          className={`calc is-${phase}${pos ? ' is-moved' : ''}`}
          style={pos ? { left: pos.x, top: pos.y } : undefined}
          role="dialog"
          aria-label="Calculator"
          tabIndex={-1}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) onAnimationEnd();
          }}
        >
          <div className="calc__titlebar" onPointerDown={onDragStart}>
            <div className="calc__lights">
              <button
                type="button"
                className="calc__light calc__light--close"
                onClick={() => setPhase('closing')}
                aria-label="Close calculator"
              >
                <svg viewBox="0 0 10 10" aria-hidden>
                  <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
                </svg>
              </button>
              <button
                type="button"
                className="calc__light calc__light--min"
                onClick={() => setPhase('minimising')}
                aria-label="Minimise calculator"
              >
                <svg viewBox="0 0 10 10" aria-hidden>
                  <path d="M2 5h6" />
                </svg>
              </button>
              <button
                type="button"
                className="calc__light calc__light--zoom"
                onClick={() => setPos(null)}
                aria-label="Move calculator back"
              >
                <svg viewBox="0 0 10 10" aria-hidden>
                  <path d="M3 7V3h4M7 3L3 7" />
                </svg>
              </button>
            </div>
            <span className="calc__title">Calculator</span>
          </div>

          <output className={`calc__display${long}`} aria-live="polite">
            {display}
          </output>

          <div className="calc__keys">
            {KEYS.map((k) => {
              const label = k.key === 'clear' ? clearLabel : k.label;
              const activeOp = k.kind === 'op' && k.key !== '=' && op === k.key && fresh;
              return (
                <button
                  key={k.key}
                  type="button"
                  className={`calc__key calc__key--${k.kind}${k.wide ? ' calc__key--wide' : ''}${
                    activeOp ? ' is-active' : ''
                  }${pressed === k.key ? ' is-pressed' : ''}`}
                  onClick={() => press(k.key)}
                  aria-label={k.key === 'clear' ? (label === 'C' ? 'Clear entry' : 'All clear') : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'minimised' && (
        <button type="button" className="calc-dock" onClick={() => setPhase('restoring')}>
          <Calculator size={16} aria-hidden />
          Calculator
        </button>
      )}
    </>
  );
};
