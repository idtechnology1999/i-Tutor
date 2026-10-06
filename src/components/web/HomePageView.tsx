import React from 'react';
import { OwlBookLogo, ArrowRightIcon } from '../Icons';

interface HomePageViewProps {
  onLaunchCBT: () => void;
  onOpenSyllabus: () => void;
  onGoToDashboard: () => void;
  onOpenTutor: () => void;
}

/* Real photography, served from Unsplash's CDN.
   w/h are pinned to the slot's aspect ratio and the crop is chosen server-side
   (faces for people, entropy for still lifes) so nothing is centre-cropped in
   the browser and cut through the subject. */
const IMG = {
  hero: 'https://images.unsplash.com/photo-1564057600948-aff98f958d55',
  heroCrop: 'crop=faces',
  desk: 'https://images.unsplash.com/photo-1758708536050-e911f468ea83',
  deskCrop: 'crop=entropy',
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
  'Geography',
  'Agricultural Science',
  'Civic Education',
  'Computer Studies',
];

const ENTRIES = [
  {
    folio: '01',
    label: 'Question bank',
    title: 'Past questions, with the reasoning attached',
    body: 'Every English, Mathematics, Physics and Chemistry item is keyed against the official marking scheme, then annotated with the derivation a candidate needs to reproduce under exam conditions. Distractors are explained individually.',
    facts: [
      '2,400+ items, 2005\u20132024',
      'WAEC, NECO and UTME papers',
      'Solutions keyed to the official scheme',
    ],
    action: 'syllabus' as const,
    cta: 'Open the syllabus index',
  },
  {
    folio: '02',
    label: 'CBT hall',
    title: 'The terminal, reproduced',
    body: 'The same interface, the approved eight-key calculator and a hard two-hour clock. Answers are marked live so pacing errors surface in the mock rather than on the day.',
    facts: [
      '180 questions, 120 minutes',
      'Approved eight-key calculator',
      'Live marking with pace analysis',
    ],
    action: 'cbt' as const,
    cta: 'Launch a mock',
  },
];

const CUTOFFS = [
  ['University of Lagos', 'Medicine & Surgery', '280', 'Eng \u00b7 Bio \u00b7 Phy \u00b7 Chem'],
  ['University of Ibadan', 'Computer Science', '268', 'Eng \u00b7 Maths \u00b7 Phy \u00b7 Chem'],
  ['Obafemi Awolowo University', 'Law', '272', 'Eng \u00b7 Lit \u00b7 Gov \u00b7 CRS'],
  ['Ahmadu Bello University', 'Pharmaceutical Sciences', '265', 'Eng \u00b7 Bio \u00b7 Chem \u00b7 Phy'],
  ['Covenant University', 'Accounting & Finance', '255', 'Eng \u00b7 Maths \u00b7 Econs \u00b7 Comm'],
  ['University of Nigeria', 'Electrical Engineering', '258', 'Eng \u00b7 Maths \u00b7 Phy \u00b7 Chem'],
];

const FIGURES = [
  { value: 92.4, decimals: 1, suffix: '%', note: 'of candidates using i-Tutor scored 250+ or above at first sitting' },
  { value: 41, decimals: 0, prefix: '+', suffix: ' pts', note: 'median gain between first diagnostic and published result' },
  { value: 2005, decimals: 0, suffix: '', note: 'earliest year of verified past questions held in the bank' },
];

const QUOTE =
  'I scored 241 in 2024 and missed UNILAG Pharmacy. The physics drills showed me I was guessing at mechanics questions rather than solving them. In 2025 I scored 294.';

const QUOTE_ATTRIB = 'Chidera E. \u00b7 100L Medicine & Surgery, University of Lagos';

const STAND_POINTS = [
  'No account required to start a mock',
  'Cached for offline use after first load',
  'Syllabi aligned to the 2024\u20132026 WAEC scheme',
];

const COLOPHON_COLUMNS: Array<{ heading: string; items: string[]; action?: 'syllabus' | 'cbt' | 'tutor' | 'dashboard' }> = [
  {
    heading: 'Subjects',
    items: [
      'Use of English',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology & Life Sciences',
      'Economics & Commerce',
      'Government & Literature',
    ],
    action: 'syllabus',
  },
  {
    heading: 'Tools',
    items: [
      'CBT hall',
      'Eight-key calculator',
      'Study tutor',
      'Goal & streak tracker',
    ],
    action: 'cbt',
  },
  {
    heading: 'Assessments',
    items: [
      'WAEC theory',
      'WAEC alternative to practical',
      'NECO',
      'UTME',
      'Post-UTME',
    ],
    action: 'syllabus',
  },
  {
    heading: 'Platform',
    items: [
      'Student portal',
      'Offline mode',
      'Syllabus index',
      'Ask a question',
    ],
    action: 'dashboard',
  },
];

export const HomePageView: React.FC<HomePageViewProps> = ({
  onLaunchCBT,
  onOpenSyllabus,
  onGoToDashboard,
  onOpenTutor,
}) => {
  const runAction = (action?: 'syllabus' | 'cbt' | 'tutor' | 'dashboard') => {
    switch (action) {
      case 'syllabus':
        return onOpenSyllabus();
      case 'cbt':
        return onLaunchCBT();
      case 'tutor':
        return onOpenTutor();
      case 'dashboard':
        return onGoToDashboard();
      default:
        return undefined;
    }
  };

  return (
    <div className="broadsheet">
      {/* ===================================================================
          1. Masthead
          =================================================================== */}
      <section className="bs-masthead">
        <div className="container">
          <div className="bs-band">
            <span className="bs-band__left">WAEC &middot; NECO &middot; UTME &middot; Post-UTME</span>
            <span className="bs-band__right">Syllabi 2024&ndash;2026</span>
          </div>

          <div className="bs-masthead__body">
            <div className="bs-masthead__text">
              <h1 className="bs-headline" data-reveal>
                The tutor that shows you <em>why</em> the answer is right.
              </h1>

              <p className="bs-standfirst" data-reveal data-reveal-delay={70}>
                i-Tutor holds twenty years of verified WAEC, NECO and UTME
                papers with the marking scheme attached to each solution, a
                syllabus index ordered by topic, and a CBT hall built on the
                approved eight-key calculator.
              </p>

              <div className="bs-actions" data-reveal data-reveal-delay={130}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={onLaunchCBT}
                  id="hero-start-cbt-btn"
                >
                  Launch a CBT mock
                  <ArrowRightIcon size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={onLaunchCBT}
                  id="hero-diagnostic-btn"
                >
                  Run a mock test
                </button>
              </div>

              <ul className="bs-conditions">
                {STAND_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="bs-masthead__figure" data-reveal="scale" data-reveal-delay={60}>
              <figure className="bs-figure">
                <img
                  src={`${IMG.hero}?auto=format&fit=crop&${IMG.heroCrop}&w=1200&h=800&q=80`}
                  alt="A senior secondary student reading a textbook"
                  width={1200}
                  height={800}
                  fetchPriority="high"
                  decoding="async"
                />
                <figcaption className="bs-source">Photograph via Unsplash</figcaption>
              </figure>

              <div className="bs-datablock" data-reveal data-reveal-delay={220}>
                <div className="bs-datablock__row">
                  <span>Diagnostic score</span>
                  <b>241</b>
                </div>
                <div className="bs-meter" style={{ ['--fill' as string]: '48%' }}>
                  <i />
                </div>
                <div className="bs-datablock__row">
                  <span>After six weeks</span>
                  <b className="is-up">294</b>
                </div>
                <div className="bs-meter" style={{ ['--fill' as string]: '86%' }}>
                  <i />
                </div>
                <p className="bs-datablock__foot">
                  One candidate, two sittings, 2024 and 2025.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          2. Subject index strip
          =================================================================== */}
      <section className="bs-index">
        <div className="container">
          <p className="bs-index__label">Syllabus coverage</p>
          <ul className="bs-index__list">
            {SUBJECTS.map((subject) => (
              <li key={subject}>{subject}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================================================================
          3. What the app contains
          =================================================================== */}
      <section className="bs-section">
        <div className="container">
          <header className="bs-section__head">
            <span className="bs-folio" data-reveal>
              01
            </span>
            <div className="bs-section__titles" data-reveal data-reveal-delay={50}>
              <p className="bs-kicker">The application</p>
              <h2 className="bs-headline bs-headline--2">
                Three parts, built around the paper you sit.
              </h2>
            </div>
            <p className="bs-marginalia" data-reveal data-reveal-delay={100}>
              Nothing here is a generic quiz bank. Each part is keyed to a
              published WAEC or JAMB scheme of 2024&ndash;2026.
            </p>
          </header>

          <div className="bs-entries">
            {ENTRIES.map((entry, index) => (
              <article
                className="bs-entry"
                key={entry.folio}
                data-reveal
                data-reveal-delay={index * 70}
              >
                <div className="bs-entry__head">
                  <span className="bs-entry__folio">{entry.folio}</span>
                  <p className="bs-kicker">{entry.label}</p>
                  <h3 className="bs-entry__title">{entry.title}</h3>
                </div>
                <p className="bs-entry__text">{entry.body}</p>
                <div className="bs-entry__aside">
                  <ul className="bs-facts">
                    {entry.facts.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="bs-link"
                    onClick={() => runAction(entry.action)}
                  >
                    {entry.cta}
                    <ArrowRightIcon size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <figure className="bs-plate" data-reveal="scale">
            <img
              src={`${IMG.desk}?auto=format&fit=crop&${IMG.deskCrop}&w=1600&h=1000&q=80`}
              alt="A study desk laid out with textbooks, past question papers and a calculator"
              width={1600}
              height={1000}
              loading="lazy"
              decoding="async"
            />
            <figcaption className="bs-plate__caption">
              <span className="bs-plate__label">Plate I</span>
              <span>
                A candidate&rsquo;s desk: past question papers, the WAEC
                eight-key calculator and a marked scheme.
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ===================================================================
          4. Cut-off benchmarks
          =================================================================== */}
      <section className="bs-section bs-section--ruled">
        <div className="container">
          <header className="bs-section__head">
            <span className="bs-folio" data-reveal>
              02
            </span>
            <div className="bs-section__titles" data-reveal data-reveal-delay={50}>
              <p className="bs-kicker">Benchmarks</p>
              <h2 className="bs-headline bs-headline--2">
                Published merit thresholds, 2024&ndash;2025.
              </h2>
            </div>
            <p className="bs-marginalia" data-reveal data-reveal-delay={100}>
              Aggregate scores only. Subject requirements sit alongside and are
              not included in the figure.
            </p>
          </header>

          <div className="bs-table-wrap" data-reveal="scale">
            <table className="bs-table">
              <caption className="bs-table__caption">
                Table 1 &mdash; Departmental merit cut-offs
              </caption>
              <thead>
                <tr>
                  <th scope="col">Institution</th>
                  <th scope="col">Programme</th>
                  <th scope="col">Required subjects</th>
                  <th scope="col" className="bs-table__num">
                    Aggregate
                  </th>
                </tr>
              </thead>
              <tbody>
                {CUTOFFS.map((row) => (
                  <tr key={row[0] + row[1]}>
                    <td className="bs-table__strong">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td className="bs-table__muted">{row[3]}</td>
                    <td className="bs-table__num bs-table__strong">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. Recorded outcomes
          =================================================================== */}
      <section className="bs-section">
        <div className="container">
          <header className="bs-section__head">
            <span className="bs-folio" data-reveal>
              03
            </span>
            <div className="bs-section__titles" data-reveal data-reveal-delay={50}>
              <p className="bs-kicker">Outcomes</p>
              <h2 className="bs-headline bs-headline--2">
                What the recorded cohorts returned.
              </h2>
            </div>
          </header>

          <div className="bs-figures">
            {FIGURES.map((figure, index) => (
              <div
                className="bs-figure-stat"
                key={figure.note}
                data-reveal
                data-reveal-delay={index * 70}
              >
                <b
                  data-count={figure.value}
                  data-count-prefix={figure.prefix ?? ''}
                  data-count-suffix={figure.suffix}
                  data-count-decimals={figure.decimals}
                >
                  0{figure.suffix}
                </b>
                <span>{figure.note}</span>
              </div>
            ))}
          </div>

          <figure className="bs-pullquote" data-reveal>
            <blockquote>{QUOTE}</blockquote>
            <figcaption>{QUOTE_ATTRIB}</figcaption>
          </figure>
        </div>
      </section>

      {/* ===================================================================
          6. Start
          =================================================================== */}
      <section className="bs-stand">
        <div className="container bs-stand__inner">
          <div className="bs-stand__text">
            <p className="bs-kicker bs-kicker--invert">Begin</p>
            <h2 className="bs-headline bs-headline--2">
              Sit a mock before the real paper.
            </h2>
            <p className="bs-standfirst bs-standfirst--invert">
              It runs without an account: two hours, one hundred and eighty
              questions, and a marked paper that shows where the clock went.
            </p>
          </div>
          <div className="bs-stand__actions">
            <button type="button" className="btn btn--on-dark" onClick={onLaunchCBT}>
              Launch a CBT mock
              <ArrowRightIcon size={16} />
            </button>
            <button
              type="button"
              className="btn btn--ghost-dark"
              onClick={onOpenSyllabus}
            >
              Browse the syllabus
            </button>
            <button
              type="button"
              className="bs-stand__tertiary"
              onClick={onOpenTutor}
            >
              Or ask the study tutor a question
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================
          Colophon
          =================================================================== */}
      <footer className="bs-colophon">
        <div className="container">
          <div className="bs-colophon__grid">
            <div className="bs-colophon__brand">
              <span className="brand-mark">
                <OwlBookLogo size={36} plain />
              </span>
              <p className="bs-colophon__name">i-Tutor</p>
              <p className="bs-colophon__blurb">
                An independent study platform for Nigerian candidates. Verified
                past questions, annotated solutions and a CBT hall built to the
                examination terminal.
              </p>
            </div>

            {COLOPHON_COLUMNS.map((column) => (
              <nav key={column.heading} className="bs-colophon__col">
                <h4 className="bs-colophon__heading">{column.heading}</h4>
                <ul>
                  {column.items.map((item) => (
                    <li key={item}>
                      <button type="button" onClick={() => runAction(column.action)}>
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="bs-colophon__base">
            <span>&copy; 2026 i-Tutor</span>
            <span>Built in Nigeria</span>
            <span>Candidate data stored on device</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePageView;
