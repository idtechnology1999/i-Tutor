/**
 * Starter list of courses and the four UTME subjects usually required.
 *
 * Requirements can differ by institution and change between years — always
 * confirm against the current JAMB brochure. Admins can correct or add
 * courses under Admin → Courses; this file only seeds the first load.
 */

/** Faculties in the order students see them. */
export const FACULTIES = [
  'Engineering',
  'Medicine & Health',
  'Science',
  'Environmental Sciences',
  'Law',
  'Social Sciences',
  'Management Sciences',
  'Arts',
  'Education',
  'Agriculture',
] as const;

/** Exams that have course/class practice. */
export const COURSE_EXAMS = ['UTME', 'WAEC', 'NECO', 'GCE'] as const;
export type CourseExam = (typeof COURSE_EXAMS)[number];

export interface CourseSeed {
  id: string;
  /** UTME: the course (Computer Engineering). WAEC/NECO/GCE: the class (Science). */
  name: string;
  /** UTME: the faculty. Empty for school-cert classes. */
  faculty: string;
  /** UTME: exactly four, English first. WAEC/NECO/GCE: the class's usual subjects. */
  subjects: string[];
  note: string;
  exam: CourseExam;
}

const UTME_COURSES: Omit<CourseSeed, 'exam'>[] = [
  { id: 'computer-engineering', name: 'Computer Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'electrical-engineering', name: 'Electrical / Electronics Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'mechanical-engineering', name: 'Mechanical Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'civil-engineering', name: 'Civil Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'chemical-engineering', name: 'Chemical Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'computer-science', name: 'Computer Science', faculty: 'Science', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: 'Some schools accept Biology, Economics or Geography as the fourth subject.' },
  { id: 'medicine', name: 'Medicine & Surgery', faculty: 'Medicine & Health', subjects: ['English', 'Biology', 'Chemistry', 'Physics'], note: '' },
  { id: 'pharmacy', name: 'Pharmacy', faculty: 'Medicine & Health', subjects: ['English', 'Biology', 'Chemistry', 'Physics'], note: '' },
  { id: 'nursing', name: 'Nursing Science', faculty: 'Medicine & Health', subjects: ['English', 'Biology', 'Chemistry', 'Physics'], note: '' },
  { id: 'microbiology', name: 'Microbiology', faculty: 'Science', subjects: ['English', 'Biology', 'Chemistry', 'Physics'], note: 'Some schools accept Mathematics instead of Physics.' },
  { id: 'architecture', name: 'Architecture', faculty: 'Environmental Sciences', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: 'Some schools accept Geography or Fine Art as the fourth subject.' },
  { id: 'law', name: 'Law', faculty: 'Law', subjects: ['English', 'Literature', 'Government', 'CRS'], note: 'The fourth subject can be another Arts or Social Science subject (e.g. IRS, History, Economics).' },
  { id: 'mass-communication', name: 'Mass Communication', faculty: 'Social Sciences', subjects: ['English', 'Literature', 'Government', 'Economics'], note: 'The fourth subject can be another Arts or Social Science subject.' },
  { id: 'accounting', name: 'Accounting', faculty: 'Management Sciences', subjects: ['English', 'Mathematics', 'Economics', 'Commerce'], note: 'Some schools accept Accounting or Government as the fourth subject.' },
  { id: 'economics', name: 'Economics', faculty: 'Social Sciences', subjects: ['English', 'Mathematics', 'Economics', 'Government'], note: '' },
  { id: 'business-administration', name: 'Business Administration', faculty: 'Management Sciences', subjects: ['English', 'Mathematics', 'Economics', 'Commerce'], note: '' },
  { id: 'agriculture', name: 'Agriculture', faculty: 'Agriculture', subjects: ['English', 'Chemistry', 'Biology', 'Mathematics'], note: 'Agricultural Science can replace Biology; Physics can replace Mathematics.' },
];

/** School-certificate classes. Most candidates sit 8–9 subjects; schools differ. */
export const SSCE_CLASSES: Array<Pick<CourseSeed, 'name' | 'subjects' | 'note'>> = [
  {
    name: 'Science',
    subjects: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Further Mathematics', 'Agricultural Science', 'Civic Education'],
    note: 'Some schools swap Further Mathematics or Agricultural Science for Geography or Computer Studies.',
  },
  {
    name: 'Arts',
    subjects: ['English', 'Mathematics', 'Literature', 'Government', 'CRS', 'Economics', 'Geography', 'Civic Education'],
    note: 'IRS can replace CRS.',
  },
  {
    name: 'Commercial',
    subjects: ['English', 'Mathematics', 'Economics', 'Commerce', 'Accounting', 'Government', 'Civic Education'],
    note: '',
  },
];

export const COURSE_SEED: CourseSeed[] = [
  ...UTME_COURSES.map((c) => ({ ...c, exam: 'UTME' as const })),
  ...(['WAEC', 'NECO', 'GCE'] as const).flatMap((exam) =>
    SSCE_CLASSES.map((c) => ({
      ...c,
      id: `${exam.toLowerCase()}-${c.name.toLowerCase()}`,
      faculty: '',
      exam,
    })),
  ),
];

/** The subject combination most courses in a faculty share (JAMB), so a
    student can practise for the whole faculty in one go. */
export interface FacultySet {
  faculty: string;
  subjects: string[];
  note: string;
}

export const FACULTY_SET_SEED: FacultySet[] = [
  { faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { faculty: 'Medicine & Health', subjects: ['English', 'Biology', 'Chemistry', 'Physics'], note: '' },
  { faculty: 'Science', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: 'Life-science courses often take Biology instead of Mathematics.' },
  { faculty: 'Environmental Sciences', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: 'Some schools accept Geography in place of Chemistry.' },
  { faculty: 'Law', subjects: ['English', 'Literature', 'Government', 'CRS'], note: 'IRS can replace CRS.' },
  { faculty: 'Social Sciences', subjects: ['English', 'Mathematics', 'Economics', 'Government'], note: '' },
  { faculty: 'Management Sciences', subjects: ['English', 'Mathematics', 'Economics', 'Accounting'], note: 'Commerce is often accepted in place of Accounting.' },
  { faculty: 'Arts', subjects: ['English', 'Literature', 'Government', 'CRS'], note: '' },
  { faculty: 'Education', subjects: ['English', 'Mathematics', 'Biology', 'Chemistry'], note: 'Depends on your teaching subject.' },
  { faculty: 'Agriculture', subjects: ['English', 'Biology', 'Chemistry', 'Agricultural Science'], note: '' },
];
