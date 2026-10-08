/**
 * Landing-page news. Starter content: practical guides and i-Tutor updates.
 *
 * Only publish official JAMB / institution announcements here after they
 * have been checked against the source, and fill in `source` + `sourceUrl`
 * so students can verify them (see the blueprint's "Official Information"
 * rule). Newest first.
 */

export type NewsCategory = 'Admissions' | 'Exam tips' | 'i-Tutor update';

export interface NewsItem {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  date: string; // ISO yyyy-mm-dd
  readMinutes: number;
  image: string;
  imageAlt: string;
  body: string[];
  source?: string;
  sourceUrl?: string;
}

export const NEWS: NewsItem[] = [
  {
    id: 'set-up-your-exam',
    category: 'i-Tutor update',
    title: 'New: set up your practice exam your way',
    summary:
      'Pick a subject, choose how many questions you want, and see the time allowed before the clock starts.',
    date: '2026-10-08',
    readMinutes: 2,
    image: '/images/student-portrait.jpg',
    imageAlt: 'A secondary-school student at a computer, holding a booklet',
    body: [
      'Practice exams now open on a simple setup page. Choose one subject or all four, then pick how many questions you want to answer.',
      'You can see the time allowed before you begin — about one minute per question, like the real CBT. The timer only starts when you press Start exam.',
      'Tip: if a subject on your home page says “Needs work”, tap Practise next to it. The setup opens with that subject already chosen.',
    ],
  },
  {
    id: 'reading-cut-off-marks',
    category: 'Admissions',
    title: 'How cut-off marks work — and how to read them',
    summary:
      'The general JAMB minimum is not the same as your course’s cut-off. Here’s the difference and why it matters.',
    date: '2026-10-03',
    readMinutes: 4,
    image: '/images/cbt-lab-rows.jpg',
    imageAlt: 'Rows of students sitting at desktop computers',
    body: [
      'There are two numbers to watch. The national minimum is the lowest UTME score an institution may consider. Your course’s departmental cut-off is usually much higher, especially for competitive courses like Medicine, Law and Engineering.',
      'Universities also combine your UTME score with your Post-UTME screening and O’level results into an aggregate. A strong UTME score gives you room if screening day doesn’t go perfectly.',
      'Always check cut-offs on the institution’s own portal or official announcements. On i-Tutor, set your target course in My goal and your home page shows how close your practice scores are.',
    ],
  },
  {
    id: 'last-month-habits',
    category: 'Exam tips',
    title: '5 habits that raise your CBT score in the final month',
    summary:
      'Short daily practice, timed papers and reviewing every mistake beat long last-minute reading.',
    date: '2026-09-28',
    readMinutes: 3,
    image: '/images/student-cbt-focus.jpg',
    imageAlt: 'A student concentrating at a computer',
    body: [
      '1. Practise every day, even for 20 minutes. Consistency beats long weekend sessions.',
      '2. Sit at least one full timed mock each week so the clock feels normal on exam day.',
      '3. Review every wrong answer. Ask the tutor why — not just what the right option is.',
      '4. Work on your weakest topic first each day while your mind is fresh.',
      '5. Sleep well the week before. Tired candidates misread questions they know.',
    ],
  },
  {
    id: 'post-utme-prep',
    category: 'Admissions',
    title: 'Post-UTME screening: what to prepare for',
    summary:
      'Most screenings test the same subjects as UTME, plus general knowledge. Start early and practise under time.',
    date: '2026-09-20',
    readMinutes: 4,
    image: '/images/teacher-guiding.jpg',
    imageAlt: 'A teacher explaining something on a screen to students',
    body: [
      'Post-UTME formats differ by institution. Many use a short CBT on your four UTME subjects; some add English and general knowledge questions.',
      'Find your institution’s official screening notice early and note the date, format and documents you need to bring.',
      'Keep practising on i-Tutor between UTME and screening day — the same topics come up, and staying sharp makes a real difference.',
    ],
  },
  {
    id: 'calculator-tips',
    category: 'Exam tips',
    title: 'Use the on-screen calculator without losing time',
    summary:
      'The CBT calculator is basic. Practise with it so you don’t waste minutes on exam day.',
    date: '2026-09-12',
    readMinutes: 2,
    image: '/images/tutor-session.jpg',
    imageAlt: 'A teacher helping students at a computer',
    body: [
      'The calculator in the exam is simple: no fancy functions. Practise long sums with it so your fingers know where everything is.',
      'Estimate first. If your rough answer is 50 and the calculator says 5,000, you pressed something wrong.',
      'In i-Tutor practice exams, tap the calculator icon at the top. You can drag it out of the way, minimise it, or type on your keyboard.',
    ],
  },
];
