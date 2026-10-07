import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { flushSync } from 'react-dom';

/**
 * Interaction helpers for the iOS-style feel: page transitions, a header that
 * tucks away on scroll, pointer tilt / scroll parallax, and drag-to-dismiss
 * sheets. All of them back off under prefers-reduced-motion.
 */

export const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const finePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => unknown;
};

/** Run a state update inside a View Transition when the browser has one. */
export function withViewTransition(update: () => void) {
  const doc = document as ViewTransitionDoc;
  if (!doc.startViewTransition || reducedMotion()) {
    update();
    return;
  }
  doc.startViewTransition(() => {
    flushSync(update);
  });
}

/**
 * 'up' | 'down' based on the last meaningful scroll movement. Small jitters
 * (rubber-band bounce on iOS) are ignored so the header doesn't flicker.
 */
export function useScrollDirection(threshold = 6) {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = Math.max(0, window.scrollY);
      setAtTop(y < 24);
      if (Math.abs(y - last) >= threshold) {
        setDirection(y > last && y > 80 ? 'down' : 'up');
        last = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { direction, atTop };
}

/**
 * Writes --tilt-x / --tilt-y (deg) and --glare-x / --glare-y (%) onto the
 * element as the pointer moves over it. Mouse/trackpad only.
 */
export function usePointerTilt<T extends HTMLElement>(ref: RefObject<T | null>, max = 6) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !finePointer()) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--tilt-x', `${((0.5 - py) * max).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${((px - 0.5) * max).toFixed(2)}deg`);
        el.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
        el.style.setProperty('--px', (px - 0.5).toFixed(3));
        el.style.setProperty('--py', (py - 0.5).toFixed(3));
        el.classList.add('is-pointer');
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
      el.classList.remove('is-pointer');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, max]);
}

/**
 * Writes --scroll-p onto the element: 0 when its top meets the bottom of the
 * viewport, 1 when its bottom leaves the top. CSS turns that into parallax.
 */
export function useScrollProgress<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;

    let frame = 0;
    let visible = false;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = window.innerHeight + rect.height;
      const p = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / total));
      el.style.setProperty('--scroll-p', p.toFixed(4));
    };
    const onScroll = () => {
      if (!visible) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) update();
    });
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [ref]);
}

/**
 * Drag-to-dismiss for a bottom sheet, in the style of iOS: the sheet follows
 * the finger 1:1 downward, resists upward pulls, and closes if released past
 * a distance or with enough downward velocity. Otherwise it springs back.
 */
export function useSheetDrag<T extends HTMLElement>(
  ref: RefObject<T | null>,
  open: boolean,
  onDismiss: () => void,
) {
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !open) return;

    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let dragging = false;

    const onDown = (event: PointerEvent) => {
      // Only start from the grabber, or from anywhere when the sheet's own
      // content is scrolled to the top (so inner scrolling still works).
      const target = event.target as HTMLElement;
      const fromHandle = Boolean(target.closest('[data-sheet-handle]'));
      if (!fromHandle && el.scrollTop > 0) return;
      if (target.closest('a, button, input') && !fromHandle) return;

      dragging = true;
      startY = lastY = event.clientY;
      lastT = performance.now();
      velocity = 0;
      el.setPointerCapture(event.pointerId);
      el.classList.add('is-dragging');
    };

    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dy = event.clientY - startY;
      velocity = (event.clientY - lastY) / Math.max(1, now - lastT);
      lastY = event.clientY;
      lastT = now;
      // Rubber-band when pulled up past the resting point.
      const offset = dy < 0 ? -Math.sqrt(-dy) * 2 : dy;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const onUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
      el.releasePointerCapture?.(event.pointerId);
      const dy = event.clientY - startY;
      el.style.transform = '';
      if (dy > 110 || velocity > 0.6) dismissRef.current();
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [ref, open]);
}
