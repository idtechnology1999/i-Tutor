/* -----------------------------------------------------------------------------
   Syllabus for the personal classroom: topics per subject (following the JAMB
   / WAEC syllabus areas) and board lessons for the core topics. Topics without
   a written lesson get an outline until the live AI teacher is connected.
   Backend later: POST /api/classroom/lesson { subject, topic, level } returns
   the same shape as `Lesson`, written by the model.
   -------------------------------------------------------------------------- */

/** Board marker colours: title blue, formula black (boxed), example green,
    note red. `diagram` is drawn, `ask` stops the lesson for the student. */
export type BoardKind = 'title' | 'line' | 'formula' | 'example' | 'note' | 'diagram' | 'ask';

export interface BoardLine {
  kind: BoardKind;
  /** The words written (a diagram's caption; an ask line's question). */
  text: string;
  /** A formula as LaTeX, shown as real maths instead of `text`. */
  tex?: string;
  /** A diagram: one simple SVG, drawn stroke by stroke. */
  svg?: string;
  /** What the teacher says while writing this line (caption, and voice). */
  say?: string;
  /** An ask line: the choices, the right letter and why. */
  options?: { label: string; text: string }[];
  answer?: string;
  why?: string;
}

export interface LessonStep {
  /** What the teacher writes on the board. */
  board: BoardLine[];
  /** What the teacher says in the chat while writing. */
  say: string;
}

export interface LessonQuestion {
  question: string;
  options: { label: string; text: string }[];
  answer: string;
  why: string;
}

export interface Lesson {
  subject: string;
  topic: string;
  steps: LessonStep[];
  check: LessonQuestion;
}

export const SYLLABUS: Record<string, string[]> = {
  English: ['Concord', 'Word stress', 'Idioms and figurative language', 'Comprehension', 'Synonyms and antonyms', 'Vowel sounds'],
  Mathematics: ['Indices', 'Quadratic equations', 'Logarithms', 'Simultaneous equations', 'Probability', 'Matrices'],
  Physics: ['Motion in a straight line', "Ohm's law", 'Work, energy and power', 'Waves', 'Heat energy', 'Magnetism'],
  Chemistry: ['The mole concept', 'Isomerism', 'Chemical bonding', 'Acids, bases and salts', 'Electrolysis', 'Rates of reaction'],
  Biology: ['The cell', 'Photosynthesis', 'Genetics', 'Ecology', 'Respiration', 'Reproduction in plants'],
  Economics: ['Demand and supply', 'Elasticity', 'Money and banking', 'Production'],
  Government: ['Constitution', 'Arms of government', 'Federalism', 'Political parties'],
  Literature: ['Figures of speech', 'Drama', 'Prose', 'Poetry'],
  Geography: ['The solar system', 'Weather and climate', 'Rocks', 'Map reading'],
  Commerce: ['Trade', 'Banking', 'Insurance', 'Transport'],
  Accounting: ['Double entry', 'Trial balance', 'Final accounts', 'Bank reconciliation'],
  'Agricultural Science': ['Soil', 'Crop production', 'Animal husbandry', 'Farm tools'],
  'Further Mathematics': ['Binomial theorem', 'Vectors', 'Calculus'],
  CRS: ['Creation', 'The patriarchs', 'The early church'],
  IRS: ['The Qur’an', 'Hadith', 'Pillars of Islam'],
  'Civic Education': ['Values', 'Citizenship', 'Human rights'],
};

/** Profile subject names → syllabus names ("English Language" → "English"). */
export const syllabusSubject = (name: string) => (name === 'English Language' ? 'English' : name);

const L = (kind: BoardKind, text: string): BoardLine => ({ kind, text });

export const LESSONS: Lesson[] = [
  {
    subject: 'Physics',
    topic: 'Motion in a straight line',
    steps: [
      {
        say: 'Let’s start with the words JAMB uses for motion. I’m writing them on the board.',
        board: [
          { kind: 'title', text: 'Motion in a straight line', say: 'Today: motion in a straight line.' },
          { kind: 'line', text: 'u = initial velocity    v = final velocity', say: 'u is how fast it starts, v is how fast it ends.' },
          { kind: 'line', text: 'a = acceleration    t = time    s = distance' },
          { kind: 'note', text: 'From rest means u = 0', say: 'Watch out: “from rest” is JAMB’s way of telling you u is zero.' },
        ],
      },
      {
        say: 'Here is what steady acceleration looks like on a graph.',
        board: [
          {
            kind: 'diagram',
            text: 'Velocity–time graph: the slope is a, the area is s',
            say: 'The line climbs steadily. Its slope is the acceleration, and the area under it is the distance.',
            svg: '<svg viewBox="0 0 320 190" xmlns="http://www.w3.org/2000/svg"><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#1d3fb3"/></marker></defs><g stroke="#1d3fb3" stroke-width="2.5" fill="none"><line x1="40" y1="160" x2="300" y2="160" marker-end="url(#ah)"/><line x1="40" y1="160" x2="40" y2="20" marker-end="url(#ah)"/></g><polygon points="40,160 250,50 250,160" fill="#1d3fb3" fill-opacity="0.08" stroke="none"/><line x1="40" y1="160" x2="250" y2="50" stroke="#111" stroke-width="3"/><line x1="250" y1="50" x2="250" y2="160" stroke="#c0392b" stroke-width="2" stroke-dasharray="6 5"/><g font-size="15" fill="#111"><text x="292" y="180">t</text><text x="18" y="28">v</text><text x="150" y="140" fill="#1d3fb3">area = s</text><text x="120" y="88" fill="#c0392b">slope = a</text></g></svg>',
          },
        ],
      },
      {
        say: 'These three equations solve almost every motion question. Copy them down.',
        board: [
          { kind: 'formula', text: 'v = u + at', tex: 'v = u + at', say: 'One: v equals u plus a t.' },
          { kind: 'formula', text: 's = ut + ½at²', tex: 's = ut + \\tfrac{1}{2}at^2', say: 'Two: s equals u t plus half a t squared.' },
          { kind: 'formula', text: 'v² = u² + 2as', tex: 'v^2 = u^2 + 2as', say: 'Three: v squared equals u squared plus two a s.' },
          { kind: 'note', text: 'No time given? Use v² = u² + 2as', say: 'If the question gives no time, go straight to the third one.' },
          {
            kind: 'ask',
            text: 'A question gives u, a and s, but no t. Which equation do you use?',
            say: 'Your turn. Tap your answer on the board.',
            options: [
              { label: 'A', text: 'v = u + at' },
              { label: 'B', text: 's = ut + ½at²' },
              { label: 'C', text: 'v² = u² + 2as' },
            ],
            answer: 'C',
            why: 'Only v² = u² + 2as has no t in it.',
          },
        ],
      },
      {
        say: 'Now a worked example, step by step.',
        board: [
          { kind: 'example', text: 'A car starts from rest and reaches 20 m/s in 5 s. Find a.', say: 'Read it carefully: from rest, 20 metres per second, 5 seconds.' },
          { kind: 'line', text: 'u = 0,  v = 20,  t = 5', say: 'First, write down what we know.' },
          { kind: 'formula', text: '20 = 0 + 5a', tex: 'v = u + at \\;\\Rightarrow\\; 20 = 0 + 5a', say: 'We have v, u and t, so we use v equals u plus a t.' },
          { kind: 'formula', text: 'a = 4 m/s²', tex: 'a = \\dfrac{20}{5} = 4\\ \\text{m/s}^2', say: 'Divide both sides by 5. a is 4 metres per second squared.' },
        ],
      },
    ],
    check: {
      question: 'A body starts from rest with acceleration 2 m/s². How far does it go in 4 s?',
      options: [
        { label: 'A', text: '8 m' },
        { label: 'B', text: '16 m' },
        { label: 'C', text: '32 m' },
        { label: 'D', text: '4 m' },
      ],
      answer: 'B',
      why: 's = ut + ½at² = 0 + ½ × 2 × 4² = 16 m.',
    },
  },
  {
    subject: 'Physics',
    topic: "Ohm's law",
    steps: [
      {
        say: 'Ohm’s law links voltage, current and resistance.',
        board: [
          { kind: 'title', text: "Ohm's law" },
          { kind: 'formula', text: 'V = IR', tex: 'V = IR', say: 'V equals I times R. Learn this one by heart.' },
          { kind: 'line', text: 'V = voltage (volts, V)' },
          { kind: 'line', text: 'I = current (amperes, A)' },
          { kind: 'line', text: 'R = resistance (ohms, Ω)' },
        ],
      },
      {
        say: 'Resistors in series sit on one path. In parallel, each has its own path.',
        board: [
          {
            kind: 'diagram',
            text: 'Two resistors in parallel between A and B',
            say: 'Look at the two paths. Current can split and take either one.',
            svg: '<svg viewBox="0 0 320 150" xmlns="http://www.w3.org/2000/svg"><g stroke="#111" stroke-width="2.5" fill="none"><line x1="20" y1="75" x2="60" y2="75"/><line x1="60" y1="30" x2="60" y2="120"/><line x1="260" y1="30" x2="260" y2="120"/><line x1="260" y1="75" x2="300" y2="75"/><line x1="60" y1="30" x2="125" y2="30"/><rect x="125" y="18" width="70" height="24"/><line x1="195" y1="30" x2="260" y2="30"/><line x1="60" y1="120" x2="125" y2="120"/><rect x="125" y="108" width="70" height="24"/><line x1="195" y1="120" x2="260" y2="120"/></g><g font-size="15" fill="#1d3fb3" text-anchor="middle"><text x="160" y="12">R₁</text><text x="160" y="102">R₂</text><text x="12" y="70">A</text><text x="308" y="70">B</text></g></svg>',
          },
          { kind: 'formula', text: 'Series: R = R₁ + R₂', tex: '\\text{Series: } R = R_1 + R_2', say: 'In series, just add them.' },
          { kind: 'formula', text: 'Parallel: 1/R = 1/R₁ + 1/R₂', tex: '\\text{Parallel: } \\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}', say: 'In parallel, add the reciprocals, then flip.' },
          {
            kind: 'ask',
            text: 'Two 2 Ω resistors in parallel. What is the total?',
            say: 'Try this one before I show you.',
            options: [
              { label: 'A', text: '4 Ω' },
              { label: 'B', text: '1 Ω' },
              { label: 'C', text: '2 Ω' },
            ],
            answer: 'B',
            why: '1/R = ½ + ½ = 1, so R = 1 Ω. Parallel is always smaller than the smallest one.',
          },
        ],
      },
    ],
    check: {
      question: 'A 12 V battery is connected across a 4 Ω resistor. What current flows?',
      options: [
        { label: 'A', text: '48 A' },
        { label: 'B', text: '0.33 A' },
        { label: 'C', text: '3 A' },
        { label: 'D', text: '8 A' },
      ],
      answer: 'C',
      why: 'I = V / R = 12 / 4 = 3 A.',
    },
  },
  {
    subject: 'Mathematics',
    topic: 'Quadratic equations',
    steps: [
      {
        say: 'A quadratic has x² as its highest power. We’ll solve by factorising.',
        board: [
          L('title', 'Quadratic equations'),
          L('formula', 'ax² + bx + c = 0'),
          L('note', 'Find two numbers that multiply to c and add to b'),
        ],
      },
      {
        say: 'Watch me solve one.',
        board: [
          L('example', 'Solve x² − 5x + 6 = 0'),
          L('line', 'Multiply to 6, add to −5  →  −2 and −3'),
          L('line', '(x − 2)(x − 3) = 0'),
          L('formula', 'x = 2  or  x = 3'),
        ],
      },
      {
        say: 'If it won’t factorise, use the formula.',
        board: [L('formula', 'x = (−b ± √(b² − 4ac)) / 2a'), L('note', 'b² − 4ac < 0 means no real roots')],
      },
    ],
    check: {
      question: 'Solve x² − 7x + 12 = 0.',
      options: [
        { label: 'A', text: 'x = 3 or 4' },
        { label: 'B', text: 'x = −3 or −4' },
        { label: 'C', text: 'x = 2 or 6' },
        { label: 'D', text: 'x = 1 or 12' },
      ],
      answer: 'A',
      why: '3 × 4 = 12 and 3 + 4 = 7, so (x − 3)(x − 4) = 0.',
    },
  },
  {
    subject: 'Mathematics',
    topic: 'Indices',
    steps: [
      {
        say: 'Indices have a few laws. Learn these and the questions become easy.',
        board: [
          L('title', 'Laws of indices'),
          L('formula', 'aᵐ × aⁿ = aᵐ⁺ⁿ'),
          L('formula', 'aᵐ ÷ aⁿ = aᵐ⁻ⁿ'),
          L('formula', '(aᵐ)ⁿ = aᵐⁿ'),
          L('formula', 'a⁰ = 1      a⁻ⁿ = 1/aⁿ'),
        ],
      },
      {
        say: 'An example using two of the laws.',
        board: [L('example', 'Simplify 2³ × 2⁴ ÷ 2⁵'), L('line', '= 2³⁺⁴⁻⁵'), L('formula', '= 2² = 4')],
      },
    ],
    check: {
      question: 'Simplify 3⁴ ÷ 3².',
      options: [
        { label: 'A', text: '3' },
        { label: 'B', text: '9' },
        { label: 'C', text: '27' },
        { label: 'D', text: '81' },
      ],
      answer: 'B',
      why: '3⁴ ÷ 3² = 3⁴⁻² = 3² = 9.',
    },
  },
  {
    subject: 'Chemistry',
    topic: 'The mole concept',
    steps: [
      {
        say: 'A mole is just a counting unit, like a dozen — but much bigger.',
        board: [
          L('title', 'The mole concept'),
          L('line', '1 mole = 6.02 × 10²³ particles (Avogadro’s number)'),
          L('formula', 'moles = mass ÷ molar mass'),
        ],
      },
      {
        say: 'Here’s a worked example.',
        board: [
          L('example', 'How many moles are in 36 g of water? (H = 1, O = 16)'),
          L('line', 'Molar mass of H₂O = 2(1) + 16 = 18 g/mol'),
          L('formula', 'moles = 36 ÷ 18 = 2 mol'),
        ],
      },
    ],
    check: {
      question: 'How many moles are in 22 g of CO₂? (C = 12, O = 16)',
      options: [
        { label: 'A', text: '0.5 mol' },
        { label: 'B', text: '2 mol' },
        { label: 'C', text: '1 mol' },
        { label: 'D', text: '0.25 mol' },
      ],
      answer: 'A',
      why: 'Molar mass of CO₂ = 12 + 32 = 44, and 22 ÷ 44 = 0.5 mol.',
    },
  },
  {
    subject: 'Chemistry',
    topic: 'Isomerism',
    steps: [
      {
        say: 'Isomers have the same molecular formula but a different structure.',
        board: [
          L('title', 'Isomerism'),
          L('line', 'Same molecular formula, different structure'),
          L('example', 'C₂H₆O:  ethanol C₂H₅OH  and  methoxymethane CH₃OCH₃'),
        ],
      },
      {
        say: 'There are a few kinds JAMB likes to ask about.',
        board: [
          L('line', 'Chain isomers — different carbon chain (butane, 2-methylpropane)'),
          L('line', 'Position isomers — group in a different position'),
          L('line', 'Functional group isomers — different group (alcohol vs ether)'),
          L('note', 'Ethanol boils higher: it forms hydrogen bonds'),
        ],
      },
    ],
    check: {
      question: 'Butane and 2-methylpropane are examples of…',
      options: [
        { label: 'A', text: 'functional group isomers' },
        { label: 'B', text: 'chain isomers' },
        { label: 'C', text: 'position isomers' },
        { label: 'D', text: 'allotropes' },
      ],
      answer: 'B',
      why: 'Same formula C₄H₁₀, but the carbon chain is arranged differently.',
    },
  },
  {
    subject: 'English',
    topic: 'Concord',
    steps: [
      {
        say: 'Concord means the subject and verb must agree.',
        board: [
          L('title', 'Concord (subject–verb agreement)'),
          L('line', 'Singular subject → singular verb:  The boy runs.'),
          L('line', 'Plural subject → plural verb:  The boys run.'),
        ],
      },
      {
        say: 'These are the traps examiners love.',
        board: [
          L('line', 'Each / Every / Everyone → singular:  Each of the boys is here.'),
          L('line', 'Neither … nor → verb agrees with the nearer subject'),
          L('example', 'Neither the teacher nor the students were late.'),
          L('note', '“The number of” → singular;  “A number of” → plural'),
        ],
      },
    ],
    check: {
      question: 'Each of the students ___ a textbook.',
      options: [
        { label: 'A', text: 'have' },
        { label: 'B', text: 'are having' },
        { label: 'C', text: 'has' },
        { label: 'D', text: 'were having' },
      ],
      answer: 'C',
      why: '“Each” is singular, so it takes the singular verb “has”.',
    },
  },
  {
    subject: 'English',
    topic: 'Word stress',
    steps: [
      {
        say: 'Stress is the syllable we say loudest.',
        board: [
          L('title', 'Word stress'),
          L('line', 'Two-syllable nouns: stress the 1st  →  PREsent, REcord'),
          L('line', 'Two-syllable verbs: stress the 2nd  →  preSENT, reCORD'),
        ],
      },
      {
        say: 'Words ending in -tion and -ic are easy to spot.',
        board: [
          L('line', '-tion: stress just before it  →  eduCAtion'),
          L('line', '-ic: stress just before it  →  ecoNOmic'),
        ],
      },
    ],
    check: {
      question: 'Which word is stressed on the second syllable?',
      options: [
        { label: 'A', text: 'TAble' },
        { label: 'B', text: 'beGIN' },
        { label: 'C', text: 'WAter' },
        { label: 'D', text: 'MOther' },
      ],
      answer: 'B',
      why: '“Begin” is a verb, stressed on the second syllable: be-GIN.',
    },
  },
  {
    subject: 'Biology',
    topic: 'The cell',
    steps: [
      {
        say: 'The cell is the basic unit of life.',
        board: [
          L('title', 'The cell'),
          L('line', 'Nucleus — controls the cell, holds DNA'),
          L('line', 'Mitochondria — releases energy (respiration)'),
          L('line', 'Cell membrane — controls what enters and leaves'),
        ],
      },
      {
        say: 'Plant cells have three extra parts.',
        board: [
          L('line', 'Cell wall (cellulose) — support'),
          L('line', 'Chloroplasts — photosynthesis'),
          L('line', 'Large vacuole — stores cell sap'),
          L('note', 'Animal cells have no cell wall'),
        ],
      },
    ],
    check: {
      question: 'Which part is found in plant cells but not animal cells?',
      options: [
        { label: 'A', text: 'Nucleus' },
        { label: 'B', text: 'Mitochondrion' },
        { label: 'C', text: 'Cell wall' },
        { label: 'D', text: 'Cell membrane' },
      ],
      answer: 'C',
      why: 'Only plant cells have a cellulose cell wall.',
    },
  },
];

export const lessonFor = (subject: string, topic: string) =>
  LESSONS.find((l) => l.subject === subject && l.topic.toLowerCase() === topic.toLowerCase());

/** A topic without a written lesson: an honest outline for the board. */
export const outlineFor = (subject: string, topic: string): Lesson => ({
  subject,
  topic,
  steps: [
    {
      say: `Here’s the outline for ${topic}. The full lesson for this topic arrives when the live AI teacher is switched on.`,
      board: [
        L('title', topic),
        L('line', `Subject: ${subject}`),
        L('line', '1. Key terms and definitions'),
        L('line', '2. Rules and formulas'),
        L('line', '3. Worked examples'),
        L('line', '4. Past questions'),
      ],
    },
  ],
  check: {
    question: '',
    options: [],
    answer: '',
    why: '',
  },
});
