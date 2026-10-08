import { CMS_SUBJECTS, EXAM_LABEL, SCHOOLS, needsSchool, paperSize } from './cms';
import type { CmsNews, CmsQuestion, CmsSubject, ExamType } from './cms';
import type { BankScope, ImportPreset, QuestionFilter, Section } from '../components/admin/AdminApp';

/* -----------------------------------------------------------------------------
   i-Auto: the admin's automation assistant.

   The admin types what they want ("publish the latest news", "email all
   students about registration", "upload English 2025 past questions").
   i-Auto answers with a plan made of actions; nothing changes until the
   admin presses Run.

   Backend contract (not built — UI only):
     POST /api/admin/auto            header x-admin-key
       body  { message: string, context: AutoContext, history: {role, text}[] }
       reply { reply: string, actions: AutoAction[] }
   The server gives the model ADMIN_KNOWLEDGE below as its instructions, so it
   knows the panel, and must only return the action kinds defined here.
   Until then `planLocally` understands the common requests on the device.
   -------------------------------------------------------------------------- */

/** What i-Auto is taught about the admin panel (the model's instructions). */
export const ADMIN_KNOWLEDGE = `
You are i-Auto, the automation assistant inside the i-Tutor admin panel.
i-Tutor is a Nigerian exam-practice website (JAMB/UTME, WAEC, NECO, GCE, NABTEB, Post-UTME).

Sections:
- Overview (/admin): counts of questions by exam, recent activity.
- Past questions (/admin/past-questions): the bank. Organised exam → subject → year.
  Post-UTME is also by school. Only ONE paper per exam, subject, year (and school).
  Questions are draft or published; some are flagged "needs review".
- Import with AI (/admin/import): paste or upload a paper; AI arranges it; admin reviews; publish.
- Post-UTME (/admin/post-utme): schools and their papers.
- Courses (/admin/courses): JAMB faculty → course (four subjects each) and one faculty practice
  combination per faculty; WAEC/NECO/GCE classes (Science, Arts, Commercial).
- News (/admin/news): articles shown before the footer of the website; draft or published.
- Settings (/admin/settings): admin key, backup/restore, reset.

Rules:
- Never change content without the admin pressing Run on your plan.
- Never publish a second paper for a year that already has one.
- Emails go to students through the server; write them short, friendly and in plain English.
- If something is missing (subject, year, school), ask for it.
`.trim();

export interface AutoContext {
  questions: CmsQuestion[];
  news: CmsNews[];
}

export type AutoAction =
  | {
      kind: 'open';
      label: string;
      section: Section;
      filter?: QuestionFilter;
      scope?: BankScope;
    }
  | { kind: 'import'; label: string; preset: ImportPreset }
  | { kind: 'publishNews'; label: string; ids: string[]; titles: string[] }
  | { kind: 'draftNews'; label: string; title: string; summary: string }
  | {
      kind: 'setStatus';
      label: string;
      ids: number[];
      status: 'published' | 'draft';
    }
  | {
      kind: 'email';
      label: string;
      audience: Audience;
      subject: string;
      body: string;
    };

export type Audience =
  'All students' | 'Premium students' | 'Free students' | 'Students who haven’t practised this week';
export const AUDIENCES: Audience[] = [
  'All students',
  'Premium students',
  'Free students',
  'Students who haven’t practised this week',
];

export interface AutoPlan {
  reply: string;
  /** Steps i-Auto will take, shown before Run. */
  steps?: string[];
  action?: AutoAction;
  /** Quick replies, e.g. when i-Auto needs a missing detail. */
  suggestions?: string[];
}

export const STARTERS = [
  'Publish the latest news',
  'Email all students about JAMB registration',
  'Upload English 2025 past questions',
  'Show questions that need review',
  'How many Physics questions do we have?',
  'Publish all Chemistry drafts',
];

/* ------------------------------------------------------------- Understanding */

const SUBJECT_ALIASES: Array<[RegExp, CmsSubject]> = [
  [/\b(maths?|mathematics)\b/, 'Mathematics'],
  [/\bfurther maths?\b|\bfurther mathematics\b/, 'Further Mathematics'],
  [/\b(english|use of english)\b/, 'English'],
  [/\bphysics\b/, 'Physics'],
  [/\b(chemistry|chem)\b/, 'Chemistry'],
  [/\b(biology|bio)\b/, 'Biology'],
  [/\b(economics|econs?)\b/, 'Economics'],
  [/\b(government|govt)\b/, 'Government'],
  [/\bgeography\b/, 'Geography'],
  [/\b(agric|agricultural science|agriculture)\b/, 'Agricultural Science'],
  [/\bcommerce\b/, 'Commerce'],
  [/\b(literature|lit)\b/, 'Literature'],
  [/\b(accounting|accounts)\b/, 'Accounting'],
  [/\bcrs\b|\bchristian religious/, 'CRS'],
  [/\birs\b|\bislamic/, 'IRS'],
  [/\bcivic/, 'Civic Education'],
];

const findSubject = (t: string): CmsSubject | null => {
  // "further maths" must win over "maths".
  const further = SUBJECT_ALIASES.find(([, s]) => s === 'Further Mathematics');
  if (further && further[0].test(t)) return 'Further Mathematics';
  const hit = SUBJECT_ALIASES.find(([re, s]) => s !== 'Further Mathematics' && re.test(t));
  return hit ? hit[1] : (CMS_SUBJECTS.find((s) => t.includes(s.toLowerCase())) ?? null);
};

const findExam = (t: string): ExamType | null => {
  if (/\bpost[\s-]?utme\b/.test(t)) return 'Post-UTME';
  if (/\b(jamb|utme)\b/.test(t)) return 'UTME';
  if (/\bwaec\b|\bwassce\b/.test(t)) return 'WAEC';
  if (/\bneco\b/.test(t)) return 'NECO';
  if (/\bgce\b/.test(t)) return 'GCE';
  if (/\bnabteb\b/.test(t)) return 'NABTEB';
  return null;
};

const findSchool = (raw: string) => SCHOOLS.find((s) => new RegExp(`\\b${s.id}\\b`, 'i').test(raw))?.id ?? '';

const findYear = (t: string) => {
  const m = t.match(/\b(19[89]\d|20[0-4]\d)\b/);
  return m ? Number(m[1]) : null;
};

/** "about X" / "on X" / "that X" → X */
const topicOf = (raw: string) => {
  const m = raw.match(/\b(?:about|on|regarding|that|saying)\s+(.+)$/i);
  return m ? m[1].replace(/[.?!]+$/, '').trim() : '';
};

const sentence = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const SECTION_WORDS: Array<[RegExp, Section, string]> = [
  [/\b(overview|dashboard|home)\b/, 'overview', 'Overview'],
  [/\b(import)\b/, 'import', 'Import with AI'],
  [/\bpost[\s-]?utme\b/, 'postutme', 'Post-UTME'],
  [/\b(courses?|faculty|faculties)\b/, 'courses', 'Courses'],
  [/\bnews\b/, 'news', 'News'],
  [/\b(settings?|backup|restore|admin key)\b/, 'settings', 'Settings'],
  [/\b(past questions?|question bank|bank|questions)\b/, 'questions', 'Past questions'],
];

const emailFor = (topic: string, name = 'there') => {
  const about = topic || 'an update from i-Tutor';
  return {
    subject: sentence(about.length > 60 ? `${about.slice(0, 57)}…` : about),
    body: `Hi ${name},\n\nQuick update from i-Tutor: ${about}.\n\nLog in to i-Tutor to keep practising — even 15 minutes a day makes a difference.\n\nThe i-Tutor team`,
  };
};

/* ---------------------------------------------------------------- Planning */

export const planLocally = (message: string, ctx: AutoContext): AutoPlan => {
  const raw = message.trim();
  const t = raw.toLowerCase();
  const subject = findSubject(t);
  const exam = findExam(t);
  const school = findSchool(raw);
  const year = findYear(t);

  // ---- Help
  if (/^(help|hi|hello|hey)\b|what can you do|how do you work/.test(t)) {
    return {
      reply:
        'I run admin jobs for you. Tell me what you want in plain words — I’ll show you the plan, and nothing changes until you press Run.',
      suggestions: STARTERS,
    };
  }

  // ---- Email students
  if (/\b(email|e-mail|mail|message|notify|announce|send)\b/.test(t) && /\b(students?|users?|everyone|all)\b/.test(t)) {
    const audience: Audience = /\bpremium|paid\b/.test(t)
      ? 'Premium students'
      : /\bfree\b/.test(t)
        ? 'Free students'
        : /\binactive|haven.?t practi|not practi/.test(t)
          ? 'Students who haven’t practised this week'
          : 'All students';
    const { subject: s, body } = emailFor(topicOf(raw));
    return {
      reply: `Here’s a draft email to ${audience.toLowerCase()}. Edit it if you like, then press Run to send.`,
      steps: [`Write the email`, `Send to ${audience.toLowerCase()}`, 'Log it in Activity'],
      action: {
        kind: 'email',
        label: `Send to ${audience.toLowerCase()}`,
        audience,
        subject: s,
        body,
      },
    };
  }

  // ---- News
  if (/\b(news|articles?|announcements?)\b/.test(t)) {
    const drafts = ctx.news.filter((n) => n.status === 'draft').sort((a, b) => b.date.localeCompare(a.date));
    if (/\b(write|create|draft|add|new)\b/.test(t)) {
      const topic = topicOf(raw);
      if (!topic) {
        return {
          reply: 'What should the news be about?',
          suggestions: ['Write news about JAMB registration opening', 'Write news about the new Post-UTME questions'],
        };
      }
      return {
        reply: `I’ll create a draft news article about “${topic}”. You can add the picture and full story before publishing.`,
        steps: ['Create the draft', 'Open News so you can finish it'],
        action: {
          kind: 'draftNews',
          label: 'Create draft',
          title: sentence(topic),
          summary: `${sentence(topic)}. Here’s what students need to know.`,
        },
      };
    }
    if (/\b(publish|post|release|go live)\b/.test(t)) {
      if (!drafts.length) {
        return {
          reply: 'All news is already published — there are no drafts waiting.',
          action: { kind: 'open', label: 'Open News', section: 'news' },
        };
      }
      const pick = /\ball\b/.test(t) ? drafts : drafts.slice(0, 1);
      return {
        reply:
          pick.length === 1
            ? `The latest draft is “${pick[0].title}”. Publish it?`
            : `There are ${pick.length} draft articles. Publish them all?`,
        steps: [...pick.map((n) => `Publish “${n.title}”`), 'It shows on the website straight away'],
        action: {
          kind: 'publishNews',
          label: pick.length === 1 ? 'Publish' : `Publish ${pick.length} articles`,
          ids: pick.map((n) => n.id),
          titles: pick.map((n) => n.title),
        },
      };
    }
  }

  // ---- Upload / import a paper
  if (/\b(upload|import|add|paste|load)\b/.test(t) && /\b(past questions?|paper|questions?)\b/.test(t)) {
    const e: ExamType = exam ?? 'UTME';
    if (!subject) {
      return {
        reply: 'Which subject is the paper for?',
        suggestions: ['English', 'Mathematics', 'Physics', 'Chemistry'].map(
          (s) => `Upload ${EXAM_LABEL[e]} ${s} ${year ?? new Date().getFullYear() - 1} past questions`,
        ),
      };
    }
    if (needsSchool(e) && !school) {
      return {
        reply: 'Post-UTME papers are set by each school. Which school?',
        suggestions: ['UNILAG', 'UI', 'OAU', 'UNN'].map((s) =>
          `Upload ${s} Post-UTME ${subject} ${year ?? ''} past questions`.replace(/\s+/g, ' '),
        ),
      };
    }
    if (!year) {
      const y = new Date().getFullYear() - 1;
      return {
        reply: `Which year is this ${EXAM_LABEL[e]} ${subject} paper?`,
        suggestions: [y, y - 1, y - 2].map(
          (yy) => `Upload ${school ? `${school} ` : ''}${EXAM_LABEL[e]} ${subject} ${yy} past questions`,
        ),
      };
    }
    const name = `${school ? `${school} ` : ''}${EXAM_LABEL[e]} ${subject} ${year}`;
    const scope: BankScope = { exam: e, school, subject, year };
    if (paperSize(ctx.questions, subject, e, year, school) > 0) {
      return {
        reply: `The ${name} paper is already in the bank — each year can only have one paper. You can edit its questions instead.`,
        action: {
          kind: 'open',
          label: `Open ${name}`,
          section: 'questions',
          scope,
        },
      };
    }
    return {
      reply: `Ready for the ${name} paper. I’ll open the importer set to it — paste or upload the paper and the AI will arrange it for you to check.`,
      steps: [
        `Check ${year} doesn’t already have a paper`,
        `Open Import with AI for ${name}`,
        'You paste the paper · AI arranges it · you publish',
      ],
      action: {
        kind: 'import',
        label: 'Open importer',
        preset: { exam: e, school, subject, year },
      },
    };
  }

  // ---- Publish / unpublish questions
  if (/\b(publish|unpublish|hide|take down)\b/.test(t) && /\b(questions?|drafts?|paper)\b/.test(t)) {
    const unpublish = /\b(unpublish|hide|take down)\b/.test(t);
    const pool = ctx.questions.filter(
      (q) =>
        (!subject || q.subject === subject) &&
        (!exam || q.examType === exam) &&
        (!year || q.year === year) &&
        (!school || q.school === school) &&
        q.status === (unpublish ? 'published' : 'draft'),
    );
    const what = [school, exam ? EXAM_LABEL[exam] : '', subject ?? '', year ?? ''].filter(Boolean).join(' ') || 'all';
    if (!pool.length) {
      return {
        reply: unpublish
          ? `No published ${what} questions to take down.`
          : `There are no ${what} drafts waiting to publish.`,
      };
    }
    const flagged = pool.filter((q) => q.needsReview).length;
    return {
      reply: `${pool.length} ${what} question${pool.length === 1 ? '' : 's'} ${unpublish ? 'will be hidden from students' : 'will go live for students'}.${
        flagged && !unpublish ? ` ${flagged} of them were flagged for review — check them first if you can.` : ''
      }`,
      steps: [
        `Find ${what} ${unpublish ? 'published questions' : 'drafts'}`,
        `${unpublish ? 'Unpublish' : 'Publish'} ${pool.length}`,
      ],
      action: {
        kind: 'setStatus',
        label: `${unpublish ? 'Unpublish' : 'Publish'} ${pool.length}`,
        ids: pool.map((q) => q.id),
        status: unpublish ? 'draft' : 'published',
      },
    };
  }

  // ---- Needs review
  if (/\breview|flagged|check\b/.test(t)) {
    const n = ctx.questions.filter((q) => q.needsReview || q.status === 'draft').length;
    return {
      reply: n ? `${n} question${n === 1 ? '' : 's'} need a look.` : 'Nothing is waiting for review.',
      action: {
        kind: 'open',
        label: 'Open review list',
        section: 'questions',
        filter: 'review',
      },
    };
  }

  // ---- Counts
  if (/\b(how many|count|number of|total)\b/.test(t)) {
    const pool = ctx.questions.filter(
      (q) =>
        (!subject || q.subject === subject) &&
        (!exam || q.examType === exam) &&
        (!year || q.year === year) &&
        (!school || q.school === school),
    );
    const live = pool.filter((q) => q.status === 'published').length;
    const what = [school, exam ? EXAM_LABEL[exam] : '', subject ?? '', year ?? ''].filter(Boolean).join(' ');
    return {
      reply: `${what ? `${what}: ` : 'In total: '}${pool.length} question${pool.length === 1 ? '' : 's'}, ${live} published.`,
      action: subject
        ? {
            kind: 'open',
            label: 'Open them',
            section: 'questions',
            scope: { exam: exam ?? 'UTME', school, subject, year },
          }
        : undefined,
    };
  }

  // ---- Go somewhere
  if (/\b(open|go to|show|take me|navigate)\b/.test(t)) {
    const hit = SECTION_WORDS.find(([re]) => re.test(t));
    if (hit)
      return {
        reply: `Opening ${hit[2]}.`,
        action: { kind: 'open', label: `Open ${hit[2]}`, section: hit[1] },
      };
  }

  return {
    reply: 'I didn’t catch that one yet. Try one of these:',
    suggestions: STARTERS.slice(0, 4),
  };
};
