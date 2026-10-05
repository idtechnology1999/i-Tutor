import type { DiagnosticQuestion, Institution, Course } from '../types';

export interface SubjectItem {
  id: string;
  name: string;
  isCompulsory?: boolean;
  isComingSoon?: boolean;
  category: 'core' | 'arts' | 'commercial';
}

export const JAMB_SUBJECTS: SubjectItem[] = [
  { id: 'eng', name: 'English Language', isCompulsory: true, category: 'core' },
  { id: 'math', name: 'Mathematics', category: 'core' },
  { id: 'phy', name: 'Physics', category: 'core' },
  { id: 'chem', name: 'Chemistry', category: 'core' },
  { id: 'bio', name: 'Biology', category: 'core' },
  { id: 'econ', name: 'Economics', category: 'commercial' },
  { id: 'lit', name: 'Literature in English', category: 'arts' },
  { id: 'govt', name: 'Government', category: 'arts' },
  { id: 'geo', name: 'Geography', category: 'core' },
  { id: 'agric', name: 'Agricultural Science', category: 'core' },
  { id: 'crs', name: 'Christian Religious Studies', category: 'arts' },
  { id: 'irs', name: 'Islamic Religious Studies', category: 'arts' },
  { id: 'comm', name: 'Commerce', isComingSoon: true, category: 'commercial' },
  { id: 'acct', name: 'Financial Accounting', isComingSoon: true, category: 'commercial' },
];

export const NIGERIAN_INSTITUTIONS: Institution[] = [
  { id: 'unilag', name: 'University of Lagos', shortName: 'UNILAG', type: 'Federal', location: 'Akoka, Lagos', minCutOff: 200 },
  { id: 'ui', name: 'University of Ibadan', shortName: 'UI', type: 'Federal', location: 'Ibadan, Oyo', minCutOff: 200 },
  { id: 'oau', name: 'Obafemi Awolowo University', shortName: 'OAU', type: 'Federal', location: 'Ile-Ife, Osun', minCutOff: 200 },
  { id: 'abu', name: 'Ahmadu Bello University', shortName: 'ABU', type: 'Federal', location: 'Zaria, Kaduna', minCutOff: 180 },
  { id: 'unn', name: 'University of Nigeria', shortName: 'UNN', type: 'Federal', location: 'Nsukka, Enugu', minCutOff: 180 },
  { id: 'uniben', name: 'University of Benin', shortName: 'UNIBEN', type: 'Federal', location: 'Benin City, Edo', minCutOff: 200 },
  { id: 'lasu', name: 'Lagos State University', shortName: 'LASU', type: 'State', location: 'Ojo, Lagos', minCutOff: 195 },
  { id: 'covenant', name: 'Covenant University', shortName: 'CU', type: 'Private', location: 'Ota, Ogun', minCutOff: 180 },
  { id: 'futa', name: 'Fed. Univ. of Tech. Akure', shortName: 'FUTA', type: 'Federal', location: 'Akure, Ondo', minCutOff: 180 },
  { id: 'rsu', name: 'Rivers State University', shortName: 'RSU', type: 'State', location: 'Port Harcourt, Rivers', minCutOff: 160 },
  { id: 'bowen', name: 'Bowen University', shortName: 'BOWEN', type: 'Private', location: 'Iwo, Osun', minCutOff: 170 },
  { id: 'unilorin', name: 'University of Ilorin', shortName: 'UNILORIN', type: 'Federal', location: 'Ilorin, Kwara', minCutOff: 180 }
];

export const POPULAR_COURSES: Course[] = [
  { id: 'med', name: 'Medicine & Surgery', faculty: 'College of Medicine', benchmarkScore: 285, requiredSubjects: ['English', 'Biology', 'Chemistry', 'Physics'] },
  { id: 'cs', name: 'Computer Science', faculty: 'Faculty of Science', benchmarkScore: 260, requiredSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'] },
  { id: 'law', name: 'Law (Civil / Common Law)', faculty: 'Faculty of Law', benchmarkScore: 270, requiredSubjects: ['English', 'Literature', 'Government', 'CRS/IRS'] },
  { id: 'mech', name: 'Mechanical Engineering', faculty: 'Faculty of Engineering', benchmarkScore: 255, requiredSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'] },
  { id: 'pharm', name: 'Pharmacy', faculty: 'Faculty of Pharmacy', benchmarkScore: 275, requiredSubjects: ['English', 'Biology', 'Chemistry', 'Physics'] },
  { id: 'acct_c', name: 'Accounting', faculty: 'Faculty of Management Sciences', benchmarkScore: 245, requiredSubjects: ['English', 'Mathematics', 'Economics', 'Government'] },
  { id: 'nurs', name: 'Nursing Science', faculty: 'College of Medicine', benchmarkScore: 265, requiredSubjects: ['English', 'Biology', 'Chemistry', 'Physics'] },
  { id: 'econ_c', name: 'Economics', faculty: 'Faculty of Social Sciences', benchmarkScore: 240, requiredSubjects: ['English', 'Mathematics', 'Economics', 'Government'] },
  { id: 'elect', name: 'Electrical / Electronics Eng.', faculty: 'Faculty of Engineering', benchmarkScore: 250, requiredSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'] },
  { id: 'masscomm', name: 'Mass Communication', faculty: 'Faculty of Arts', benchmarkScore: 245, requiredSubjects: ['English', 'Literature', 'Government', 'Economics'] }
];

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 1,
    subject: 'Physics',
    topic: 'Mechanics (Kinematics)',
    question: 'A car accelerates uniformly from rest at 3 m/s² for 8 seconds. What total distance does it cover during this period?',
    options: [
      { label: 'A', text: '48 metres' },
      { label: 'B', text: '96 metres' },
      { label: 'C', text: '192 metres' },
      { label: 'D', text: '24 metres' },
    ],
    correctAnswer: 'B',
    explanation: 'Using the kinematic equation s = ut + 0.5at²: since the car starts from rest (u = 0), s = 0 + 0.5 × 3 × (8)² = 1.5 × 64 = 96m.'
  },
  {
    id: 2,
    subject: 'Chemistry',
    topic: 'Stoichiometry & Mole Concept',
    question: 'How many moles of oxygen atoms are present in 0.5 moles of hydrated copper(II) tetraoxosulphate(VI), CuSO₄·5H₂O?',
    options: [
      { label: 'A', text: '4.5 moles' },
      { label: 'B', text: '9.0 moles' },
      { label: 'C', text: '2.0 moles' },
      { label: 'D', text: '5.0 moles' },
    ],
    correctAnswer: 'A',
    explanation: 'One formula unit of CuSO₄·5H₂O contains 4 (from SO₄) + 5 (from 5H₂O) = 9 oxygen atoms. In 0.5 moles, total oxygen moles = 0.5 × 9 = 4.5 moles.'
  },
  {
    id: 3,
    subject: 'Mathematics',
    topic: 'Calculus (Differentiation)',
    question: 'If y = (2x - 3)⁴, find dy/dx when x = 2.',
    options: [
      { label: 'A', text: '8' },
      { label: 'B', text: '16' },
      { label: 'C', text: '4' },
      { label: 'D', text: '32' },
    ],
    correctAnswer: 'A',
    explanation: 'By the chain rule, dy/dx = 4(2x - 3)³ × d/dx(2x - 3) = 8(2x - 3)³. When x = 2, 2(2) - 3 = 1, so dy/dx = 8(1)³ = 8.'
  },
  {
    id: 4,
    subject: 'Physics',
    topic: 'Waves & Optics',
    question: 'What is the critical angle for a light ray transitioning from glass (refractive index = 1.50) into air (refractive index = 1.00)?',
    options: [
      { label: 'A', text: '41.8°' },
      { label: 'B', text: '45.0°' },
      { label: 'C', text: '48.6°' },
      { label: 'D', text: '30.0°' },
    ],
    correctAnswer: 'A',
    explanation: 'Critical angle c is given by sin(c) = 1/n = 1/1.50 = 0.6667. Taking the arcsin gives c ≈ 41.8°.'
  },
  {
    id: 5,
    subject: 'Chemistry',
    topic: 'Organic Chemistry (Isomerism)',
    question: 'Which of the following organic pairs represents functional group isomers?',
    options: [
      { label: 'A', text: 'Ethanol and Methoxymethane' },
      { label: 'B', text: 'But-1-ene and But-2-ene' },
      { label: 'C', text: 'Pentane and 2-Methylbutane' },
      { label: 'D', text: 'Propan-1-ol and Propan-2-ol' },
    ],
    correctAnswer: 'A',
    explanation: 'Both ethanol (an alcohol, C₂H₅OH) and methoxymethane (an ether, CH₃OCH₃) share molecular formula C₂H₆O but have different functional groups.'
  },
  {
    id: 6,
    subject: 'Mathematics',
    topic: 'Logarithms & Indices',
    question: 'Solve for x if log₂(x) + log₂(x - 2) = 3.',
    options: [
      { label: 'A', text: '4' },
      { label: 'B', text: '-2' },
      { label: 'C', text: '6' },
      { label: 'D', text: '2' },
    ],
    correctAnswer: 'A',
    explanation: 'Combining logs: log₂(x(x - 2)) = 3 ⇒ x(x - 2) = 2³ = 8 ⇒ x² - 2x - 8 = 0 ⇒ (x - 4)(x + 2) = 0. Since log cannot accept negative arguments, x = 4.'
  },
  {
    id: 7,
    subject: 'Physics',
    topic: 'Electricity & Magnetism',
    question: 'Three resistors of 2Ω, 3Ω, and 6Ω are connected in parallel. What is their effective total resistance?',
    options: [
      { label: 'A', text: '1.0 Ω' },
      { label: 'B', text: '0.5 Ω' },
      { label: 'C', text: '11.0 Ω' },
      { label: 'D', text: '2.5 Ω' },
    ],
    correctAnswer: 'A',
    explanation: '1/R_total = 1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 6/6 = 1. Therefore R_total = 1.0 Ω.'
  },
  {
    id: 8,
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium (Le Chatelier)',
    question: 'In the Haber process: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH < 0), what condition increases the equilibrium yield of ammonia?',
    options: [
      { label: 'A', text: 'Increasing pressure and decreasing temperature' },
      { label: 'B', text: 'Decreasing pressure and increasing temperature' },
      { label: 'C', text: 'Adding a catalyst at low pressure' },
      { label: 'D', text: 'Increasing temperature only' },
    ],
    correctAnswer: 'A',
    explanation: 'Since the forward reaction is exothermic (ΔH < 0), lowering temperature shifts equilibrium forward. Since forward side has fewer gas moles (4 moles reactant → 2 moles product), increasing pressure favors ammonia yield.'
  },
  {
    id: 9,
    subject: 'Mathematics',
    topic: 'Matrices & Determinants',
    question: 'Find the determinant of the 2x2 matrix [[3, 5], [2, 4]].',
    options: [
      { label: 'A', text: '2' },
      { label: 'B', text: '22' },
      { label: 'C', text: '-2' },
      { label: 'D', text: '12' },
    ],
    correctAnswer: 'A',
    explanation: 'Determinant = (3 × 4) - (5 × 2) = 12 - 10 = 2.'
  },
  {
    id: 10,
    subject: 'English',
    topic: 'Lexis & Structure (Idiomatic Usage)',
    question: 'Choose the option that nearest in meaning to the capitalized words: The student took the teacher’s stern reprimand TO HEART.',
    options: [
      { label: 'A', text: 'Took it very seriously and acted upon it' },
      { label: 'B', text: 'Memorized the teacher\'s exact words' },
      { label: 'C', text: 'Felt deeply offended and resented it' },
      { label: 'D', text: 'Completely disregarded the advice' },
    ],
    correctAnswer: 'A',
    explanation: 'To "take something to heart" is an English idiom meaning to consider advice or criticism seriously and be affected by it.'
  }
];
