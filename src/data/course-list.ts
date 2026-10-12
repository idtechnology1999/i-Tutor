import type { Course } from '../types';

/* Degree, HND and NCE courses Nigerian candidates apply for through JAMB,
   grouped by faculty. Subject combinations and cut-off marks differ by school
   and change every year, so they aren't stored here: the AI checks them for
   the student's school and course (see services/admissions.ts). */

const BY_FACULTY: Record<string, string[]> = {
  'Medicine & Health Sciences': [
    'Medicine and Surgery', 'Dentistry', 'Nursing Science', 'Pharmacy', 'Medical Laboratory Science', 'Physiotherapy',
    'Radiography and Radiation Science', 'Optometry', 'Anatomy', 'Physiology', 'Human Nutrition and Dietetics',
    'Public Health', 'Environmental Health Science', 'Health Information Management', 'Medical Rehabilitation',
    'Occupational Therapy', 'Prosthetics and Orthotics', 'Audiology', 'Speech and Language Therapy', 'Pharmacology',
    'Veterinary Medicine', 'Community Health',
  ],
  Engineering: [
    'Agricultural and Biosystems Engineering', 'Aerospace Engineering', 'Biomedical Engineering', 'Chemical Engineering',
    'Civil Engineering', 'Computer Engineering', 'Electrical and Electronics Engineering', 'Electronics and Telecommunication Engineering',
    'Environmental Engineering', 'Food Science and Engineering', 'Industrial and Production Engineering', 'Marine Engineering',
    'Materials and Metallurgical Engineering', 'Mechanical Engineering', 'Mechatronics Engineering', 'Mining Engineering',
    'Petroleum Engineering', 'Gas Engineering', 'Polymer and Textile Engineering', 'Structural Engineering',
    'Water Resources Engineering', 'Automotive Engineering',
  ],
  'Computing & Information Technology': [
    'Computer Science', 'Cyber Security', 'Information Technology', 'Information Systems', 'Data Science',
    'Artificial Intelligence', 'Software Engineering', 'Library and Information Science',
  ],
  'Physical & Life Sciences': [
    'Biochemistry', 'Biology', 'Biotechnology', 'Botany', 'Chemistry', 'Industrial Chemistry', 'Geology', 'Applied Geophysics',
    'Mathematics', 'Statistics', 'Physics', 'Industrial Physics', 'Microbiology', 'Zoology', 'Marine Science',
    'Plant Science and Biotechnology', 'Genetics', 'Forensic Science', 'Meteorology', 'Environmental Science',
  ],
  'Environmental Sciences': [
    'Architecture', 'Building', 'Estate Management', 'Quantity Surveying', 'Surveying and Geoinformatics',
    'Urban and Regional Planning', 'Fine and Applied Arts', 'Industrial Design', 'Environmental Management',
  ],
  Law: ['Law', 'Civil Law', 'Common and Islamic Law (Sharia)'],
  'Social Sciences': [
    'Economics', 'Political Science', 'International Relations', 'Sociology', 'Psychology', 'Geography',
    'Mass Communication', 'Criminology and Security Studies', 'Peace and Conflict Studies', 'Social Work',
    'Demography and Social Statistics', 'Public Administration', 'Local Government Studies', 'Journalism and Media Studies',
    'Broadcasting', 'Public Relations and Advertising', 'Film and Multimedia Studies',
  ],
  'Management Sciences': [
    'Accounting', 'Banking and Finance', 'Business Administration', 'Marketing', 'Insurance', 'Actuarial Science',
    'Entrepreneurship', 'Human Resource Management', 'Industrial Relations and Personnel Management', 'Hospitality Management',
    'Tourism Management', 'Transport Management', 'Logistics and Supply Chain Management', 'Office and Information Management',
    'Taxation', 'Cooperative and Rural Development', 'Project Management',
  ],
  Arts: [
    'English Language', 'Literature in English', 'English and Literary Studies', 'History and International Studies',
    'Philosophy', 'Religious Studies', 'Christian Religious Studies', 'Islamic Studies', 'Arabic Studies', 'French',
    'Linguistics', 'Yoruba', 'Igbo', 'Hausa', 'Theatre Arts', 'Music', 'Creative Arts', 'Performing Arts', 'Archaeology',
  ],
  Education: [
    'Education and Biology', 'Education and Chemistry', 'Education and Physics', 'Education and Mathematics',
    'Education and Computer Science', 'Education and Economics', 'Education and English Language', 'Education and Geography',
    'Education and Political Science', 'Education and History', 'Education and Religious Studies', 'Education and French',
    'Business Education', 'Technical Education', 'Agricultural Education', 'Home Economics Education', 'Guidance and Counselling',
    'Educational Management', 'Early Childhood Education', 'Primary Education', 'Adult Education', 'Special Education',
    'Physical and Health Education', 'Human Kinetics', 'Library Science Education', 'Educational Technology',
  ],
  Agriculture: [
    'Agriculture', 'Agricultural Economics', 'Agricultural Extension', 'Agronomy', 'Animal Science', 'Crop Science',
    'Soil Science', 'Fisheries and Aquaculture', 'Forestry and Wildlife', 'Food Science and Technology', 'Home Science',
    'Horticulture', 'Agribusiness',
  ],
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const ALL_COURSES: Course[] = Object.entries(BY_FACULTY).flatMap(([faculty, names]) =>
  names.map((name) => ({ id: slug(name), name, faculty })),
);
