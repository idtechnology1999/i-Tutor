import {
  AlignLeft,
  BadgeCheck,
  CircleHelp,
  Columns2,
  CreditCard,
  Footprints,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  ListChecks,
  Megaphone,
  MousePointerClick,
  Newspaper,
  PanelTop,
  Presentation,
  Rows3,
  Sparkles,
  Table2,
  UsersRound,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FEATURES_DEFAULTS } from './home';
import type { BlockData } from './types';

/* Every block an admin can add: its name in the editor, the fields it has,
   and what a new one starts with. How each one looks is in render.tsx. */

export type FieldSpec = {
  key: string;
  label: string;
  help?: string;
  placeholder?: string;
  /** Only shown when this returns true for the block's data. */
  show?: (data: BlockData) => boolean;
} & (
  | { kind: 'text' }
  | { kind: 'textarea'; rows?: number }
  /** A heading: *stars* colour words, Enter makes a line break. */
  | { kind: 'title' }
  | { kind: 'markdown' }
  /** One item per line. */
  | { kind: 'lines' }
  | { kind: 'image' }
  | { kind: 'link' }
  | { kind: 'select'; options: Array<[value: string, label: string]> }
  | { kind: 'toggle' }
  | { kind: 'icon' }
  | { kind: 'list'; item: string; titleKey: string; fields: FieldSpec[]; blank: BlockData; max?: number }
);

export type BlockCategory = 'Text & layout' | 'Media' | 'Site sections';

export interface BlockDef {
  type: string;
  label: string;
  description: string;
  category: BlockCategory;
  icon: LucideIcon;
  fields: FieldSpec[];
  defaults: BlockData;
}

/* ---------------------------------------------------------- Shared fields */

const kicker: FieldSpec = { kind: 'text', key: 'kicker', label: 'Small label above the heading', placeholder: 'e.g. Why i-Tutor' };
const title: FieldSpec = { kind: 'title', key: 'title', label: 'Heading' };
const body = (label = 'Text'): FieldSpec => ({ kind: 'textarea', key: 'body', label, rows: 3 });

const BACKGROUNDS: Array<[string, string]> = [
  ['plain', 'White'],
  ['tint', 'Light grey band'],
  ['mist', 'Grey panel'],
  ['orange', 'Light orange panel'],
  ['orange-solid', 'Orange panel'],
  ['ink', 'Dark teal panel'],
];
const background: FieldSpec = { kind: 'select', key: 'bg', label: 'Background', options: BACKGROUNDS };

const PANELS: Array<[string, string]> = [
  ['mist', 'Grey panel'],
  ['orange', 'Light orange panel'],
  ['orange-solid', 'Orange panel'],
  ['ink', 'Dark teal panel'],
];
const panel: FieldSpec = { kind: 'select', key: 'panel', label: 'Background', options: PANELS };

const btn = (key: string, label: string): FieldSpec => ({ kind: 'link', key, label });
const img = (key = 'image', label = 'Image'): FieldSpec => ({ kind: 'image', key, label });

const ticks = (key: string, label = 'Ticked points'): FieldSpec => ({ kind: 'lines', key, label, help: 'One per line.' });

/* ---------------------------------------------------------------- Blocks */

export const BLOCKS: BlockDef[] = [
  /* ---- Text & layout */
  {
    type: 'banner',
    label: 'Page banner',
    description: 'A wide photo with the page title on a white panel. Best as the first block.',
    category: 'Text & layout',
    icon: PanelTop,
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Label on the photo' },
      title,
      { kind: 'textarea', key: 'lead', label: 'Introduction', rows: 3 },
      img(),
      btn('cta', 'Button'),
      btn('cta2', 'Second button'),
    ],
    defaults: {
      eyebrow: '',
      title: 'Page title. *With a highlight.*',
      lead: 'One or two sentences that say what this page is about.',
      image: { src: '/images/students-laptops.jpg', alt: 'Students with laptops' },
      cta: { label: 'Start a free mock', href: 'action:cbt' },
      cta2: { label: '', href: '' },
    },
  },
  {
    type: 'text',
    label: 'Text',
    description: 'A heading and paragraphs, with bullets, bold and links.',
    category: 'Text & layout',
    icon: AlignLeft,
    fields: [
      kicker,
      title,
      { kind: 'markdown', key: 'body', label: 'Text' },
      { kind: 'select', key: 'align', label: 'Alignment', options: [['left', 'Left'], ['center', 'Centred']] },
      background,
    ],
    defaults: {
      kicker: '',
      title: 'A clear heading',
      body: 'Write your text here. Leave an empty line to start a new paragraph.\n\n- Bullet points start with a dash\n- **Bold** and *italic* work too',
      align: 'left',
      bg: 'plain',
    },
  },
  {
    type: 'split',
    label: 'Image and text',
    description: 'Text with ticked points and a button beside a photo.',
    category: 'Text & layout',
    icon: Columns2,
    fields: [
      kicker,
      title,
      { kind: 'markdown', key: 'body', label: 'Text' },
      ticks('ticks'),
      btn('cta', 'Button'),
      img(),
      { kind: 'toggle', key: 'flip', label: 'Photo on the left' },
      background,
    ],
    defaults: {
      kicker: 'Why it works',
      title: 'Practice that *teaches*.',
      body: 'Explain the idea in a sentence or two.',
      ticks: ['First benefit', 'Second benefit', 'Third benefit'],
      cta: { label: 'Get started', href: '/register' },
      image: { src: '/images/tutor-session.jpg', alt: 'A tutor helping a student' },
      flip: false,
      bg: 'plain',
    },
  },
  {
    type: 'cards',
    label: 'Cards',
    description: 'A grid of cards, each with an icon or photo, a title and text.',
    category: 'Text & layout',
    icon: LayoutGrid,
    fields: [
      kicker,
      title,
      body('Introduction'),
      { kind: 'select', key: 'columns', label: 'Cards per row', options: [['2', '2'], ['3', '3'], ['4', '4']] },
      {
        kind: 'list',
        key: 'items',
        label: 'Cards',
        item: 'card',
        titleKey: 'title',
        max: 24,
        blank: { icon: 'star', image: { src: '', alt: '' }, title: 'Card title', body: 'A short description.', link: { label: '', href: '' } },
        fields: [
          { kind: 'icon', key: 'icon', label: 'Icon', help: 'Shown when the card has no photo.' },
          img('image', 'Photo (optional)'),
          { kind: 'text', key: 'title', label: 'Title' },
          { kind: 'textarea', key: 'body', label: 'Text', rows: 3 },
          btn('link', 'Link'),
        ],
      },
      background,
    ],
    defaults: {
      kicker: '',
      title: 'Everything you need',
      body: '',
      columns: '3',
      items: [
        { icon: 'target', image: { src: '', alt: '' }, title: 'Set a goal', body: 'Pick your exams and target score.', link: { label: '', href: '' } },
        { icon: 'pen', image: { src: '', alt: '' }, title: 'Practise', body: 'Timed mocks like the real hall.', link: { label: '', href: '' } },
        { icon: 'idea', image: { src: '', alt: '' }, title: 'Learn', body: 'A tutor explains every mistake.', link: { label: '', href: '' } },
      ],
      bg: 'tint',
    },
  },
  {
    type: 'buttons',
    label: 'Buttons',
    description: 'One or two buttons on their own.',
    category: 'Text & layout',
    icon: MousePointerClick,
    fields: [
      btn('primary', 'Main button'),
      btn('secondary', 'Second button'),
      { kind: 'select', key: 'align', label: 'Alignment', options: [['left', 'Left'], ['center', 'Centred']] },
    ],
    defaults: { primary: { label: 'Start a free mock', href: 'action:cbt' }, secondary: { label: '', href: '' }, align: 'center' },
  },
  {
    type: 'spacer',
    label: 'Space',
    description: 'Empty space between blocks.',
    category: 'Text & layout',
    icon: Rows3,
    fields: [{ kind: 'select', key: 'size', label: 'Height', options: [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] }],
    defaults: { size: 'md' },
  },

  /* ---- Media */
  {
    type: 'image',
    label: 'Image',
    description: 'A photo with an optional caption.',
    category: 'Media',
    icon: ImageIcon,
    fields: [
      img(),
      { kind: 'text', key: 'caption', label: 'Caption' },
      { kind: 'select', key: 'size', label: 'Width', options: [['normal', 'Text width'], ['wide', 'Wide'], ['full', 'Full width']] },
    ],
    defaults: { image: { src: '/images/cbt-lab-rows.jpg', alt: 'Rows of computers in a CBT lab' }, caption: '', size: 'wide' },
  },
  {
    type: 'video',
    label: 'Video',
    description: 'A YouTube or Vimeo video.',
    category: 'Media',
    icon: Video,
    fields: [
      { kind: 'text', key: 'url', label: 'Video link', placeholder: 'https://www.youtube.com/watch?v=…' },
      { kind: 'text', key: 'caption', label: 'Caption' },
    ],
    defaults: { url: '', caption: '' },
  },

  /* ---- Site sections (the homepage's designs) */
  {
    type: 'hero',
    label: 'Hero',
    description: 'The big homepage opener: photo, headline, score card and buttons.',
    category: 'Site sections',
    icon: LayoutTemplate,
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Tag above the headline' },
      title,
      { kind: 'textarea', key: 'lead', label: 'Introduction', rows: 3 },
      img(),
      { kind: 'text', key: 'pill', label: 'Label on the photo' },
      btn('primary', 'Main button'),
      btn('secondary', 'Second button'),
      { kind: 'toggle', key: 'showStat', label: 'Show the score card' },
      { kind: 'text', key: 'statLabel', label: 'Score card label', show: (d) => d.showStat === true },
      { kind: 'text', key: 'statValue', label: 'Score card number', show: (d) => d.showStat === true },
      { kind: 'text', key: 'statSuffix', label: 'After the number', show: (d) => d.showStat === true },
      { kind: 'text', key: 'statDelta', label: 'Score card note', show: (d) => d.showStat === true },
    ],
    defaults: {
      eyebrow: 'JAMB UTME · 2026/27 cycle',
      title: 'Your headline.\n*The highlighted part.*',
      lead: 'One or two sentences under the headline.',
      image: { src: '/images/student-cbt-focus.jpg', alt: 'A student working at a computer' },
      pill: '',
      primary: { label: 'Start a free mock', href: 'action:cbt' },
      secondary: { label: '', href: '' },
      showStat: false,
      statLabel: 'Mock score',
      statValue: '268',
      statSuffix: '/400',
      statDelta: '+34 since last week',
    },
  },
  {
    type: 'stats',
    label: 'Numbers strip',
    description: 'A row of big numbers with short labels.',
    category: 'Site sections',
    icon: Sparkles,
    fields: [
      {
        kind: 'list',
        key: 'items',
        label: 'Numbers',
        item: 'number',
        titleKey: 'value',
        max: 6,
        blank: { value: '100+', label: 'what it counts' },
        fields: [
          { kind: 'text', key: 'value', label: 'Number', help: 'Numbers like 2,400+ count up as the visitor scrolls.' },
          { kind: 'text', key: 'label', label: 'Label' },
        ],
      },
    ],
    defaults: {
      items: [
        { value: '2,400+', label: 'verified past questions' },
        { value: '2005–2025', label: 'JAMB papers covered' },
        { value: '2', label: 'teachers check every item' },
      ],
    },
  },
  {
    type: 'showcase',
    label: 'Photo showcase',
    description: 'A wide photo with the heading and benefit chips carved into it.',
    category: 'Site sections',
    icon: GalleryHorizontalEnd,
    fields: [
      img(),
      kicker,
      title,
      { kind: 'textarea', key: 'text', label: 'Text', rows: 2 },
      {
        kind: 'list',
        key: 'chips',
        label: 'Chips',
        item: 'chip',
        titleKey: 'label',
        max: 5,
        blank: { icon: 'check', label: 'A benefit' },
        fields: [
          { kind: 'icon', key: 'icon', label: 'Icon' },
          { kind: 'text', key: 'label', label: 'Text' },
        ],
      },
      btn('cta', 'Button'),
      { kind: 'text', key: 'credit', label: 'Photo credit' },
    ],
    defaults: {
      image: { src: '/images/students-laptops.jpg', alt: 'Students with laptops' },
      kicker: 'Why students choose i-Tutor',
      title: 'Study smarter. *Score higher.*',
      text: 'Practice that feels like the real hall.',
      chips: [{ icon: 'chart', label: 'Real CBT practice' }],
      cta: { label: 'Start free', href: 'action:cbt' },
      credit: '',
    },
  },
  {
    type: 'service',
    label: 'Exam service',
    description: 'A coloured panel for one exam (WAEC, NECO…): pitch, points, button and a picture.',
    category: 'Site sections',
    icon: Presentation,
    fields: [
      kicker,
      title,
      { kind: 'textarea', key: 'lead', label: 'Pitch', rows: 3 },
      { kind: 'text', key: 'when', label: 'When it runs', help: 'Shown with a calendar icon. Leave empty to hide.' },
      ticks('points', 'Points'),
      btn('cta', 'Button'),
      panel,
      { kind: 'toggle', key: 'flip', label: 'Mirror the layout' },
      {
        kind: 'select',
        key: 'visual',
        label: 'Picture beside the text',
        options: [
          ['image', 'A photo'],
          ['schools', 'List of universities'],
          ['classes', 'SS classes and subjects'],
          ['room', 'NECO practice room card'],
          ['steps', 'Three GCE steps'],
          ['series', 'NABTEB exam series'],
        ],
      },
      { ...img(), show: (d) => (d.visual ?? 'image') === 'image' },
      {
        kind: 'select',
        key: 'deco',
        label: 'Corner shape',
        options: [['steps-a', 'Shape A'], ['steps-b', 'Shape B'], ['steps-c', 'Shape C']],
      },
    ],
    defaults: {
      kicker: 'New exam',
      title: 'Your exam, *sorted.*',
      lead: 'Say who this exam is for and how i-Tutor helps.',
      when: '',
      points: ['First point', 'Second point', 'Third point'],
      cta: { label: 'Start practice', href: '/dashboard' },
      panel: 'orange',
      flip: false,
      visual: 'image',
      image: { src: '/images/cbt-lab-rows.jpg', alt: 'Rows of computers in a CBT lab' },
      deco: 'steps-b',
    },
  },
  {
    type: 'sample',
    label: 'Try a question',
    description: 'The interactive sample question with tutor hints.',
    category: 'Site sections',
    icon: ListChecks,
    fields: [kicker, title, body(), ticks('ticks')],
    defaults: {
      kicker: 'Try it now',
      title: 'Get it wrong here.\nNot in the hall.',
      body: 'Pick a subject and an answer.',
      ticks: ['Year and source on every question'],
    },
  },
  {
    type: 'features',
    label: 'Product features',
    description: 'The CBT and tutor previews, with three small feature cards.',
    category: 'Site sections',
    icon: LayoutGrid,
    fields: [
      kicker,
      title,
      { kind: 'text', key: 'cbtTitle', label: 'CBT feature: title' },
      { kind: 'textarea', key: 'cbtBody', label: 'CBT feature: text', rows: 3 },
      ticks('cbtTicks', 'CBT feature: points'),
      btn('cbtLink', 'CBT feature: link'),
      { kind: 'text', key: 'tutorTitle', label: 'Tutor feature: title' },
      { kind: 'textarea', key: 'tutorBody', label: 'Tutor feature: text', rows: 3 },
      ticks('tutorTicks', 'Tutor feature: points'),
      img('tutorImage', 'Tutor feature: photo'),
      btn('tutorLink', 'Tutor feature: link'),
      { kind: 'text', key: 'm1Title', label: 'Card 1: title' },
      { kind: 'textarea', key: 'm1Body', label: 'Card 1: text', rows: 2 },
      { kind: 'text', key: 'm2Title', label: 'Card 2: title' },
      { kind: 'textarea', key: 'm2Body', label: 'Card 2: text', rows: 2 },
      { kind: 'text', key: 'm3Title', label: 'Card 3: title' },
      { kind: 'textarea', key: 'm3Body', label: 'Card 3: text', rows: 2 },
      btn('m3Link', 'Card 3: link'),
    ],
    defaults: FEATURES_DEFAULTS,
  },
  {
    type: 'steps',
    label: 'Steps',
    description: 'Numbered steps, e.g. “How it works”.',
    category: 'Site sections',
    icon: Footprints,
    fields: [
      kicker,
      title,
      panel,
      {
        kind: 'list',
        key: 'items',
        label: 'Steps',
        item: 'step',
        titleKey: 'title',
        max: 8,
        blank: { icon: 'check', title: 'A step', body: 'What happens.' },
        fields: [
          { kind: 'icon', key: 'icon', label: 'Icon' },
          { kind: 'text', key: 'title', label: 'Title' },
          { kind: 'textarea', key: 'body', label: 'Text', rows: 2 },
        ],
      },
    ],
    defaults: {
      kicker: 'How it works',
      title: 'Three simple steps.',
      panel: 'orange-solid',
      items: [
        { icon: 'join', title: 'Create your account', body: 'Two minutes on any phone.' },
        { icon: 'target', title: 'Set your goal', body: 'Pick your exams and subjects.' },
        { icon: 'pen', title: 'Start practising', body: 'Timed mocks like the real hall.' },
      ],
    },
  },
  {
    type: 'trust',
    label: 'Labels and trust',
    description: 'A dark panel with coloured label cards.',
    category: 'Site sections',
    icon: BadgeCheck,
    fields: [
      kicker,
      title,
      body(),
      {
        kind: 'list',
        key: 'cards',
        label: 'Cards',
        item: 'card',
        titleKey: 'label',
        max: 6,
        blank: { tone: 'green', icon: 'badge', label: 'Label', body: 'What it means.' },
        fields: [
          { kind: 'select', key: 'tone', label: 'Colour', options: [['green', 'Green'], ['blue', 'Blue'], ['amber', 'Amber']] },
          { kind: 'icon', key: 'icon', label: 'Icon' },
          { kind: 'text', key: 'label', label: 'Label' },
          { kind: 'textarea', key: 'body', label: 'Text', rows: 3 },
        ],
      },
    ],
    defaults: {
      kicker: 'Content you can trust',
      title: 'Every question tells you where it came from.',
      body: '',
      cards: [{ tone: 'green', icon: 'badge', label: 'Verified Past Question', body: 'Checked by two subject teachers.' }],
    },
  },
  {
    type: 'table',
    label: 'Table',
    description: 'Text beside a three-column table, e.g. cut-off marks.',
    category: 'Site sections',
    icon: Table2,
    fields: [
      kicker,
      title,
      body(),
      btn('button', 'Button'),
      { kind: 'text', key: 'badge', label: 'Badge above the table' },
      { kind: 'text', key: 'note', label: 'Note above the table', placeholder: 'e.g. Last checked 2 Oct 2026' },
      { kind: 'text', key: 'col1', label: 'Column 1 heading' },
      { kind: 'text', key: 'col2', label: 'Column 2 heading' },
      { kind: 'text', key: 'col3', label: 'Column 3 heading' },
      {
        kind: 'list',
        key: 'rows',
        label: 'Rows',
        item: 'row',
        titleKey: 'c1',
        max: 60,
        blank: { c1: '', c2: '', c3: '' },
        fields: [
          { kind: 'text', key: 'c1', label: 'Column 1' },
          { kind: 'text', key: 'c2', label: 'Column 2' },
          { kind: 'text', key: 'c3', label: 'Column 3' },
        ],
      },
    ],
    defaults: {
      kicker: 'Admissions',
      title: 'A table heading',
      body: '',
      button: { label: '', href: '' },
      badge: '',
      note: '',
      col1: 'Institution',
      col2: 'Course',
      col3: 'Cut-off',
      rows: [{ c1: 'University of Lagos', c2: 'Medicine & Surgery', c3: '280' }],
    },
  },
  {
    type: 'pricing',
    label: 'Pricing',
    description: 'Plan cards with prices, features and buttons.',
    category: 'Site sections',
    icon: CreditCard,
    fields: [
      kicker,
      title,
      {
        kind: 'list',
        key: 'plans',
        label: 'Plans',
        item: 'plan',
        titleKey: 'name',
        max: 4,
        blank: { name: 'Plan', price: '₦0', period: '/ month', note: '', features: ['A feature'], cta: { label: 'Choose', href: '/upgrade' }, featured: false, tag: '' },
        fields: [
          { kind: 'text', key: 'name', label: 'Plan name' },
          { kind: 'text', key: 'price', label: 'Price' },
          { kind: 'text', key: 'period', label: 'After the price', placeholder: '/ month' },
          { kind: 'text', key: 'note', label: 'Note' },
          ticks('features', 'Features'),
          btn('cta', 'Button'),
          { kind: 'toggle', key: 'featured', label: 'Highlight this plan' },
          { kind: 'text', key: 'tag', label: 'Highlight tag', placeholder: 'Most chosen', show: (d) => d.featured === true },
        ],
      },
    ],
    defaults: {
      kicker: 'Pricing',
      title: 'Simple pricing.',
      plans: [
        { name: 'Free', price: '₦0', period: 'forever', note: '', features: ['Topic practice'], cta: { label: 'Start free', href: 'action:cbt' }, featured: false, tag: '' },
        { name: 'Premium', price: '₦2,500', period: '/ month', note: '', features: ['Unlimited mocks'], cta: { label: 'Get Premium', href: '/upgrade' }, featured: true, tag: 'Most chosen' },
      ],
    },
  },
  {
    type: 'team',
    label: 'Team',
    description: 'The people from Admin → Team. Hidden until someone is added there.',
    category: 'Site sections',
    icon: UsersRound,
    fields: [kicker, title],
    defaults: { kicker: 'Meet the team', title: 'The people behind *i-Tutor.*' },
  },
  {
    type: 'faq',
    label: 'Questions (FAQ)',
    description: 'Questions that open to show their answers.',
    category: 'Site sections',
    icon: CircleHelp,
    fields: [
      kicker,
      title,
      body(),
      panel,
      {
        kind: 'list',
        key: 'items',
        label: 'Questions',
        item: 'question',
        titleKey: 'q',
        max: 30,
        blank: { q: 'A question?', a: 'The answer.' },
        fields: [
          { kind: 'text', key: 'q', label: 'Question' },
          { kind: 'textarea', key: 'a', label: 'Answer', rows: 4 },
        ],
      },
    ],
    defaults: {
      kicker: 'Questions',
      title: 'Things students ask us.',
      body: '',
      panel: 'orange',
      items: [{ q: 'A question students ask?', a: 'A clear answer.' }],
    },
  },
  {
    type: 'cta',
    label: 'Call to action',
    description: 'A bold card with a headline, two buttons and a photo.',
    category: 'Site sections',
    icon: Megaphone,
    fields: [
      { kind: 'text', key: 'title', label: 'Headline' },
      body(),
      btn('primary', 'Main button'),
      btn('secondary', 'Second button'),
      img(),
    ],
    defaults: {
      title: 'Your next mock could be your best one.',
      body: 'Free to start. No card.',
      primary: { label: 'Start a free mock', href: 'action:cbt' },
      secondary: { label: 'Browse past questions', href: '/syllabus' },
      image: { src: '/images/students-at-terminals.jpg', alt: 'Students working at computers' },
    },
  },
  {
    type: 'news',
    label: 'News',
    description: 'The latest articles from Admin → News.',
    category: 'Site sections',
    icon: Newspaper,
    fields: [],
    defaults: {},
  },
];

export const BLOCK_DEFS: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map((b) => [b.type, b]));

export const CATEGORIES: BlockCategory[] = ['Text & layout', 'Media', 'Site sections'];

export const newBlockId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** A fresh copy of a block type's starting data. */
export const blankData = (type: string): BlockData => structuredClone(BLOCK_DEFS[type]?.defaults ?? {});

/** A short line describing a block in lists: its heading, or its type. */
export const blockSummary = (type: string, data: BlockData) => {
  const pick = ['title', 'kicker', 'caption', 'url'].map((k) => data[k]).find((v) => typeof v === 'string' && v.trim());
  return typeof pick === 'string' ? pick.replace(/\*/g, '').replace(/\n/g, ' ') : (BLOCK_DEFS[type]?.label ?? type);
};
