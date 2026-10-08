import type { QuestionDraft } from './cms';

export const blankQuestion = (): QuestionDraft => ({
  subject: 'Mathematics',
  examType: 'UTME',
  year: new Date().getFullYear() - 1,
  topic: '',
  question: '',
  options: ['A', 'B', 'C', 'D'].map((label) => ({ label, text: '' })),
  correctAnswer: '',
  explanation: '',
  answerSource: 'manual',
  source: '',
  status: 'draft',
  needsReview: false,
  reviewNote: '',
});

/** Problems that block publishing. Drafts can be saved regardless. */
export const publishProblems = (q: Pick<QuestionDraft, 'question' | 'options' | 'correctAnswer'>) => {
  const issues: string[] = [];
  if (!q.question.trim()) issues.push('Write the question.');
  if (q.options.filter((o) => o.text.trim()).length < 2) issues.push('Add at least two options.');
  if (!q.correctAnswer) issues.push('Choose the correct answer.');
  else if (!q.options.find((o) => o.label === q.correctAnswer)?.text.trim())
    issues.push('The correct answer option is empty.');
  return issues;
};
