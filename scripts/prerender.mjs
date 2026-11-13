// Runs after `vite build` (see package.json). Writes plain HTML pages that
// search engines and link previews (WhatsApp, Facebook, X) can read without
// running JavaScript:
//   /past-questions                         every exam
//   /past-questions/jamb                    an exam's subjects
//   /past-questions/jamb/physics            a subject's years
//   /past-questions/jamb/physics/2019       sample questions, answers on tap
//   /past-questions/post-utme/unilag/…      Post-UTME goes by school
//   /news/<id>                              each published article
// plus the homepage's text inside #root (replaced when the app starts) and a
// full sitemap.xml. Only exams switched on in Admin → Settings → Exams are
// included. If the API can't be reached the build still succeeds; the pages
// are simply left out until the next deploy.

import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/* Vite reads .env.production for the app, but this script runs in plain Node,
   which doesn't. So a setting missing from the environment (e.g. not added in
   Vercel → Settings → Environment Variables) is taken from .env.production. */
const fromEnvFile = (name) => {
  try {
    const line = readFileSync(path.resolve('.env.production'), 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : '';
  } catch {
    return '';
  }
};
const setting = (name) => (process.env[name] ?? '').trim() || fromEnvFile(name);

const DIST = path.resolve('dist');
const SITE = (setting('SITE_URL') || 'https://i-tutor-seven.vercel.app').replace(/\/+$/, '');
const API = setting('VITE_API_URL').replace(/\/+$/, '');
const SAMPLES = 5;
const MIN_QUESTIONS = 3;

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const plain = (s) => String(s ?? '').replace(/\$+([^$]*)\$+/g, '$1').replace(/\s+/g, ' ').trim();

async function get(p) {
  const res = await fetch(`${API}${p}`, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${p}: ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------- Page shell */

const STYLE = `
:root{--ink:#0b1f1e;--ink2:#3d5352;--ink3:#5c6d6c;--brand:#0e3b3a;--accent:#b8520b;--mist:#f2f6f5;--rule:#dfe7e6}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:#fff;line-height:1.6}
a{color:var(--brand)}header.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid var(--rule)}
header.top a.logo{font-weight:800;font-size:1.15rem;text-decoration:none;color:var(--brand)}
.btn{display:inline-block;padding:12px 20px;border-radius:999px;background:var(--accent);color:#fff;font-weight:700;text-decoration:none}
main{max-width:820px;margin:0 auto;padding:24px 16px 64px}nav.crumbs{font-size:.9rem;color:var(--ink3);margin-bottom:8px}
h1{font-size:clamp(1.6rem,4vw,2.2rem);line-height:1.2;margin:.2em 0 .4em}.lead{color:var(--ink2);font-size:1.05rem}
ol.qs{padding-left:1.2em}ol.qs>li{margin:0 0 22px;padding:16px;border:1px solid var(--rule);border-radius:14px;background:#fff}
ol.qs ul{list-style:none;padding:0;margin:10px 0}ol.qs ul li{padding:4px 0}details{margin-top:6px}summary{cursor:pointer;color:var(--brand);font-weight:600}
.links{display:flex;flex-wrap:wrap;gap:10px;padding:0;list-style:none}.links a{display:inline-block;padding:10px 14px;border:1px solid var(--rule);border-radius:12px;text-decoration:none;background:var(--mist)}
.cta{margin:28px 0;padding:20px;border-radius:16px;background:var(--mist)}footer{border-top:1px solid var(--rule);padding:20px;text-align:center;color:var(--ink3);font-size:.9rem}
article p{margin:0 0 1em}`;

function page({ url, title, description, body, ld }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${SITE}${url}" />
<meta name="theme-color" content="#0E3B3A" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="i-Tutor" />
<meta property="og:url" content="${SITE}${url}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${SITE}/hero-student.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
<style>${STYLE}</style>
</head>
<body>
<header class="top"><a class="logo" href="/">i-Tutor</a><a class="btn" href="/register">Practise free</a></header>
<main>${body}</main>
<footer>© ${new Date().getFullYear()} i-Tutor · <a href="/past-questions">Past questions</a> · <a href="/">Home</a></footer>
</body>
</html>
`;
}

const crumbs = (items) =>
  `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([label, href]) => (href ? `<a href="${href}">${esc(label)}</a>` : esc(label))).join(' › ')}</nav>`;

async function write(url, html) {
  const file = path.join(DIST, url, 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

/* ------------------------------------------------------------------- Main */

async function main() {
  if (!API) {
    console.log('prerender: VITE_API_URL is not set, so no public pages were written.');
    return;
  }
  const [exams, questions, news] = await Promise.all([get('/api/exams'), get('/api/questions'), get('/api/news').catch(() => [])]);
  const live = exams.filter((e) => e.enabled);
  const examById = new Map(live.map((e) => [e.id, e]));
  const urls = ['/', '/past-questions'];

  // exam → (school) → subject → year → questions
  const tree = new Map();
  for (const q of questions) {
    const exam = examById.get(q.examType);
    if (!exam || !q.year || q.status !== 'published') continue;
    const school = exam.kind === 'school' ? q.school || '' : '';
    if (exam.kind === 'school' && !school) continue;
    const key = [exam.id, school, q.subject, q.year].join('|');
    if (!tree.has(key)) tree.set(key, []);
    tree.get(key).push(q);
  }
  const papers = [...tree.entries()]
    .map(([key, qs]) => {
      const [examId, school, subject, year] = key.split('|');
      return { exam: examById.get(examId), school, subject, year: Number(year), qs };
    })
    .filter((p) => p.qs.length >= MIN_QUESTIONS);

  const base = (p) => `/past-questions/${slug(p.exam.label)}${p.school ? `/${slug(p.school)}` : ''}`;
  const name = (p) => `${p.exam.label}${p.school ? ` ${p.school}` : ''}`;

  // One page per paper.
  for (const p of papers) {
    const url = `${base(p)}/${slug(p.subject)}/${p.year}`;
    const title = `${name(p)} ${p.subject} ${p.year} past questions and answers | i-Tutor`;
    const samples = p.qs.slice(0, SAMPLES);
    const description = `${p.qs.length} ${name(p)} ${p.subject} ${p.year} past questions with answers and explanations. Try ${samples.length} free here, then practise all of them in a timed CBT.`;
    const items = samples
      .map(
        (q) => `<li><p>${esc(plain(q.question))}</p>${q.image ? `<img src="${esc(q.image.startsWith('/') ? SITE + q.image : q.image)}" alt="${esc(q.imageAlt || 'Diagram for this question')}" loading="lazy" style="max-width:100%;max-height:320px;border:1px solid #dfe7e6;border-radius:10px;background:#fff" />` : ''}<ul>${(q.options || []).map((o) => `<li><b>${esc(o.label)}.</b> ${esc(plain(o.text))}</li>`).join('')}</ul>
<details><summary>Show answer</summary><p><b>Answer: ${esc(q.correctAnswer)}</b>${q.explanation ? ` — ${esc(plain(q.explanation))}` : ''}</p></details></li>`,
      )
      .join('\n');
    const body = `${crumbs([['Past questions', '/past-questions'], [name(p), base(p)], [p.subject, `${base(p)}/${slug(p.subject)}`], [String(p.year)]])}
<h1>${esc(name(p))} ${esc(p.subject)} ${p.year} past questions</h1>
<p class="lead">${p.qs.length} real ${esc(p.exam.name)} ${esc(p.subject)} questions from ${p.year}, with answers. Here are ${samples.length} to try; tap “Show answer” to check yourself.</p>
<ol class="qs">${items}</ol>
<div class="cta"><h2>Practise all ${p.qs.length} questions in a real CBT</h2><p>Timed like the real exam, with an AI tutor that explains every answer step by step.</p><a class="btn" href="/register">Start practising free</a></div>`;
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: `${name(p)} ${p.subject} ${p.year} past questions`,
      educationalLevel: 'Secondary school',
      about: p.subject,
      hasPart: samples.map((q) => ({
        '@type': 'Question',
        name: plain(q.question).slice(0, 300),
        acceptedAnswer: { '@type': 'Answer', text: plain((q.options || []).find((o) => o.label === q.correctAnswer)?.text || q.correctAnswer) },
      })),
    };
    await write(url, page({ url, title, description, body, ld }));
    urls.push(url);
  }

  // Subject pages (list of years), exam pages (list of subjects), index.
  const group = (list, keyOf) => {
    const m = new Map();
    for (const x of list) {
      const k = keyOf(x);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    }
    return m;
  };
  for (const [, list] of group(papers, (p) => `${base(p)}|${p.subject}`)) {
    const p = list[0];
    const url = `${base(p)}/${slug(p.subject)}`;
    const years = list.sort((a, b) => b.year - a.year);
    const total = years.reduce((n, x) => n + x.qs.length, 0);
    const body = `${crumbs([['Past questions', '/past-questions'], [name(p), base(p)], [p.subject]])}
<h1>${esc(name(p))} ${esc(p.subject)} past questions</h1>
<p class="lead">${total} ${esc(p.subject)} questions from ${years.length} year${years.length === 1 ? '' : 's'}, with answers. Pick a year.</p>
<ul class="links">${years.map((y) => `<li><a href="${url}/${y.year}">${y.year} (${y.qs.length})</a></li>`).join('')}</ul>`;
    await write(url, page({ url, title: `${name(p)} ${p.subject} past questions and answers | i-Tutor`, description: `${name(p)} ${p.subject} past questions with answers, ${years[years.length - 1].year}–${years[0].year}. Practise free on i-Tutor.`, body }));
    urls.push(url);
  }
  const byExam = group(papers, (p) => base(p));
  for (const [url, list] of byExam) {
    const p = list[0];
    const subjects = [...new Set(list.map((x) => x.subject))].sort();
    const body = `${crumbs([['Past questions', '/past-questions'], [name(p)]])}
<h1>${esc(name(p))} past questions and answers</h1>
<p class="lead">${esc(p.exam.desc || p.exam.name)} Choose a subject.</p>
<ul class="links">${subjects.map((s) => `<li><a href="${url}/${slug(s)}">${esc(s)}</a></li>`).join('')}</ul>`;
    await write(url, page({ url, title: `${name(p)} past questions and answers by subject | i-Tutor`, description: `${name(p)} past questions in ${subjects.slice(0, 6).join(', ')} and more, with answers.`, body }));
    urls.push(url);
  }
  const examLinks = [...byExam.entries()].map(([url, list]) => `<li><a href="${url}">${esc(name(list[0]))}</a></li>`).join('');
  await write(
    '/past-questions',
    page({
      url: '/past-questions',
      title: 'Past questions and answers: ' + live.map((e) => e.label).join(', ') + ' | i-Tutor',
      description: `Free past questions with answers for ${live.map((e) => e.label).join(', ')}. Practise in a timed CBT with an AI tutor.`,
      body: `<h1>Past questions and answers</h1><p class="lead">Real past questions with answers. Choose an exam.</p><ul class="links">${examLinks}</ul>`,
    }),
  );

  // News articles.
  const articles = news.filter((n) => n.status !== 'draft');
  for (const n of articles) {
    const url = `/news/${slug(n.id)}`;
    const body = `${crumbs([['News', '/#news'], [n.title]])}
<article><h1>${esc(n.title)}</h1><p class="lead">${esc(n.summary)}</p><p><small>${esc(n.date)}</small></p>
${(n.body || []).map((para) => `<p>${esc(para)}</p>`).join('\n')}
${n.sourceUrl ? `<p>Source: <a href="${esc(n.sourceUrl)}" rel="nofollow noopener">${esc(n.source || n.sourceUrl)}</a></p>` : ''}</article>
<div class="cta"><a class="btn" href="/register">Practise for your exam free</a></div>`;
    const ld = { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: n.title, description: n.summary, datePublished: n.date, publisher: { '@type': 'Organization', name: 'i-Tutor' } };
    await write(url, page({ url, title: `${n.title} | i-Tutor`, description: n.summary, body, ld }));
    urls.push(url);
  }

  // The homepage: real text inside #root for crawlers; the app replaces it when it starts.
  const indexFile = path.join(DIST, 'index.html');
  const index = await readFile(indexFile, 'utf8');
  const names = live.map((e) => e.label);
  const homeText = `<div class="prerender"><h1>i-Tutor: ${esc(names.join(', '))} past questions, CBT practice and an AI tutor</h1>
<p>Real past questions with answers, timed CBT practice exams, and an AI tutor that explains every answer step by step. Built for Nigerian students.</p>
<ul>${[...byExam.entries()].map(([url, list]) => `<li><a href="${url}">${esc(name(list[0]))} past questions</a></li>`).join('')}</ul>
<p><a href="/register">Start practising free</a></p></div>`;
  if (index.includes('<div id="root"></div>')) await writeFile(indexFile, index.replace('<div id="root"></div>', `<div id="root">${homeText}</div>`));

  // Sitemap with every page.
  const today = new Date().toISOString().slice(0, 10);
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  console.log(`prerender: ${papers.length} papers, ${articles.length} articles, ${urls.length} URLs in the sitemap.`);
}

main().catch((err) => {
  // Never fail the deploy over this: the site works without these pages.
  console.warn('prerender skipped:', err.message);
});
