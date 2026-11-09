import type { ContentReport, DayReport, LoginsReport, LogRow, LogsReport, ReportMap, ReportName, SubjectCoverage, SystemReport, UsersReport } from '../services/reports';

/* Turning a report into a file: a PDF (a styled page printed by the
   browser: "Save as PDF") or a CSV that opens in Excel. Charts are plain SVG,
   so they look the same on screen, in the PDF and on paper. */

/* ------------------------------------------------------------ Formatting */

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const LAGOS = 'Africa/Lagos';
export const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: LAGOS, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const timeOnly = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { timeZone: LAGOS, hour: '2-digit', minute: '2-digit' });
export const longDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const monthName = (month: string, short = false) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString('en-GB', { month: short ? 'short' : 'long', year: short ? '2-digit' : 'numeric' });
export const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;
export const num = (n: number) => n.toLocaleString('en-NG');
export const today = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);

/** 1999, 2000, 2001, 2004 → "1999–2001, 2004". */
export function yearRanges(years: number[]): string {
  const out: string[] = [];
  const list = [...new Set(years)].sort((a, b) => a - b);
  for (let i = 0; i < list.length; i += 1) {
    const start = list[i]!;
    let end = start;
    while (list[i + 1] === end + 1) end = list[++i]!;
    out.push(end === start ? `${start}` : `${start}–${end}`);
  }
  return out.join(', ');
}

/** Years from `from` to this year with no questions at all. */
export const missingYears = (s: SubjectCoverage, from: number, to = new Date().getFullYear()) => {
  const have = new Set([...s.done, ...s.review]);
  const out: number[] = [];
  for (let y = from; y <= to; y += 1) if (!have.has(y)) out.push(y);
  return out;
};

export type CoverageState = 'done' | 'review' | 'waiting';
export const coverageState = (s: SubjectCoverage): CoverageState => (s.done.length ? 'done' : s.review.length || s.drafts ? 'review' : 'waiting');
export const COVERAGE_LABEL: Record<CoverageState, string> = { done: 'Done ✓', review: 'In review', waiting: 'Waiting for upload' };

export const KIND_LABEL: Record<string, string> = {
  action: 'Action',
  login: 'Signed in',
  'login-failed': 'Failed sign-in',
  logout: 'Signed out',
  download: 'Download',
};
export const roleLabel = (r: string) => (r === 'superadmin' ? 'Super admin' : r === 'admin' ? 'Admin' : 'System');
export const byWho = (r: LogRow) => r.who || (r.kind === 'login-failed' ? 'Unknown' : 'System');

/* ---------------------------------------------------------------- Charts */

export interface Series {
  name: string;
  values: number[];
  color: string;
}

export const CHART_COLORS = { teal: '#0e3b3a', amber: '#e8a33d', green: '#0f7b4f', blue: '#1d4ed8' };

/** Grouped bars with a light grid. Labels and values are escaped. */
export function barChartSvg(labels: string[], series: Series[], { height = 240, money = false } = {}): string {
  const W = 720;
  const H = height;
  const left = 44;
  const bottom = 30;
  const top = 18;
  const plotW = W - left - 8;
  const plotH = H - top - bottom;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const step = niceStep(max);
  const ceil = Math.ceil(max / step) * step;
  const y = (v: number) => top + plotH - (v / ceil) * plotH;
  const groupW = plotW / Math.max(1, labels.length);
  const barW = Math.max(3, Math.min(26, (groupW * 0.72) / series.length));
  const short = (v: number) => (money ? (v >= 1e6 ? `${(v / 1e6).toFixed(1)}m` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : `${v}`) : num(v));
  const every = Math.ceil(labels.length / 12);

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Outfit, 'Segoe UI', Arial, sans-serif" style="width:100%;height:auto;display:block">`;
  for (let v = 0; v <= ceil; v += step) {
    svg += `<line x1="${left}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" stroke="#e3e9e8" stroke-width="1"/>`;
    svg += `<text x="${left - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#5c6d6c">${esc(short(v))}</text>`;
  }
  labels.forEach((label, i) => {
    const gx = left + groupW * i + (groupW - barW * series.length) / 2;
    series.forEach((s, k) => {
      const v = s.values[i] ?? 0;
      const h = Math.max(v ? 2 : 0, top + plotH - y(v));
      svg += `<rect x="${gx + k * barW}" y="${top + plotH - h}" width="${barW - 2}" height="${h}" rx="3" fill="${s.color}"><title>${esc(`${s.name}, ${label}: ${money ? naira(v) : num(v)}`)}</title></rect>`;
      if (v && labels.length <= 12 && series.length <= 3)
        svg += `<text x="${gx + k * barW + (barW - 2) / 2}" y="${top + plotH - h - 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#3d4f4e">${esc(short(v))}</text>`;
    });
    if (i % every === 0) svg += `<text x="${left + groupW * i + groupW / 2}" y="${H - 10}" text-anchor="middle" font-size="11" fill="#5c6d6c">${esc(label)}</text>`;
  });
  return `${svg}</svg>`;
}

function niceStep(max: number) {
  const raw = max / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export const legendHtml = (series: Series[]) =>
  `<p class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</p>`;

/* ------------------------------------------------------------------- PDF */

const STYLE = `
@page { size: A4; margin: 16mm 14mm 18mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; color: #0b1f1e; font: 400 10.5pt/1.55 Outfit, 'Segoe UI', Roboto, Arial, sans-serif; }
h1, h2, h3 { font-family: Manrope, Outfit, 'Segoe UI', Arial, sans-serif; letter-spacing: -0.01em; margin: 0; }
.top { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #0e3b3a; margin-bottom: 18px; }
.brand { font: 800 13pt Manrope, Outfit, sans-serif; color: #0e3b3a; }
.brand small { display: block; font: 500 8.5pt Outfit, sans-serif; color: #5c6d6c; letter-spacing: 0.06em; text-transform: uppercase; }
h1 { font-size: 19pt; font-weight: 800; color: #0b1f1e; margin-top: 4px; }
.sub { color: #3d4f4e; font-size: 10.5pt; margin-top: 2px; }
.meta { text-align: right; color: #5c6d6c; font-size: 8.5pt; line-height: 1.5; white-space: nowrap; }
h2 { font-size: 12.5pt; font-weight: 700; color: #0e3b3a; margin: 22px 0 8px; break-after: avoid; }
h3 { font-size: 10.5pt; font-weight: 700; margin: 14px 0 6px; break-after: avoid; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 6px 0 4px; }
.stat { border: 1px solid #e3e9e8; border-radius: 8px; padding: 8px 10px; break-inside: avoid; }
.stat b { display: block; font: 800 14pt Manrope, Outfit, sans-serif; color: #0e3b3a; }
.stat span { font-size: 8.5pt; color: #5c6d6c; }
table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 4px 0 8px; }
thead { display: table-header-group; }
th { text-align: left; font-weight: 600; color: #3d4f4e; background: #f5f7f6; padding: 6px 8px; border-bottom: 1px solid #d2dcdb; }
td { padding: 5px 8px; border-bottom: 1px solid #eef2f1; vertical-align: top; }
tr { break-inside: avoid; }
td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
td.t { white-space: nowrap; color: #3d4f4e; }
.tag { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 8pt; font-weight: 600; white-space: nowrap; }
.tag.done { background: #e7f5ee; color: #0f7b4f; }
.tag.review { background: #fdf3e2; color: #9a5a06; }
.tag.waiting { background: #f5f7f6; color: #5c6d6c; }
.tag.bad { background: #fdecea; color: #c2352b; }
.muted { color: #5c6d6c; }
.small { font-size: 8.5pt; }
.chart { border: 1px solid #e3e9e8; border-radius: 8px; padding: 10px 10px 4px; break-inside: avoid; margin: 6px 0; }
.legend { display: flex; gap: 16px; font-size: 8.5pt; color: #3d4f4e; margin: 4px 0 0; }
.legend i { display: inline-block; width: 9px; height: 9px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
.foot { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e3e9e8; font-size: 8pt; color: #5c6d6c; }
.howto { background: #f5f7f6; border-radius: 8px; padding: 10px 12px; font-size: 9pt; color: #3d4f4e; margin: 10px 0 4px; break-inside: avoid; }
.howto b { color: #0b1f1e; }
.howto ul { margin: 4px 0 0; padding-left: 16px; }
.bar { display: inline-block; width: 70px; height: 7px; border-radius: 99px; background: #e3e9e8; vertical-align: middle; overflow: hidden; }
.bar i { display: block; height: 100%; background: #0f7b4f; border-radius: 99px; }
.pct { display: inline-block; min-width: 32px; text-align: right; font-size: 8.5pt; color: #3d4f4e; margin-left: 4px; }
.need { border: 1.5px solid #e8a33d; background: #fffaf0; border-radius: 8px; padding: 4px 12px 8px; margin: 12px 0; }
.need h3 { color: #9a5a06; margin-top: 8px; }
.need td { font-size: 10pt; }
.need .box { display: inline-block; width: 10px; height: 10px; border: 1.5px solid #5c6d6c; border-radius: 2px; margin-right: 8px; vertical-align: -1px; }
.exam { break-before: page; }
.exam:first-of-type { break-before: auto; }
`;

/** A whole report page: header, the sections, a footer. */
function page(title: string, sub: string, body: string, by: string) {
  const made = new Date().toLocaleString('en-GB', { timeZone: LAGOS, dateStyle: 'medium', timeStyle: 'short' });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Outfit:wght@400;500;600&display=swap">
<style>${STYLE}</style></head><body>
<header class="top"><div><div class="brand">i-Tutor<small>Admin report</small></div><h1>${esc(title)}</h1><div class="sub">${esc(sub)}</div></div>
<div class="meta">Made ${esc(made)} (Lagos time)<br>By ${esc(by)}</div></header>
${body}
<p class="foot">i-Tutor · ${esc(title)} · Confidential: for i-Tutor admins only.</p>
</body></html>`;
}

const stats = (items: Array<[string, string | number]>) =>
  `<div class="stats">${items.map(([label, v]) => `<div class="stat"><b>${esc(typeof v === 'number' ? num(v) : v)}</b><span>${esc(label)}</span></div>`).join('')}</div>`;

const table = (head: string[], rows: Array<Array<string | number>>, numeric: number[] = []) =>
  `<table><thead><tr>${head.map((h, i) => `<th${numeric.includes(i) ? ' class="n"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => `<td${numeric.includes(i) ? ' class="n"' : ''}>${typeof c === 'number' ? num(c) : c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;

const logTable = (rows: LogRow[], dateCol = true) =>
  rows.length
    ? table(
        [dateCol ? 'When' : 'Time', 'Who', 'What', 'Type'],
        rows.map((r) => [
          `<span class="t">${esc(dateCol ? when(r.at) : timeOnly(r.at))}</span>`,
          `${esc(byWho(r))}<br><span class="muted small">${esc(roleLabel(r.role))}</span>`,
          `${esc(r.text)}${r.ip ? `<br><span class="muted small">From ${esc(r.ip)}</span>` : ''}`,
          `<span class="tag ${r.kind === 'login-failed' ? 'bad' : r.kind === 'action' ? 'waiting' : 'done'}">${esc(KIND_LABEL[r.kind] ?? r.kind)}</span>`,
        ]),
      )
    : '<p class="muted">Nothing in this period.</p>';

const coverageRows = (subjects: SubjectCoverage[], fromYear: number) =>
  table(
    ['Subject', 'Status', 'Years covered', 'Published years', 'Waiting to be published', `Missing since ${fromYear}`, 'Questions'],
    subjects.map((s) => {
      const st = coverageState(s);
      return [
        `<b>${esc(s.subject)}</b>`,
        `<span class="tag ${st}">${esc(COVERAGE_LABEL[st])}</span>`,
        `<span style="white-space:nowrap">${barHtml(coveragePercent(s, fromYear))}</span>`,
        esc(yearRanges(s.done) || '–'),
        esc(yearRanges(s.review) || '–'),
        st === 'waiting' ? '<span class="muted">All years</span>' : esc(yearRanges(missingYears(s, fromYear)) || 'None'),
        `${num(s.published)}${s.drafts ? `<br><span class="muted small">+${num(s.drafts)} drafts</span>` : ''}`,
      ];
    }),
    [6],
  );

/** The checklist for the people finding papers: each subject and the years it still needs. */
const neededList = (subjects: SubjectCoverage[], from: number) => {
  const rows = subjects
    .map((s) => ({ s, years: missingYears(s, from) }))
    .filter((x) => x.years.length)
    .sort((a, b) => b.years.length - a.years.length);
  if (!rows.length) return `<div class="need"><b>Years we still need:</b> none. Every subject has questions for every year from ${from}.</div>`;
  return `<div class="need"><h3>Years we still need to find (${from} to ${new Date().getFullYear()})</h3><table><thead><tr><th>Subject</th><th>Missing years</th><th class="n">How many</th></tr></thead><tbody>${rows
    .map(
      ({ s, years }) =>
        `<tr><td><span class="box"></span><b>${esc(s.subject)}</b></td><td>${esc(coverageState(s) === 'waiting' ? `All years (${yearRanges(years)})` : yearRanges(years))}</td><td class="n">${years.length}</td></tr>`,
    )
    .join('')}</tbody></table></div>`;
};

/** One exam's section: summary figures, the subject table and the year grid. */
const examSection = (name: string, subjects: SubjectCoverage[], from: number, heading: string) => {
  const count = (st: CoverageState) => subjects.filter((s) => coverageState(s) === st).length;
  const published = subjects.reduce((n, s) => n + s.published, 0);
  const drafts = subjects.reduce((n, s) => n + s.drafts, 0);
  const avg = subjects.length ? Math.round(subjects.reduce((n, s) => n + coveragePercent(s, from), 0) / subjects.length) : 0;
  return (
    heading +
    stats([
      ['Subjects', subjects.length],
      ['Subjects with published papers', count('done')],
      ['Subjects waiting to be published', count('review')],
      ['Subjects with nothing yet', count('waiting')],
      ['Published questions', published],
      ['Questions waiting (drafts)', drafts],
      ['Average years covered', `${avg}%`],
      [`Years counted`, `${from}–${new Date().getFullYear()}`],
    ]) +
    (subjects.length
      ? `${neededList(subjects, from)}<h3>Subject by subject</h3>${coverageRows(subjects, from)}<h3>Year by year</h3><div class="chart">${yearGridSvg(subjects, from)}${gridLegendHtml()}</div>`
      : `<p class="muted">No subjects for ${esc(name)} yet: waiting for upload.</p>`)
  );
};

const HOWTO = (from: number) => `<div class="howto"><b>How to read this report</b><ul>
<li><b>Published</b>: the questions are live; students can practise them.</li>
<li><b>Waiting to be published</b>: the questions are uploaded as drafts; an admin still has to publish them.</li>
<li><b>Missing</b>: no questions at all for that year (counted from ${from} to this year).</li>
<li><b>Years covered</b>: the share of those years that have questions, published or waiting.</li></ul></div>`;

export interface ExportContext {
  /** Who is downloading, for the header. */
  by: string;
  /** Content report: the first year counted as missing. */
  fromYear?: number;
  /** Content report: only this exam (its id); empty means every exam. */
  exam?: string;
}

/* ------------------------------------------------- Past-question coverage */

/** Share of the years from `from` to this year that have any questions (published or draft). */
export const coveragePercent = (s: SubjectCoverage, from: number, to = new Date().getFullYear()) => {
  const have = new Set([...s.done, ...s.review].filter((y) => y >= from && y <= to));
  return Math.round((have.size / Math.max(1, to - from + 1)) * 100);
};

export const GRID_COLORS = { done: '#0f7b4f', review: '#e8a33d', missing: '#e3e9e8' };

/** One row per subject, one small square per year: green published, amber drafts only, grey nothing. */
export function yearGridSvg(subjects: SubjectCoverage[], from: number, to = new Date().getFullYear()): string {
  const years: number[] = [];
  for (let y = from; y <= to; y += 1) years.push(y);
  const W = 720;
  const left = 132;
  const top = 22;
  const row = 17;
  const cell = Math.min(16, (W - left - 6) / Math.max(1, years.length));
  const H = top + subjects.length * row + 6;
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Years covered for each subject" font-family="Outfit, 'Segoe UI', Arial, sans-serif" style="width:100%;height:auto;display:block">`;
  years.forEach((y, i) => {
    if (y % 5 === 0 || i === 0 || i === years.length - 1)
      svg += `<text x="${left + i * cell + cell / 2}" y="${top - 8}" text-anchor="middle" font-size="9.5" fill="#5c6d6c">${y}</text>`;
  });
  subjects.forEach((s, r) => {
    const yy = top + r * row;
    const done = new Set(s.done);
    const review = new Set(s.review);
    const name = s.subject.length > 22 ? `${s.subject.slice(0, 21)}…` : s.subject;
    svg += `<text x="${left - 8}" y="${yy + row / 2 + 4}" text-anchor="end" font-size="10.5" fill="#0b1f1e">${esc(name)}</text>`;
    years.forEach((y, i) => {
      const st = done.has(y) ? 'done' : review.has(y) ? 'review' : 'missing';
      const label = st === 'done' ? 'published' : st === 'review' ? 'drafts, not yet published' : 'no questions';
      svg += `<rect x="${left + i * cell + 1}" y="${yy + 2}" width="${cell - 2}" height="${row - 4}" rx="2" fill="${GRID_COLORS[st]}"><title>${esc(`${s.subject} ${y}: ${label}`)}</title></rect>`;
    });
  });
  return `${svg}</svg>`;
}

export const gridLegendHtml = () =>
  `<p class="legend"><span><i style="background:${GRID_COLORS.done}"></i>Published (students can use it)</span><span><i style="background:${GRID_COLORS.review}"></i>Uploaded, waiting to be published</span><span><i style="background:${GRID_COLORS.missing}"></i>No questions yet</span></p>`;

const barHtml = (pct: number) =>
  `<span class="bar"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span><span class="pct">${pct}%</span>`;

export function reportPdf<K extends ReportName>(name: K, data: ReportMap[K], ctx: ExportContext): { title: string; html: string } {
  switch (name) {
    case 'logs': {
      const d = data as LogsReport;
      const title = 'Admin log history';
      const sub = `${longDay(d.from)} to ${longDay(d.to)} · ${num(d.rows.length)} entries${d.truncated ? ' (the newest 3,000)' : ''}`;
      const whoCount = new Map<string, number>();
      for (const r of d.rows) whoCount.set(byWho(r), (whoCount.get(byWho(r)) ?? 0) + 1);
      const body =
        stats([
          ['Entries', d.rows.length],
          ['Actions', d.rows.filter((r) => r.kind === 'action').length],
          ['Sign-ins', d.rows.filter((r) => r.kind === 'login').length],
          ['Failed sign-ins', d.rows.filter((r) => r.kind === 'login-failed').length],
        ]) +
        `<h2>By person</h2>${table(['Who', 'Entries'], [...whoCount.entries()].sort((a, b) => b[1] - a[1]).map(([w, n]) => [esc(w), n]), [1])}` +
        `<h2>Everything, newest first</h2>${logTable(d.rows)}`;
      return { title, html: page(title, sub, body, ctx.by) };
    }
    case 'logins': {
      const d = data as LoginsReport;
      const title = 'Admin sign-ins';
      const sub = `${longDay(d.from)} to ${longDay(d.to)}`;
      const body =
        stats([
          ['Admins', d.admins.length],
          ['Sign-ins', d.rows.filter((r) => r.kind === 'login').length],
          ['Failed sign-ins', d.rows.filter((r) => r.kind === 'login-failed').length],
          ['Unknown emails tried', d.unknownFailed],
        ]) +
        `<h2>Admins</h2>${table(
          ['Admin', 'Role', 'Last signed in', 'Sign-ins', 'Failed'],
          d.admins.map((a) => [
            `<b>${esc(a.name)}</b><br><span class="muted small">${esc(a.email)}</span>`,
            esc(roleLabel(a.role)) + (a.status !== 'active' ? ' <span class="tag review">Invited</span>' : ''),
            esc(a.lastLoginAt ? when(a.lastLoginAt) : 'Never'),
            a.signIns,
            a.failed ? `<span class="tag bad">${a.failed}</span>` : '0',
          ]),
          [3, 4],
        )}` +
        `<h2>Every sign-in and sign-out</h2>${logTable(d.rows)}`;
      return { title, html: page(title, sub, body, ctx.by) };
    }
    case 'content': {
      const d = data as ContentReport;
      const from = ctx.fromYear ?? 1978;
      const exams = d.exams.filter((e) => !ctx.exam || e.id === ctx.exam);
      const one = ctx.exam && exams.length === 1 ? exams[0]! : null;
      const title = one ? `${one.name} past questions` : 'Past questions report';
      const sub = one
        ? 'Which subjects and years are published, which are waiting, and which are still missing'
        : 'Every exam: what is published, what is waiting, and what is still missing';
      let body = HOWTO(from);
      for (const e of exams) {
        const off = e.enabled ? '' : ' <span class="tag waiting">Switched off</span>';
        body += `<section class="exam">`;
        if (e.kind === 'school') {
          body += `<h2>${esc(e.name)}${off}</h2>`;
          body += e.schools.length
            ? e.schools.map((s) => examSection(s.school, s.subjects, from, `<h3>${esc(s.school)}</h3>`)).join('')
            : '<p class="muted">No Post-UTME papers yet: waiting for upload.</p>';
        } else {
          body += examSection(e.name, e.subjects, from, one ? '' : `<h2>${esc(e.name)}${off}</h2>`);
        }
        body += `</section>`;
      }
      if (!one && d.practice.length) {
        body += `<h2>Practice questions (by syllabus)</h2>${table(
          ['Subject', 'Published', 'Drafts'],
          d.practice.map((p) => [`<b>${esc(p.subject)}</b>`, p.published, p.drafts]),
          [1, 2],
        )}`;
      }
      return { title, html: page(title, sub, body, ctx.by) };
    }
    case 'system': {
      const d = data as SystemReport;
      const t = d.totals;
      const title = 'Full system report';
      const sub = `Everything in i-Tutor now, and day by day from ${longDay(d.from)} to ${longDay(d.to)}`;
      const days = [...d.days].reverse();
      const series: Series[] = [{ name: 'New students', values: days.map((x) => x.newStudents), color: CHART_COLORS.teal }];
      const body =
        `<h2>Students and money</h2>` +
        stats([
          ['Students', t.students],
          ['Verified', t.verified],
          ['Premium now', t.premium],
          ['Have ever paid', t.everPaid],
          ['Payments', t.payments],
          ['Money received', naira(t.revenueNaira)],
          ['Practice sessions', t.practiceSessions],
          ['Admins', t.admins],
        ]) +
        `<h2>Content</h2>` +
        stats([
          ['Published questions', t.questionsPublished],
          ['Draft questions', t.questionsDraft],
          ['Need review', t.needsReview],
          ['Papers', t.papers],
          ['News posts', t.news],
          ['Website pages', t.pages],
          ['Courses', t.courses],
          ['Images', t.images],
        ]) +
        `<h2>AI</h2>` +
        stats([
          ['AI requests', t.aiRequests],
          ['Failed AI requests', t.aiFailed],
          ['AI cost (estimate)', naira(t.aiNaira)],
          ['In this period', naira(d.period.aiNaira)],
        ]) +
        `<h2>In this period</h2>` +
        stats([
          ['New students', d.period.newStudents],
          ['Payments', d.period.payments],
          ['Money received', naira(d.period.revenueNaira)],
          ['Questions added', d.period.questionsAdded],
          ['Practice sessions', d.period.practiceSessions],
          ['AI requests', d.period.aiRequests],
          ['Admin actions', d.period.adminActions],
          ['Admin sign-ins', d.period.signIns],
        ]) +
        `<div class="chart">${barChartSvg(days.map((x) => x.date.slice(5).split('-').reverse().join('/')), series, { height: 200 })}${legendHtml(series)}</div>` +
        `<h2>Day by day</h2>${dayTable(d.days)}`;
      return { title, html: page(title, sub, body, ctx.by) };
    }
    case 'day': {
      const d = data as DayReport;
      const s = d.summary;
      const title = 'Daily report';
      const sub = longDay(d.date);
      const body =
        stats([
          ['New students', s.newStudents],
          ['Payments', s.payments],
          ['Money received', naira(s.revenueNaira)],
          ['Questions added', s.questionsAdded],
          ['Practice sessions', s.practiceSessions],
          ['Students who practised', s.activeStudents],
          ['AI requests', s.aiRequests],
          ['Admin actions', s.adminActions],
        ]) +
        `<h2>Questions added</h2>${
          d.papers.length
            ? table(
                ['Paper', 'Published', 'Drafts'],
                d.papers.map((p) => [esc(paperName(p)), p.published, p.drafts]),
                [1, 2],
              )
            : '<p class="muted">None.</p>'
        }` +
        `<h2>New students</h2>${
          d.students.length
            ? table(
                ['Time', 'Name', 'Exams', 'Verified'],
                d.students.map((u) => [esc(timeOnly(u.at)), esc(u.name), esc(u.exams.join(', ') || '–'), u.verified ? 'Yes' : 'Not yet']),
              )
            : '<p class="muted">None.</p>'
        }` +
        `<h2>Payments</h2>${
          d.payments.length
            ? table(['Time', 'Student', 'Plan', 'Amount'], d.payments.map((p) => [esc(timeOnly(p.at)), esc(p.name), esc(p.plan), esc(naira(p.naira))]), [3])
            : '<p class="muted">None.</p>'
        }` +
        `<h2>What admins did</h2>${logTable(d.activity, false)}`;
      return { title, html: page(title, sub, body, ctx.by) };
    }
    case 'users': {
      const d = data as UsersReport;
      const t = d.totals;
      const title = 'Student report';
      const sub = `${monthName(d.months[0]!.month)} to ${monthName(d.months[d.months.length - 1]!.month)}`;
      const labels = d.months.map((m) => monthName(m.month, true));
      const joined: Series[] = [
        { name: 'Joined', values: d.months.map((m) => m.joined), color: CHART_COLORS.teal },
        { name: 'Verified', values: d.months.map((m) => m.verified), color: CHART_COLORS.green },
        { name: 'Paid', values: d.months.map((m) => m.paidStudents), color: CHART_COLORS.amber },
      ];
      const money: Series[] = [{ name: 'Money received (₦)', values: d.months.map((m) => m.revenueNaira), color: CHART_COLORS.amber }];
      const sum = (k: 'joined' | 'verified' | 'paidStudents' | 'payments' | 'revenueNaira') => d.months.reduce((n, m) => n + m[k], 0);
      const body =
        stats([
          ['Students', t.students],
          ['Verified', t.verified],
          ['Premium now', t.premium],
          ['Have ever paid', t.everPaid],
          ['Paid, of verified', `${t.paidRate}%`],
          ['Active in 30 days', t.active30],
          ['Money received (all time)', naira(t.revenueNaira)],
          ['Joined in this period', sum('joined')],
        ]) +
        `<h2>Students joining each month</h2><div class="chart">${barChartSvg(labels, joined)}${legendHtml(joined)}</div>` +
        `<h2>Money received each month</h2><div class="chart">${barChartSvg(labels, money, { money: true, height: 200 })}${legendHtml(money)}</div>` +
        `<h2>Month by month</h2>${table(
          ['Month', 'Joined', 'Verified', 'Paid students', 'Payments', 'Money received'],
          [
            ...d.months.map((m) => [esc(monthName(m.month)), m.joined, m.verified, m.paidStudents, m.payments, esc(naira(m.revenueNaira))]),
            ['<b>Total</b>', `<b>${num(sum('joined'))}</b>`, `<b>${num(sum('verified'))}</b>`, '', `<b>${num(sum('payments'))}</b>`, `<b>${esc(naira(sum('revenueNaira')))}</b>`],
          ],
          [1, 2, 3, 4, 5],
        )}` +
        (d.byExam.length ? `<h2>Students by exam</h2>${table(['Exam', 'Students'], d.byExam.map((e) => [esc(e.exam), e.count]), [1])}` : '') +
        (d.students?.length
          ? `<h2>All students (${num(d.students.length)})</h2>${table(
              ['Name', 'Phone or email', 'Plan', 'Exams', 'Joined'],
              d.students.map((u) => [`${esc(u.name)}${u.verified ? '' : ' <span class="tag review">Not verified</span>'}`, esc(u.contact), esc(u.plan), esc(u.exams || '–'), esc(longDay(u.joined.slice(0, 10)))]),
            )}`
          : '');
      return { title, html: page(title, sub, body, ctx.by) };
    }
  }
  throw new Error('Unknown report.');
}

const paperName = (p: { exam: string; subject: string; year: number; school: string }) =>
  [p.exam === 'UTME' ? 'JAMB' : p.exam, p.school, p.subject, p.year || ''].filter(Boolean).join(' ');

const dayTable = (rows: SystemReport['days']) =>
  table(
    ['Date', 'New students', 'Payments', 'Money', 'Questions added', 'Practice', 'AI requests', 'Admin actions'],
    rows.map((x) => [esc(longDay(x.date)), x.newStudents, x.payments, esc(naira(x.revenueNaira)), x.questionsAdded, x.practiceSessions, x.aiRequests, x.adminActions]),
    [1, 2, 3, 4, 5, 6, 7],
  );

/** Prints a report page from a hidden frame: the browser offers "Save as PDF". */
export function printHtml(html: string, title: string) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.title = title;
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  const go = () => {
    const win = frame.contentWindow!;
    win.focus();
    win.print();
    // Removed a while later: some browsers print after print() returns.
    window.setTimeout(() => frame.remove(), 60_000);
  };
  // Wait for the fonts, but never more than 2.5 s.
  const fonts = doc.fonts?.ready ?? Promise.resolve();
  void Promise.race([fonts, new Promise((r) => window.setTimeout(r, 2500))]).then(() => window.setTimeout(go, 150));
}

/* ------------------------------------------------------------------- CSV */

type Cell = string | number | boolean | null | undefined;

const csvCell = (c: Cell) => {
  const s = c === null || c === undefined ? '' : typeof c === 'boolean' ? (c ? 'Yes' : 'No') : String(c);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Saves rows as a .csv file that Excel opens directly (UTF-8 with a BOM, so ₦ shows). */
export function downloadCsv(fileName: string, rows: Cell[][]) {
  const text = `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const logCsv = (rows: LogRow[]): Cell[][] => [
  ['When (Lagos)', 'Who', 'Email', 'Role', 'Type', 'What', 'From (IP)'],
  ...rows.map((r) => [when(r.at), byWho(r), r.email, roleLabel(r.role), KIND_LABEL[r.kind] ?? r.kind, r.text, r.ip]),
];

export function reportCsv<K extends ReportName>(name: K, data: ReportMap[K], ctx: ExportContext): Cell[][] {
  switch (name) {
    case 'logs':
      return logCsv((data as LogsReport).rows);
    case 'logins': {
      const d = data as LoginsReport;
      return [
        ['Admin', 'Email', 'Role', 'Status', 'Last signed in', 'Sign-ins', 'Failed sign-ins'],
        ...d.admins.map((a) => [a.name, a.email, roleLabel(a.role), a.status, a.lastLoginAt ? when(a.lastLoginAt) : 'Never', a.signIns, a.failed]),
        [],
        ...logCsv(d.rows),
      ];
    }
    case 'content': {
      const d = data as ContentReport;
      const from = ctx.fromYear ?? 1978;
      const rows: Cell[][] = [
        ['Exam', 'School', 'Subject', 'Status', `Years covered since ${from} (%)`, 'Published years', 'Waiting to be published', `Missing since ${from}`, 'Published questions', 'Draft questions'],
      ];
      const add = (exam: string, school: string, s: SubjectCoverage) => {
        const st = coverageState(s);
        rows.push([
          exam,
          school,
          s.subject,
          COVERAGE_LABEL[st].replace(' ✓', ''),
          coveragePercent(s, from),
          yearRanges(s.done),
          yearRanges(s.review),
          st === 'waiting' ? 'All' : yearRanges(missingYears(s, from)),
          s.published,
          s.drafts,
        ]);
      };
      for (const e of d.exams.filter((x) => !ctx.exam || x.id === ctx.exam)) {
        if (e.kind === 'school') for (const sc of e.schools) for (const s of sc.subjects) add(e.label, sc.school, s);
        else for (const s of e.subjects) add(e.label, '', s);
      }
      if (!ctx.exam) for (const p of d.practice) rows.push(['Practice', '', p.subject, '', '', '', '', '', p.published, p.drafts]);
      return rows;
    }
    case 'system': {
      const d = data as SystemReport;
      const t = d.totals;
      return [
        ['i-Tutor full system report', `${d.from} to ${d.to}`],
        [],
        ['Now', 'Value'],
        ['Students', t.students],
        ['Verified students', t.verified],
        ['Premium now', t.premium],
        ['Have ever paid', t.everPaid],
        ['Payments', t.payments],
        ['Money received (NGN)', t.revenueNaira],
        ['Published questions', t.questionsPublished],
        ['Draft questions', t.questionsDraft],
        ['Need review', t.needsReview],
        ['Papers', t.papers],
        ['News posts', t.news],
        ['Website pages', t.pages],
        ['Courses', t.courses],
        ['Images', t.images],
        ['Admins', t.admins],
        ['Practice sessions', t.practiceSessions],
        ['AI requests', t.aiRequests],
        ['Failed AI requests', t.aiFailed],
        ['AI cost estimate (NGN)', t.aiNaira],
        [],
        ['Date', 'New students', 'Payments', 'Money (NGN)', 'Questions added', 'Practice sessions', 'Students who practised', 'AI requests', 'AI cost (NGN)', 'Admin actions', 'Admin sign-ins'],
        ...d.days.map((x) => [x.date, x.newStudents, x.payments, x.revenueNaira, x.questionsAdded, x.practiceSessions, x.activeStudents, x.aiRequests, x.aiNaira, x.adminActions, x.signIns]),
      ];
    }
    case 'day': {
      const d = data as DayReport;
      const s = d.summary;
      return [
        ['i-Tutor daily report', d.date],
        [],
        ['New students', s.newStudents],
        ['Payments', s.payments],
        ['Money received (NGN)', s.revenueNaira],
        ['Questions added', s.questionsAdded],
        ['Practice sessions', s.practiceSessions],
        ['Students who practised', s.activeStudents],
        ['AI requests', s.aiRequests],
        ['Admin actions', s.adminActions],
        [],
        ['Paper', 'Published', 'Drafts'],
        ...d.papers.map((p) => [paperName(p), p.published, p.drafts]),
        [],
        ['Student joined', 'Time', 'Exams', 'Verified'],
        ...d.students.map((u) => [u.name, timeOnly(u.at), u.exams.join(', '), u.verified]),
        [],
        ['Payment by', 'Time', 'Plan', 'Amount (NGN)'],
        ...d.payments.map((p) => [p.name, timeOnly(p.at), p.plan, p.naira]),
        [],
        ...logCsv(d.activity),
      ];
    }
    case 'users': {
      const d = data as UsersReport;
      return [
        ['Month', 'Joined', 'Verified', 'Paid students', 'Payments', 'Money received (NGN)'],
        ...d.months.map((m) => [monthName(m.month), m.joined, m.verified, m.paidStudents, m.payments, m.revenueNaira]),
        [],
        ['Exam', 'Students'],
        ...d.byExam.map((e) => [e.exam, e.count]),
        [],
        ['Name', 'Phone or email', 'Verified', 'Plan', 'Exams', 'Course', 'School', 'Joined', 'Last active'],
        ...(d.students ?? []).map((u) => [u.name, u.contact, u.verified, u.plan, u.exams, u.course, u.school, u.joined.slice(0, 10), u.lastActive.slice(0, 10)]),
      ];
    }
  }
  throw new Error('Unknown report.');
}
