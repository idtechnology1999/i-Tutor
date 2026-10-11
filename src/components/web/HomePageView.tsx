import React, { useEffect, useRef, useState } from 'react';
import { useScrollProgress } from '../../lib/ui';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  Calculator,
  ChartNoAxesColumnIncreasing,
  Check,
  CircleHelp,
  Flag,
  GraduationCap,
  Landmark,
  Lightbulb,
  MessageSquareText,
  PenLine,
  Target,
  UserRoundPlus,
  WifiOff,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { CbtPreview, TutorPreview } from './ProductPreviews';
import { ServiceSection } from './ServiceSection';
import { publicTeam } from '../../services/team';
import type { TeamMember } from '../../services/admin';
import { NIGERIAN_INSTITUTIONS } from '../../data/nigerian-curriculum';
import { SSCE_CLASSES } from '../../data/courses';
import { NewsSection } from './NewsSection';

interface HomePageViewProps {
  onLaunchCBT: () => void;
  onOpenSyllabus: () => void;
  onGoToDashboard: () => void;
  onOpenTutor: () => void;
  onUpgrade?: () => void;
}

/* Real photographs of Nigerian secondary-school students in a CBT lab, by
   James Rhoda on Wikimedia Commons (CC BY-SA 4.0). Served from /public so the
   hero is not waiting on a third-party CDN. */
const PHOTO = {
  hero: '/images/student-cbt-focus.jpg',
  tutor: '/images/teacher-guiding.jpg',
  terminals: '/images/students-at-terminals.jpg',
};

/* "Try it now": one question per stream, so Arts and Commercial students see
   their own subjects too. Only the Physics one is from a real paper; the rest
   are written by i-Tutor and labelled that way. */
const SAMPLES = [
  {
    tab: 'Physics',
    stream: 'Science',
    verified: true,
    meta: 'Physics · UTME 2019 · Q14',
    stem: 'A car accelerates uniformly from rest and covers 100 m in 10 s. What is its acceleration?',
    options: ['1.0 m/s²', '2.0 m/s²', '5.0 m/s²', '10.0 m/s²'],
    answer: 1,
    wrong:
      'Not quite. Which equation links distance, time and acceleration when the car starts from rest? Try writing s = ut + ½at² with u = 0.',
    right:
      'Correct. With u = 0, s = ½at², so 100 = ½ × a × 10², which gives a = 2 m/s². You worked it out — that is the point.',
  },
  {
    tab: 'English',
    stream: 'All students',
    verified: false,
    meta: 'English · Lexis and structure',
    stem: 'Choose the option nearest in meaning to the word in capitals: The chairman’s reply was TERSE.',
    options: ['long and detailed', 'brief and abrupt', 'polite and warm', 'loud and angry'],
    answer: 1,
    wrong: 'Not quite. Picture a terse text message — does it use many words or very few? Now look at the options again.',
    right: 'Correct. Terse means using very few words, often in a way that sounds abrupt. Watch for it in comprehension passages too.',
  },
  {
    tab: 'Economics',
    stream: 'Commercial',
    verified: false,
    meta: 'Economics · Demand and supply',
    stem: 'When the price of a good rises and, other things being equal, the quantity demanded falls, this illustrates the',
    options: ['law of supply', 'law of demand', 'law of diminishing returns', 'equilibrium price'],
    answer: 1,
    wrong: 'Not quite. The question is about buyers reacting to a price change. Which law describes what buyers do?',
    right: 'Correct. The law of demand: as price rises, quantity demanded falls, ceteris paribus (other things being equal).',
  },
  {
    tab: 'Government',
    stream: 'Arts',
    verified: false,
    meta: 'Government · Political theories',
    stem: 'The doctrine of separation of powers is most closely associated with',
    options: ['John Locke', 'Baron de Montesquieu', 'A. V. Dicey', 'Jean-Jacques Rousseau'],
    answer: 1,
    wrong: 'Not quite. Think of the French writer of “The Spirit of the Laws” (1748). Dicey is the name to remember for the rule of law.',
    right: 'Correct. Montesquieu set out separation of powers in “The Spirit of the Laws” (1748): legislature, executive and judiciary kept apart.',
  },
] as const;

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
    body: 'JAMB, WAEC, NECO, GCE or Post-UTME — pick your exams, subjects and target course.',
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
    body: 'Transcribed from an official JAMB, WAEC, NECO or institutional paper and checked by two subject teachers before it goes live.',
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
    label: 'i-Tutor Practice Question',
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
    a: 'From official JAMB, WAEC, NECO and institutional papers. Each one is transcribed, then checked by two independent subject teachers. You can see the year and source on every question.',
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
  const [which, setWhich] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const sample = SAMPLES[which];
  const isRight = picked === sample.answer;

  return (
    <div
      className={`lp-sample${picked === null ? '' : isRight ? ' is-solved' : ' is-missed'}`}
      aria-live="polite"
    >
      <div className="lp-sample__tabs" role="tablist" aria-label="Choose a subject">
        {SAMPLES.map((q, i) => (
          <button
            key={q.tab}
            type="button"
            role="tab"
            aria-selected={i === which}
            className={i === which ? 'is-on' : ''}
            onClick={() => {
              setWhich(i);
              setPicked(null);
            }}
          >
            {q.tab}
            <small>{q.stream}</small>
          </button>
        ))}
      </div>

      <div className="lp-sample__bar">
        {sample.verified ? (
          <span className="lp-badge lp-badge--green">
            <BadgeCheck size={14} aria-hidden />
            Verified Past Question
          </span>
        ) : (
          <span className="lp-badge lp-badge--amber">
            <PenLine size={14} aria-hidden />
            i-Tutor Practice Question
          </span>
        )}
        <span className="lp-sample__meta">{sample.meta}</span>
      </div>

      <p className="lp-sample__stem">{sample.stem}</p>

      <div className="lp-sample__options" role="radiogroup" aria-label="Answer options">
        {sample.options.map((option, index) => {
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
        <div key={`${which}-${picked}`} className={`lp-sample__nudge ${isRight ? 'is-right' : ''}`}>
          <MessageSquareText size={18} aria-hidden />
          <div>
            <strong>{isRight ? 'Nice work' : 'Tutor hint'}</strong>
            <p>{isRight ? sample.right : sample.wrong}</p>
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

/* "Meet the team": shown only once the admin has added someone. */
const TeamSection: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    publicTeam()
      .then(setTeam)
      .catch(() => setTeam([]));
  }, []);

  if (!team.length) return null;

  return (
    <section className="lp-section" id="team">
      <div className="lp-wrap lp-panel lp-panel--mist">
        <span className="lp-deco lp-deco--steps-b" aria-hidden />
        <div className="lp-carve-head">
          <p className="lp-kicker">Meet the team</p>
          <h2 className="lp-h2">
            The people behind <span>i-Tutor.</span>
          </h2>
        </div>
        <ul className="lp-team">
          {team.map((m) => (
            <li key={m.id}>
              <span className="lp-team__photo">
                {m.image ? (
                  <img src={m.image} alt={m.fullName} loading="lazy" />
                ) : (
                  <b aria-hidden>
                    {m.fullName
                      .split(' ')
                      .map((w) => w.charAt(0))
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </b>
                )}
              </span>
              <strong>{m.fullName}</strong>
              <small>{m.role}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export const HomePageView: React.FC<HomePageViewProps> = ({
  onLaunchCBT,
  onOpenSyllabus,
  onGoToDashboard,
  onOpenTutor,
  onUpgrade,
}) => {
  const [openFaq, setOpenFaq] = useState(0);
  const ctaRef = useRef<HTMLDivElement>(null);
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
      {/* A wide photo with the headline on a white panel cut into its
          bottom-left corner; a stat and the main action sit bottom-right. */}
      <section className="lp-hero lp-hero--banner">
        <div className="lp-banner">
          <div className="lp-banner__media" data-reveal="scale">
            <img
              src={PHOTO.hero}
              alt="A secondary-school student working at a computer in a school CBT lab"
              width={1280}
              height={960}
              fetchPriority="high"
              decoding="async"
            />

            {/* A white block carved into the photo's top-right corner. */}
            <div className="lp-carve-corner" aria-hidden>
              <span className="lp-hero__score-label">Mock score</span>
              <span className="lp-hero__score-value">
                268<small>/400</small>
              </span>
              <span className="lp-hero__score-delta">+34 since last week</span>
            </div>

            <div className="lp-banner__join">
              <span className="lp-banner__pill">2,400+ verified past questions</span>
              <div className="lp-banner__actions">
                <a className="lp-btn lp-banner__glass" href="#sample">
                  Try a question first
                </a>
                <button type="button" className="lp-btn lp-btn--primary" onClick={onLaunchCBT}>
                  Start a free mock
                  <ArrowRight size={18} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <div className="lp-banner__panel">
            {/* A step rising from the panel, so its top edge is a stair. */}
            <div className="lp-carve-step">
              <span className="lp-carve-step__tag">
                <span className="lp-eyebrow__dot" aria-hidden />
                JAMB UTME · 2026/27 cycle
              </span>
            </div>
            <h1 className="lp-hero__title" data-reveal data-reveal-delay={60}>
              Practise the real CBT.
              <br />
              <span>Understand every answer.</span>
            </h1>
            <p className="lp-hero__lead" data-reveal data-reveal-delay={120}>
              Verified JAMB past questions, timed mock exams like the hall, and a tutor that walks you to the answer.
            </p>
            {/* On phones the buttons can't sit on the photo, so they come here. */}
            <div className="lp-hero__actions lp-banner__mobile-cta">
              <button type="button" className="lp-btn lp-btn--primary" onClick={onLaunchCBT}>
                Start a free mock
                <ArrowRight size={18} aria-hidden />
              </button>
              <a className="lp-btn lp-btn--quiet" href="#sample">
                Try a question first
              </a>
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
            <b>100%</b>
            <span>works offline once downloaded</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Showcase */}
      {/* A wide photo carved by stepped white blocks: the heading steps down
          from the top-left, and the benefits sit in a block at bottom-right. */}
      <section className="lp-showcase-carve" aria-labelledby="showcase-title">
        <div className="lp-carve-photo">
          <img
            src="/images/students-laptops.jpg"
            alt="Four young students with laptops, smiling and taking a selfie on red-and-white steps"
            width={1600}
            height={1200}
            loading="lazy"
            decoding="async"
          />

          <div className="lp-carve-tl">
            <p className="lp-kicker">Why students choose i-Tutor</p>
            <h2 className="lp-h2" id="showcase-title">
              Study smarter. <span>Score higher.</span>
            </h2>
            <div className="lp-carve-tl lp-carve-tl--step">
              <p className="lp-carve-text">
                Practice that feels like the real hall, and a tutor that’s there at midnight before your exam.
              </p>
            </div>
          </div>

          <div className="lp-carve-br">
            <ul className="lp-carve-chips">
              <li>
                <ChartNoAxesColumnIncreasing size={16} aria-hidden /> Real CBT practice
              </li>
              <li>
                <MessageSquareText size={16} aria-hidden /> AI tutor, any time
              </li>
              <li>
                <WifiOff size={16} aria-hidden /> Works offline
              </li>
            </ul>
            <button type="button" className="lp-btn lp-btn--primary" onClick={onLaunchCBT}>
              Start free
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </div>
        <p className="lp-photo-credit">Photo: Iwaria Inc. on Unsplash</p>
      </section>

      {/* ------------------------------------------------ Services, one each */}
      <ServiceSection
        id="post-utme"
        kicker="Post-UTME"
        title={
          <>
            Your school’s screening, <span>sorted.</span>
          </>
        }
        lead="Every university sets its own screening test. Tell us your school and we’ll show you its past questions and timed practice."
        points={['Your school’s own past questions', 'Timed practice before screening day', 'The AI tutor explains every answer']}
        panel="orange"
        deco="steps-b"
        cta="Choose your school"
        onCta={onGoToDashboard}
      >
        <div className="lp-svc-card">
          <p className="lp-svc-card__title">Pick your school</p>
          <ul className="lp-svc-schools">
            {NIGERIAN_INSTITUTIONS.slice(0, 5).map((u) => (
              <li key={u.id}>
                <b>{u.shortName}</b>
                <span>
                  {u.name}
                  <small>{u.location}</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="lp-svc-card__more">+ {NIGERIAN_INSTITUTIONS.length - 5} more universities</p>
        </div>
      </ServiceSection>

      <ServiceSection
        id="waec"
        kicker="WAEC (WASSCE)"
        title={
          <>
            WAEC, one subject <span>at a time.</span>
          </>
        }
        lead="Your final secondary school exam. Choose your class and the subjects you’ll sit, and practise them all in one place."
        when="School candidates: May/June · Private candidates: Nov/Dec"
        points={['Practice for every subject you’ll sit', 'WAEC past questions with explanations', 'Ask the AI tutor about any question']}
        panel="ink"
        deco="steps-c"
        flip
        cta="Start WAEC practice"
        onCta={onGoToDashboard}
      >
        <div className="lp-svc-classes">
          {SSCE_CLASSES.map((c) => (
            <div key={c.name} className="lp-svc-class">
              <p className="lp-svc-class__name">{c.name}</p>
              <ul>
                {c.subjects
                  .filter((sub) => sub !== 'English' && sub !== 'Mathematics' && sub !== 'Civic Education')
                  .slice(0, 4)
                  .map((sub) => (
                    <li key={sub}>{sub}</li>
                  ))}
              </ul>
            </div>
          ))}
          <p className="lp-svc-classes__note">English and Mathematics for every class</p>
        </div>
      </ServiceSection>

      <ServiceSection
        id="neco"
        kicker="NECO (SSCE)"
        title={
          <>
            NECO practice, <span>ready when you are.</span>
          </>
        }
        lead="The national senior school certificate exam. Set your class and subjects once, and your NECO practice room is ready."
        when="School candidates: June/July · Private candidates: Nov/Dec"
        points={['A practice room for your class', 'Past questions by subject and year', 'Hints first, then worked answers']}
        panel="mist"
        deco="steps-a"
        cta="Start NECO practice"
        onCta={onGoToDashboard}
      >
        <div className="lp-svc-card lp-svc-room">
          <p className="lp-svc-card__title">Your NECO room</p>
          <div className="lp-svc-room__tabs" aria-hidden>
            <span className="is-on">Science</span>
            <span>Arts</span>
            <span>Commercial</span>
          </div>
          <div className="lp-svc-room__windows">
            <div>
              <small>School candidates</small>
              <b>June / July</b>
            </div>
            <div>
              <small>Private candidates</small>
              <b>Nov / Dec</b>
            </div>
          </div>
          <span className="lp-svc-room__start" aria-hidden>
            Start NECO practice
          </span>
        </div>
      </ServiceSection>

      <ServiceSection
        id="gce"
        kicker="GCE"
        title={
          <>
            Resitting? <span>Make it count.</span>
          </>
        }
        lead="WAEC or NECO for private candidates, usually to improve a result. Focus on the subjects you need and practise until you’re ready."
        when="WAEC GCE and NECO GCE, usually Nov/Dec"
        points={['Practise only the subjects you’re resitting', 'See your weak topics after each session', 'A tutor that never makes you feel slow']}
        panel="orange-solid"
        deco="steps-b"
        flip
        cta="Plan my GCE"
        onCta={onGoToDashboard}
      >
        <ol className="lp-svc-steps">
          <li>
            <b>1</b>
            <span>
              Pick the subjects to improve
              <small>Only the ones you need</small>
            </span>
          </li>
          <li>
            <b>2</b>
            <span>
              Practise past questions
              <small>Timed, like the real paper</small>
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              Fix what you got wrong
              <small>The tutor walks you through it</small>
            </span>
          </li>
        </ol>
      </ServiceSection>

      <ServiceSection
        id="nabteb"
        kicker="NABTEB"
        title={
          <>
            For <span>technical and business</span> students.
          </>
        }
        lead="National Business and Technical Examinations Board certificate exams. Practise your subjects and get help from the AI tutor."
        when="May/June and Nov/Dec series"
        points={['Practice built around your subjects', 'Past questions as they are added', 'Study offline once downloaded']}
        panel="orange"
        deco="steps-c"
        cta="Start NABTEB practice"
        onCta={onGoToDashboard}
      >
        <div className="lp-svc-series">
          <div className="lp-svc-series__item">
            <b>May / June</b>
            <span>series</span>
          </div>
          <div className="lp-svc-series__item lp-svc-series__item--alt">
            <b>Nov / Dec</b>
            <span>series</span>
          </div>
          <div className="lp-svc-series__wide">
            <BookOpenCheck size={20} aria-hidden /> Business and technical subjects, practised your way
          </div>
        </div>
      </ServiceSection>

      {/* ------------------------------------------------------ Sample question */}
      <section className="lp-section" id="sample">
        <div className="lp-wrap lp-panel lp-panel--mist lp-split">
          <span className="lp-deco lp-deco--steps-b" aria-hidden />
          <div className="lp-split__copy">
            <div className="lp-carve-head">
              <p className="lp-kicker" data-reveal>
                Try it now
              </p>
              <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
                Get it wrong here.
                <br />
                Not in the hall.
              </h2>
            </div>
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              Science, Arts or Commercial &mdash; pick your subject and an answer. If you
              miss it, i-Tutor doesn&rsquo;t just show the key &mdash; it asks
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

          <article className="lp-showcase">
            <div className="lp-showcase__copy">
              <div data-reveal>
                <span className="lp-feature__icon">
                  <GraduationCap size={22} aria-hidden />
                </span>
                <h3>A CBT that feels like the real one</h3>
                <p>
                  Same layout as the JAMB screen: subject tabs, a hard
                  countdown, the question navigator, flagging and the on-screen
                  calculator. Go on &mdash; click around.
                </p>
              </div>
              <div data-reveal data-reveal-delay={80}>
                <ul className="lp-ticks">
                  <li>
                    <Check size={16} aria-hidden /> Full four-subject mocks or 20-question topic tests
                  </li>
                  <li>
                    <Calculator size={16} aria-hidden /> Keyboard shortcuts: A–D, N, P, F
                  </li>
                  <li>
                    <Check size={16} aria-hidden /> Auto-submit, then a full scorecard and review
                  </li>
                </ul>
                <button type="button" className="lp-link" onClick={onLaunchCBT}>
                  Start a mock exam <ArrowRight size={16} aria-hidden />
                </button>
              </div>
            </div>
            <div className="lp-showcase__frame" data-reveal="scale" data-reveal-delay={60}>
              <CbtPreview />
            </div>
          </article>

          <article className="lp-feature lp-feature--flip">
            <figure className="lp-feature__media lp-feature__media--stage" data-reveal="scale">
              <img
                src={PHOTO.tutor}
                alt="A teacher explaining something on a computer screen to a group of students"
                width={1280}
                height={960}
                loading="lazy"
                decoding="async"
              />
              <TutorPreview />
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
        <div className="lp-wrap lp-panel lp-panel--orange-solid">
          <span className="lp-deco lp-deco--steps-a" aria-hidden />
          <header className="lp-head">
            <div className="lp-carve-head">
              <p className="lp-kicker" data-reveal>
                How it works
              </p>
              <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
                From sign-up to your first mock in under five minutes.
              </h2>
            </div>
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
        <div className="lp-wrap lp-panel lp-panel--ink">
          <span className="lp-deco lp-deco--steps-c" aria-hidden />
          <header className="lp-head lp-head--split">
            <div>
              <div className="lp-carve-head">
                <p className="lp-kicker" data-reveal>
                  Content you can trust
                </p>
                <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
                  Every question tells you where it came from.
                </h2>
              </div>
            </div>
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              Exam season is full of rumours and fake &ldquo;expo&rdquo;. On
              i-Tutor, one of three labels sits on every question and update,
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
        <div className="lp-wrap lp-panel lp-panel--mist lp-split lp-split--wide">
          <span className="lp-deco lp-deco--steps-b" aria-hidden />
          <div className="lp-split__copy">
            <div className="lp-carve-head">
              <p className="lp-kicker" data-reveal>
                Admissions
              </p>
              <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
                Know the score you&rsquo;re aiming for.
              </h2>
            </div>
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              Departmental cut-offs from the last admission cycle. Set your
              target course and i-Tutor tracks how close your mock scores are.
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
              <button
                type="button"
                className="lp-btn lp-btn--primary lp-btn--block"
                onClick={onUpgrade ?? onGoToDashboard}
              >
                Get Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      <TeamSection />

      {/* ----------------------------------------------------------------- FAQ */}
      <section className="lp-section" id="faq">
        <div className="lp-wrap lp-panel lp-panel--orange lp-faq">
          <span className="lp-deco lp-deco--steps-c" aria-hidden />
          <header>
            <div className="lp-carve-head">
              <p className="lp-kicker" data-reveal>
                Questions
              </p>
              <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
                Things students ask us.
              </h2>
            </div>
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              Still unsure? Open the tutor and ask &mdash; it can answer
              questions about i-Tutor too.
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

      {/* ---------------------------------------------------------------- News */}
      <NewsSection />

      {/* -------------------------------------------------------------- Footer */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <BrandMark />
              <p>
                Exam practice and tutoring for JAMB, WAEC, NECO, GCE, NABTEB
                and Post-UTME candidates. Built in Lagos.
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
            <span>&copy; 2026 i-Tutor</span>
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
