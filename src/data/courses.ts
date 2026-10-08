/**
 * Starter list of courses and the four UTME subjects usually required.
 *
 * Requirements can differ by institution and change between years — always
 * confirm against the current JAMB brochure. Admins can correct or add
 * courses under Admin → Courses; this file only seeds the first load.
 */

export interface CourseSeed {
  id: string;
  name: string;
  faculty: string;
  subjects: [string, string, string, string];
  note: string;
}

export const COURSE_SEED: CourseSeed[] = [
  { id: 'computer-engineering', name: 'Computer Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'electrical-engineering', name: 'Electrical / Electronics Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'mechanical-engineering', name: 'Mechanical Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'civil-engineering', name: 'Civil Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'chemical-engineering', name: 'Chemical Engineering', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '' },
  { id: 'computer-science', name: 'Computer Science', faculty: 'Science', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: 'Some schools accept Biology, Economics or Geography as the fourth subject.' },
  { id: 'medicine', name: 'Medicine & Surgery', faculty: 'Medicine', subjects: ['English', 'Biology', 'Chemistry', 'Physics'], note: '' },
  { id: 'pharmacy', name: 'Pharmacy', faculty: 'Pharmacy', subjects: ['English', 'Biology', 'Chemistry', 'Physics'], note: '' },
  { id: 'nursing', name: 'Nursing Science', faculty: 'Medicine', subjects: ['English', 'Biology', 'Chemistry', 'Physics'], note: '' },
  { id: 'microbiology', name: 'Microbiology', faculty: 'Science', subjects: ['English', 'Biology', 'Chemistry', 'Physics'], note: 'Some schools accept Mathematics instead of Physics.' },
  { id: 'architecture', name: 'Architecture', faculty: 'Environmental Sciences', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: 'Some schools accept Geography or Fine Art as the fourth subject.' },
  { id: 'law', name: 'Law', faculty: 'Law', subjects: ['English', 'Literature', 'Government', 'CRS'], note: 'The fourth subject can be another Arts or Social Science subject (e.g. IRS, History, Economics).' },
  { id: 'mass-communication', name: 'Mass Communication', faculty: 'Social Sciences', subjects: ['English', 'Literature', 'Government', 'Economics'], note: 'The fourth subject can be another Arts or Social Science subject.' },
  { id: 'accounting', name: 'Accounting', faculty: 'Management Sciences', subjects: ['English', 'Mathematics', 'Economics', 'Commerce'], note: 'Some schools accept Accounting or Government as the fourth subject.' },
  { id: 'economics', name: 'Economics', faculty: 'Social Sciences', subjects: ['English', 'Mathematics', 'Economics', 'Government'], note: '' },
  { id: 'business-administration', name: 'Business Administration', faculty: 'Management Sciences', subjects: ['English', 'Mathematics', 'Economics', 'Commerce'], note: '' },
  { id: 'agriculture', name: 'Agriculture', faculty: 'Agriculture', subjects: ['English', 'Chemistry', 'Biology', 'Mathematics'], note: 'Agricultural Science can replace Biology; Physics can replace Mathematics.' },
];
