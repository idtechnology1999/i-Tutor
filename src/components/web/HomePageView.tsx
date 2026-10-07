import React, { useRef, useState } from 'react';
import { usePointerTilt, useScrollProgress } from '../../lib/ui';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  Calculator,
  ChartNoAxesColumnIncreasing,
  Check,
  CircleHelp,
  Clock3,
  Flag,
  GraduationCap,
  Landmark,
  Lightbulb,
  MessageSquareText,
  PenLine,
  ShieldCheck,
  Target,
  UserRoundPlus,
  WifiOff,
} from 'lucide-react';
import { BrandMark } from './BrandMark';

interface HomePageViewProps {
  onLaunchCBT: () => void;
  onOpenSyllabus: () => void;
  onGoToDashboard: () => void;
  onOpenTutor: () => void;
}

/* Real photographs of Nigerian secondary-school students in a CBT lab, by
   James Rhoda on Wikimedia Commons (CC BY-SA 4.0). Served from /public so the
   hero is not waiting on a third-party CDN. */
const PHOTO = {
  hero: '/images/student-cbt-focus.jpg',
  lab: '/images/cbt-lab-rows.jpg',
  tutor: '/images/teacher-guiding.jpg',
  terminals: '/images/students-at-terminals.jpg',
};

const SAMPLE = {
  meta: 'Physics · UTME 2019 · Q14',
  stem: 'A car accelerates uniformly from rest and covers 100 m in 10 s. What is its acceleration?',
  options: ['1.0 m/s²', '2.0 m/s²', '5.0 m/s²', '10.0 m/s²'],
  answer: 1,
  nudge: {
    wrong:
      'Not quite. Which equation links distance, time and acceleration when the car starts from rest? Try writing s = ut + ½at² with u = 0.',
    right:
      'Correct. With u = 0, s = ½at², so 100 = ½ × a × 10², which gives a = 2 m/s². You worked it out — that is the point.',
  },
};

const SUBJECTS = [
  'Use of English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Literature',
];

const STEPS = [
  {
    icon: UserRoundPlus,
    title: 'Create your account',
    body: 'Email or Google. Two minutes, works on any phone browser.',
  },
  {
    icon: Target,
    title: 'Set your exam goal',
    body: 'UTME, Post-UTME or both. Pick your four subjects and target course.',
  },
  {
    icon: PenLine,
    title: 'Practise like the real hall',
    body: 'Timed CBT mocks with the same layout, navigator and calculator.',
  },
  {
    icon: Lightbulb,
    title: 'Learn from every mistake',
    body: 'Each wrong answer opens a guided session that finds the gap.',
  },
];

const TRUST = [
  {
    tone: 'green',
    icon: BadgeCheck,
    label: 'Verified Past Question',
    body: 'Transcribed from an official JAMB or institutional paper and checked by two subject teachers before it goes live.',
  },
  {
    tone: 'blue',
    icon: Landmark,
    label: 'Official Information',
    body: 'Admission news taken only from JAMB, IBASS or the institution’s own portal, with a link to the source.',
  },
  {
    tone: 'amber',
    icon: PenLine,
    label: 'i-Teacher Practice Question',
    body: 'Written by us from a verified seed question, solver-checked, then reviewed. Always labelled so you know.',
  },
] as const;

const CUTOFFS = [
  ['University of Lagos', 'Medicine & Surgery', '280'],
  ['University of Ibadan', 'Computer Science', '268'],
  ['Obafemi Awolowo University', 'Law', '272'],
  ['Ahmadu Bello University', 'Pharmaceutical Sciences', '265'],
  ['University of Nigeria, Nsukka', 'Electrical Engineering', '258'],
];

const FREE_FEATURES = [
  'Unlimited topic practice',
  'Two full CBT mocks a week',
  '5 tutor explanations a day',
  'Verified admission updates',
];

const PREMIUM_FEATURES = [
  'Unlimited CBT mocks',
  'Unlimited tutor explanations',
  'Personal weekly study plan',
  'Topic-level mastery reports',
  '60 voice-tutor minutes a month',
];

const FAQS = [
  {
    q: 'Will the tutor just tell me the answer?',
    a: 'No. The tutor asks guiding questions and gives hints until you reach the answer yourself. If you are really stuck it shows a worked step, but it never simply names the option letter.',
  },
  {
    q: 'Does it work without data?',
    a: 'Yes. Download a subject pack once and the full CBT runs in your browser with no connection. Your attempts are saved on the device and sync when you are back online.',
  },
  {
    q: 'Where do the past questions come from?',
    a: 'From official JAMB and institutional papers. Each one is transcribed, then checked by two independent subject teachers. You can see the year and source on every question.',
  },
  {
    q: 'Which subjects are available?',
    a: 'Use of English, Mathematics, Physics and Chemistry are live now. Biology, Commercial and Arts subjects are being added through the 2026/27 cycle.',
  },
];

const FOOTER_COLUMNS: Array<{
  heading: string;
  items: Array<{ label: string; action: 'syllabus' | 'cbt' | 'tutor' | 'dashboard' }>;
}> = [
  {
    heading: 'Practice',
    items: [
      { label: 'CBT mock exam', action: 'cbt' },
      { label: 'Past questions', action: 'syllabus' },
      { label: 'JAMB syllabus', action: 'syllabus' },
      { label: 'Study tutor', action: 'tutor' },
    ],
  },
  {
    heading: 'Your account',
    items: [
      { label: 'Dashboard', action: 'dashboard' },
      { label: 'Progress', action: 'dashboard' },
      { label: 'Admission updates', action: 'dashboard' },
    ],
  },
  {
    heading: 'Subjects',
    items: [
      { label: 'Use of English', action: 'syllabus' },
      { label: 'Mathematics', action: 'syllabus' },
      { label: 'Physics', action: 'syllabus' },
      { label: 'Chemistry', action: 'syllabus' },
    ],
  },
];

const SampleQuestion: React.FC<{ onOpenTutor: () => void }> = ({ onOpenTutor }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const isRight = picked === SAMPLE.answer;

  return (
    <div
      className={`lp-sample${picked === null ? '' : isRight ? ' is-solved' : ' is-missed'}`}
      aria-live="polite"
    >
      <div className="lp-sample__bar">
        <span className="lp-badge lp-badge--green">
          <BadgeCheck size={14} aria-hidden />
          Verified Past Question
        </span>
        <span className="lp-sample__meta">{SAMPLE.meta}</span>
      </div>

      <p className="lp-sample__stem">{SAMPLE.stem}</p>

      <div className="lp-sample__options" role="radiogroup" aria-label="Answer options">
        {SAMPLE.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const state =
            picked === null
              ? ''
              : index === picked
                ? isRight
                  ? 'is-right'
                  : 'is-wrong'
                : '';
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={picked === index}
              className={`lp-option ${state}`}
              onClick={() => setPicked(index)}
            >
              <span className="lp-option__key">{letter}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div key={picked} className={`lp-sample__nudge ${isRight ? 'is-right' : ''}`}>
          <MessageSquareText size={18} aria-hidden />
          <div>
            <strong>{isRight ? 'Nice work' : 'Tutor hint'}</strong>
            <p>{isRight ? SAMPLE.nudge.right : SAMPLE.nudge.wrong}</p>
            {!isRight && (
              <div className="lp-sample__nudge-actions">
                <button type="button" onClick={() => setPicked(null)}>
                  Try again
                </button>
                <button type="button" onClick={onOpenTutor}>
                  Talk it through with the tutor
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const HomePageView: React.FC<HomePageViewProps> = ({
  onLaunchCBT,
  onOpenSyllabus,
  onGoToDashboard,
  onOpenTutor,
}) => {
  const [openFaq, setOpenFaq] = useState(0);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  usePointerTilt(heroVisualRef, 7);
  useScrollProgress(heroVisualRef);
  useScrollProgress(ctaRef);

  const runAction = (action: 'syllabus' | 'cbt' | 'tutor' | 'dashboard') => {
    switch (action) {
      case 'syllabus':
        return onOpenSyllabus();
      case 'cbt':
        return onLaunchCBT();
      case 'tutor':
        return onOpenTutor();
      case 'dashboard':
        return onGoToDashboard();
    }
  };

  return (
    <div className="lp">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="lp-hero">
        <div className="lp-wrap lp-hero__grid">
          <div className="lp-hero__copy">
            <p className="lp-eyebrow" data-reveal>
              <span className="lp-eyebrow__dot" aria-hidden />
              UTME &amp; Post-UTME · 2026/27 cycle
            </p>
            <h1 className="lp-hero__title" data-reveal data-reveal-delay={60}>
              Practise the real CBT.
              <br />
              <span>Understand every answer.</span>
            </h1>
            <p className="lp-hero__lead" data-reveal data-reveal-delay={120}>
              Verified JAMB past questions, timed mock exams that look like the
              hall, and a tutor that walks you to the answer instead of handing
              it over.
            </p>

            <div className="lp-hero__actions" data-reveal data-reveal-delay={180}>
              <button type="button" className="lp-btn lp-btn--primary" onClick={onLaunchCBT}>
                Start a free mock
                <ArrowRight size={18} aria-hidden />
              </button>
              <a className="lp-btn lp-btn--quiet" href="#sample">
                Try a question first
              </a>
            </div>

            <ul className="lp-hero__points" data-reveal data-reveal-delay={240}>
              <li>
                <Check size={16} aria-hidden /> No card needed
              </li>
              <li>
                <WifiOff size={16} aria-hidden /> Works offline
              </li>
              <li>
                <ShieldCheck size={16} aria-hidden /> Two-teacher verified
              </li>
            </ul>
          </div>

          <div
            className="lp-hero__visual"
            ref={heroVisualRef}
            data-reveal="scale"
            data-reveal-delay={80}
          >
            <figure className="lp-hero__photo">
              <img
                src={PHOTO.hero}
                alt="A secondary-school student working at a computer in a school CBT lab"
                width={1280}
                height={960}
                fetchPriority="high"
                decoding="async"
              />
            </figure>

            {/* A slice of the real exam UI, not a decorative card. */}
            <div className="lp-hero__exam" aria-hidden>
              <div className="lp-hero__exam-top">
                <span>Mathematics · Q17 of 40</span>
                <span className="lp-timer">
                  <Clock3 size={14} />
                  00:41:12
                </span>
              </div>
              <div className="lp-hero__exam-grid">
                {Array.from({ length: 20 }, (_, i) => {
                  const state =
                    i === 7 || i === 15 ? 'is-flag' : i === 16 ? 'is-current' : i < 16 ? 'is-done' : '';
                  return (
                    <i key={i} className={state}>
                      {i + 1}
                    </i>
                  );
                })}
              </div>
            </div>

            <div className="lp-hero__score" aria-hidden>
              <span className="lp-hero__score-label">Mock score</span>
              <span className="lp-hero__score-value">
                268<small>/400</small>
              </span>
              <span className="lp-hero__score-delta">+34 since last week</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Proof strip */}
      <section className="lp-proof" aria-label="At a glance">
        <div className="lp-wrap lp-proof__grid">
          <div>
            <b data-count={2400} data-count-group="true" data-count-suffix="+">
              2,400+
            </b>
            <span>verified past questions</span>
          </div>
          <div>
            <b>2005–2025</b>
            <span>JAMB papers covered</span>
          </div>
          <div>
            <b>2</b>
            <span>teachers check every item</span>
          </div>
          <div>
            <b>0 MB</b>
            <span>data needed once downloaded</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Sample question */}
      <section className="lp-section" id="sample">
        <div className="lp-wrap lp-split">
          <div className="lp-split__copy">
            <p className="lp-kicker" data-reveal>
              Try it now
            </p>
            <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
              Get it wrong here.
              <br />
              Not in the hall.
            </h2>
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              This is a real 2019 UTME Physics question. Pick an answer. If you
              miss it, i-Teacher doesn&rsquo;t just show the key &mdash; it asks
              you the question that gets you unstuck.
            </p>
            <ul className="lp-ticks" data-reveal data-reveal-delay={180}>
              <li>
                <Check size={16} aria-hidden /> Year and source on every question
              </li>
              <li>
                <Check size={16} aria-hidden /> Hints before answers, every time
              </li>
              <li>
                <Check size={16} aria-hidden /> Your weak topics update as you go
              </li>
            </ul>
          </div>
          <div data-reveal="scale" data-reveal-delay={100}>
            <SampleQuestion onOpenTutor={onOpenTutor} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section className="lp-section lp-section--tint" id="features">
        <div className="lp-wrap">
          <header className="lp-head">
            <p className="lp-kicker" data-reveal>
              What&rsquo;s inside
            </p>
            <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
              Everything between you and a strong score.
            </h2>
          </header>

          <article className="lp-feature">
            <figure className="lp-feature__media" data-reveal="scale">
              <img
                src={PHOTO.lab}
                alt="Rows of students sitting at desktop computers in a school CBT centre"
                width={1280}
                height={960}
                loading="lazy"
                decoding="async"
              />
              <div className="lp-feature__chip">
                <Calculator size={16} aria-hidden />
                Calculator, navigator &amp; flagging built in
              </div>
            </figure>
            <div className="lp-feature__copy" data-reveal data-reveal-delay={80}>
              <span className="lp-feature__icon">
                <GraduationCap size={22} aria-hidden />
              </span>
              <h3>A CBT that feels like the real one</h3>
              <p>
                Same screen layout, a hard countdown, question navigator, flag
                for review and the on-screen calculator. Sit full four-subject
                mocks or a quick 20-question topic test.
              </p>
              <ul className="lp-ticks">
                <li>
                  <Check size={16} aria-hidden /> Keyboard shortcuts: A–D, N, P, F
                </li>
                <li>
                  <Check size={16} aria-hidden /> Auto-submit when time runs out
                </li>
                <li>
                  <Check size={16} aria-hidden /> Full scorecard and review after
                </li>
              </ul>
              <button type="button" className="lp-link" onClick={onLaunchCBT}>
                Start a mock exam <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </article>

          <article className="lp-feature lp-feature--flip">
            <figure className="lp-feature__media" data-reveal="scale">
              <img
                src={PHOTO.tutor}
                alt="A teacher explaining something on a computer screen to a group of students"
                width={1280}
                height={960}
                loading="lazy"
                decoding="async"
              />
              <div className="lp-chat" aria-hidden>
                <p className="lp-chat__you">I picked C. Why is it wrong?</p>
                <p className="lp-chat__tutor">
                  Good question. What is the car&rsquo;s starting speed, and
                  which equation uses it?
                </p>
              </div>
            </figure>
            <div className="lp-feature__copy" data-reveal data-reveal-delay={80}>
              <span className="lp-feature__icon">
                <MessageSquareText size={22} aria-hidden />
              </span>
              <h3>A tutor that teaches, not tells</h3>
              <p>
                Ask about any question and the tutor works through it with you
                &mdash; a hint, then a bigger hint, then a worked step. You leave
                knowing how to solve the next one.
              </p>
              <ul className="lp-ticks">
                <li>
                  <Check size={16} aria-hidden /> Explain, Hint and Step-by-step modes
                </li>
                <li>
                  <Check size={16} aria-hidden /> Fresh practice question to check you got it
                </li>
                <li>
                  <Check size={16} aria-hidden /> Voice mode for hands-free revision
                </li>
              </ul>
              <button type="button" className="lp-link" onClick={onOpenTutor}>
                Ask the tutor something <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </article>

          <div className="lp-minis">
            <div className="lp-mini" data-reveal>
              <ChartNoAxesColumnIncreasing size={22} aria-hidden />
              <h4>Know your weak topics</h4>
              <p>Mastery for every topic and subtopic, updated after each session.</p>
              <div className="lp-mastery" aria-hidden>
                <div>
                  <span>Kinematics</span>
                  <i style={{ ['--w' as string]: '82%' }} />
                </div>
                <div>
                  <span>Electrolysis</span>
                  <i style={{ ['--w' as string]: '46%' }} className="is-weak" />
                </div>
                <div>
                  <span>Quadratics</span>
                  <i style={{ ['--w' as string]: '67%' }} />
                </div>
              </div>
            </div>
            <div className="lp-mini" data-reveal data-reveal-delay={70}>
              <WifiOff size={22} aria-hidden />
              <h4>Study without data</h4>
              <p>
                Download a subject once. Mocks run fully offline and sync when
                you reconnect.
              </p>
              <div className="lp-download" aria-hidden>
                <span>Physics pack · 18 MB</span>
                <span className="lp-download__ok">
                  <Check size={14} /> Ready offline
                </span>
              </div>
            </div>
            <div className="lp-mini" data-reveal data-reveal-delay={140}>
              <Building2 size={22} aria-hidden />
              <h4>Admission news you can trust</h4>
              <p>
                Cut-offs, deadlines and Post-UTME dates &mdash; each with its
                official source and the date we last checked it.
              </p>
              <button type="button" className="lp-link" onClick={onGoToDashboard}>
                See latest updates <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- How it works */}
      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <header className="lp-head">
            <p className="lp-kicker" data-reveal>
              How it works
            </p>
            <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
              From sign-up to your first mock in under five minutes.
            </h2>
          </header>
          <ol className="lp-steps">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} data-reveal data-reveal-delay={index * 70}>
                  <span className="lp-steps__num">{String(index + 1).padStart(2, '0')}</span>
                  <Icon size={22} aria-hidden />
                  <h4>{step.title}</h4>
                  <p>{step.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------------- Trust */}
      <section className="lp-section lp-section--ink" id="trust">
        <div className="lp-wrap">
          <header className="lp-head lp-head--split">
            <div>
              <p className="lp-kicker" data-reveal>
                Content you can trust
              </p>
              <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
                Every question tells you where it came from.
              </h2>
            </div>
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              Exam season is full of rumours and fake &ldquo;expo&rdquo;. On
              i-Teacher, one of three labels sits on every question and update,
              so you always know what you&rsquo;re reading.
            </p>
          </header>
          <div className="lp-trust">
            {TRUST.map((item, index) => {
              const Icon = item.icon;
              return (
                <div className="lp-trust__card" key={item.label} data-reveal data-reveal-delay={index * 70}>
                  <span className={`lp-badge lp-badge--${item.tone}`}>
                    <Icon size={14} aria-hidden />
                    {item.label}
                  </span>
                  <p>{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Admissions */}
      <section className="lp-section" id="admissions">
        <div className="lp-wrap lp-split lp-split--wide">
          <div className="lp-split__copy">
            <p className="lp-kicker" data-reveal>
              Admissions
            </p>
            <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
              Know the score you&rsquo;re aiming for.
            </h2>
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              Departmental cut-offs from the last admission cycle. Set your
              target course and i-Teacher tracks how close your mock scores are.
            </p>
            <button type="button" className="lp-btn lp-btn--outline" onClick={onOpenSyllabus} data-reveal data-reveal-delay={180}>
              <BookOpenCheck size={18} aria-hidden />
              Browse syllabus &amp; past questions
            </button>
          </div>
          <div className="lp-table" data-reveal="scale">
            <div className="lp-table__head">
              <span className="lp-badge lp-badge--blue">
                <Landmark size={14} aria-hidden />
                Official Information
              </span>
              <span className="lp-table__checked">Last checked 2 Oct 2026</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th scope="col">Institution</th>
                  <th scope="col">Course</th>
                  <th scope="col" className="is-num">
                    Cut-off
                  </th>
                </tr>
              </thead>
              <tbody>
                {CUTOFFS.map(([school, course, score]) => (
                  <tr key={school + course}>
                    <td>{school}</td>
                    <td>{course}</td>
                    <td className="is-num">{score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Pricing */}
      <section className="lp-section lp-section--tint" id="pricing">
        <div className="lp-wrap">
          <header className="lp-head lp-head--center">
            <p className="lp-kicker" data-reveal>
              Pricing
            </p>
            <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
              Start free. Upgrade when it&rsquo;s worth it.
            </h2>
          </header>
          <div className="lp-plans">
            <div className="lp-plan" data-reveal>
              <h4>Free</h4>
              <p className="lp-plan__price">
                ₦0 <small>forever</small>
              </p>
              <p className="lp-plan__note">Everything you need to start practising today.</p>
              <ul>
                {FREE_FEATURES.map((f) => (
                  <li key={f}>
                    <Check size={16} aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              <button type="button" className="lp-btn lp-btn--outline lp-btn--block" onClick={onLaunchCBT}>
                Start free
              </button>
            </div>
            <div className="lp-plan lp-plan--featured" data-reveal data-reveal-delay={80}>
              <div className="lp-plan__top">
                <h4>Premium</h4>
                <span className="lp-plan__tag">Most chosen</span>
              </div>
              <p className="lp-plan__price">
                ₦2,500 <small>/ month</small>
              </p>
              <p className="lp-plan__note">Pay with card, bank transfer or USSD. Cancel anytime.</p>
              <ul>
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f}>
                    <Check size={16} aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              <button type="button" className="lp-btn lp-btn--primary lp-btn--block" onClick={onGoToDashboard}>
                Get Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- FAQ */}
      <section className="lp-section" id="faq">
        <div className="lp-wrap lp-faq">
          <header>
            <p className="lp-kicker" data-reveal>
              Questions
            </p>
            <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
              Things students ask us.
            </h2>
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              Still unsure? Open the tutor and ask &mdash; it can answer
              questions about i-Teacher too.
            </p>
          </header>
          <div className="lp-faq__list">
            {FAQS.map((item, index) => {
              const open = openFaq === index;
              return (
                <div className={`lp-faq__item ${open ? 'is-open' : ''}`} key={item.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? -1 : index)}
                  >
                    <CircleHelp size={18} aria-hidden />
                    <span>{item.q}</span>
                    <span className="lp-faq__sign" aria-hidden />
                  </button>
                  <div className="lp-faq__answer" inert={!open}>
                    <div>
                      <p>{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- CTA */}
      <section className="lp-cta">
        <div className="lp-wrap">
          <div className="lp-cta__card" ref={ctaRef}>
            <div className="lp-cta__copy">
              <h2>Your next mock could be your best one.</h2>
              <p>
                Free to start. No card. Sit a timed paper tonight and see
                exactly where the marks went.
              </p>
              <div className="lp-hero__actions">
                <button type="button" className="lp-btn lp-btn--light" onClick={onLaunchCBT}>
                  Start a free mock <ArrowRight size={18} aria-hidden />
                </button>
                <button type="button" className="lp-btn lp-btn--ghost-light" onClick={onOpenSyllabus}>
                  Browse past questions
                </button>
              </div>
            </div>
            <img
              src={PHOTO.terminals}
              alt="Students in white school uniforms working at computers"
              width={1280}
              height={960}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Footer */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <BrandMark />
              <p>
                Exam practice and tutoring for Nigerian UTME and Post-UTME
                candidates. Built in Lagos.
              </p>
              <ul className="lp-footer__subjects">
                {SUBJECTS.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h4>{column.heading}</h4>
                <ul>
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <button type="button" onClick={() => runAction(item.action)}>
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="lp-footer__base">
            <span>&copy; 2026 i-Teacher</span>
            <span>
              <Flag size={14} aria-hidden /> Not affiliated with JAMB
            </span>
            <span className="lp-footer__credit">
              Photos: James Rhoda,{' '}
              <a
                href="https://commons.wikimedia.org/wiki/Category:Reading_Wikipedia_in_the_Classroom"
                target="_blank"
                rel="noreferrer"
              >
                Wikimedia Commons
              </a>
              , CC BY-SA 4.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePageView;
