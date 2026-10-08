/* -----------------------------------------------------------------------------
   Syllabus for the personal classroom: topics per subject (following the JAMB
   / WAEC syllabus areas) and board lessons for the core topics. Topics without
   a written lesson get an outline until the live AI teacher is connected.
   Backend later: POST /api/classroom/lesson { subject, topic, level } returns
   the same shape as `Lesson`, written by the model.
   -------------------------------------------------------------------------- */

export type BoardKind = 'title' | 'line' | 'formula' | 'example' | 'note';

export interface BoardLine {
  kind: BoardKind;
  text: string;
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
          L('title', 'Motion in a straight line'),
          L('line', 'u = initial velocity    v = final velocity'),
          L('line', 'a = acceleration    t = time    s = distance'),
          L('note', 'From rest means u = 0'),
        ],
      },
      {
        say: 'These three equations solve almost every motion question. Copy them down.',
        board: [
          L('formula', 'v = u + at'),
          L('formula', 's = ut + ½at²'),
          L('formula', 'v² = u² + 2as'),
          L('note', 'No time given? Use v² = u² + 2as'),
        ],
      },
      {
        say: 'Now a worked example, step by step.',
        board: [
          L('example', 'A car starts from rest and reaches 20 m/s in 5 s. Find a.'),
          L('line', 'u = 0,  v = 20,  t = 5'),
          L('line', 'v = u + at  →  20 = 0 + 5a'),
          L('formula', 'a = 4 m/s²'),
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
          L('title', "Ohm's law"),
          L('formula', 'V = I R'),
          L('line', 'V = voltage (volts, V)'),
          L('line', 'I = current (amperes, A)'),
          L('line', 'R = resistance (ohms, Ω)'),
        ],
      },
      {
        say: 'Resistors in series add up; in parallel, the reciprocals add up.',
        board: [
          L('formula', 'Series:  R = R₁ + R₂'),
          L('formula', 'Parallel:  1/R = 1/R₁ + 1/R₂'),
          L('example', '2 Ω and 2 Ω in parallel  →  1/R = ½ + ½  →  R = 1 Ω'),
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
