/**
 * Lightweight motion system.
 * No dependencies: scroll reveals, numeric count-ups, header scroll state
 * and a reading-progress bar. Everything degrades to a static layout when
 * the user prefers reduced motion.
 */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let revealObserver: IntersectionObserver | null = null;
let countObserver: IntersectionObserver | null = null;
let scrollHandler: (() => void) | null = null;

const EASE_OUT_EXPO = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

function runCountUp(el: HTMLElement) {
  const target = Number(el.dataset.count ?? '0');
  const decimals = Number(el.dataset.countDecimals ?? '0');
  const prefix = el.dataset.countPrefix ?? '';
  const suffix = el.dataset.countSuffix ?? '';
  const grouped = el.dataset.countGroup === 'true';

  const format = (value: number) =>
    `${prefix}${
      grouped
        ? Math.round(value).toLocaleString('en-US')
        : value.toFixed(decimals)
    }${suffix}`;

  if (!Number.isFinite(target) || target === 0) {
    el.textContent = format(0);
    return;
  }

  const duration = 1400;
  const start = performance.now();

  const frame = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = format(target * EASE_OUT_EXPO(progress));
    if (progress < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

function initReveals(root: ParentNode) {
  const targets = Array.from(
    root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-bound])'),
  );
  if (targets.length === 0) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => {
      el.dataset.revealBound = 'true';
      el.classList.add('is-in');
    });
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver?.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
  }

  targets.forEach((el, index) => {
    el.dataset.revealBound = 'true';
    const delay = Number(el.dataset.revealDelay ?? 0);
    if (delay > 0) {
      el.style.setProperty('--reveal-delay', `${delay}ms`);
    } else {
      el.style.removeProperty('--reveal-delay');
    }
    el.classList.remove('is-in');
    void index;
    revealObserver?.observe(el);
  });
}

function initCountUps(root: ParentNode) {
  const targets = Array.from(
    root.querySelectorAll<HTMLElement>('[data-count]:not([data-count-bound])'),
  );
  if (targets.length === 0) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => {
      el.dataset.countBound = 'true';
      const grouped = el.dataset.countGroup === 'true';
      const decimals = Number(el.dataset.countDecimals ?? '0');
      const value = Number(el.dataset.count ?? '0');
      el.textContent = `${
        el.dataset.countPrefix ?? ''
      }${grouped ? value.toLocaleString('en-US') : value.toFixed(decimals)}${
        el.dataset.countSuffix ?? ''
      }`;
    });
    return;
  }

  if (!countObserver) {
    countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCountUp(entry.target as HTMLElement);
          countObserver?.unobserve(entry.target);
        });
      },
      { threshold: 0.6 },
    );
  }

  targets.forEach((el) => {
    el.dataset.countBound = 'true';
    const grouped = el.dataset.countGroup === 'true';
    const decimals = Number(el.dataset.countDecimals ?? '0');
    el.textContent = `${el.dataset.countPrefix ?? ''}${
      grouped ? '0' : (0).toFixed(decimals)
    }${el.dataset.countSuffix ?? ''}`;
    countObserver?.observe(el);
  });
}

function initScrollState() {
  const root = document.documentElement;

  const update = () => {
    const y = window.scrollY;
    root.classList.toggle('is-scrolled', y > 8);

    const max = root.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(y / max, 1) : 0;
    root.style.setProperty('--scroll-progress', progress.toString());
  };

  if (scrollHandler) {
    scrollHandler();
    return;
  }

  scrollHandler = update;
  window.addEventListener('scroll', update, { passive: true });
  update();
}

export function initMotion(root: ParentNode = document) {
  initScrollState();
  initReveals(root);
  initCountUps(root);
}

export function resetMotion() {
  revealObserver?.disconnect();
  countObserver?.disconnect();
  revealObserver = null;
  countObserver = null;
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    scrollHandler = null;
  }
}
