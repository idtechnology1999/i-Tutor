import React, { useEffect, useState } from 'react';
import { CalendarDays, FileSpreadsheet, FileText, History, LoaderCircle, LogIn, MonitorCog, RefreshCw, UsersRound, BookOpenCheck } from 'lucide-react';
import { isLive } from '../../services/api';
import { downloadReport, loadReport } from '../../services/reports';
import type { LogRow, ReportMap, ReportName, SubjectCoverage } from '../../services/reports';
import {
  CHART_COLORS,
  COVERAGE_LABEL,
  KIND_LABEL,
  barChartSvg,
  byWho,
  coverageState,
  downloadCsv,
  legendHtml,
  longDay,
  missingYears,
  monthName,
  naira,
  num,
  printHtml,
  reportCsv,
  reportPdf,
  roleLabel,
  today,
  when,
  yearRanges,
} from '../../lib/report-export';
import type { Series } from '../../lib/report-export';
import { FIRST_PAPER_YEAR, PAPER_YEARS } from '../../lib/years';
import type { AdminAccount } from '../../services/admin-auth';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';
import { ConfirmDialog } from './AdminSystem';

/* Admin → Reports: what admins did, admin sign-ins, which past papers are
   done or missing, the whole system (and any single day), and students
   joining and paying. Everyone can look; every download (PDF or Excel)
   needs the super admin password. */

type Tab = 'logs' | 'logins' | 'content' | 'system' | 'day' | 'users';

const TABS: Array<{ id: Tab; label: string; icon: typeof History }> = [
  { id: 'logs', label: 'Log history', icon: History },
  { id: 'logins', label: 'Admin sign-ins', icon: LogIn },
  { id: 'content', label: 'Past questions', icon: BookOpenCheck },
  { id: 'system', label: 'System report', icon: MonitorCog },
  { id: 'day', label: 'Daily report', icon: CalendarDays },
  { id: 'users', label: 'Students', icon: UsersRound },
];

const TAB_KEY = 'itutor-admin-report-tab';
const daysAgo = (n: number) => new Date(Date.now() + 60 * 60 * 1000 - n * 86_400_000).toISOString().slice(0, 10);

type Options = Record<string, string | number | undefined>;

/** Loads a report whenever its options change. */
function useReport<K extends ReportName>(name: K, options: Options) {
  const [data, setData] = useState<ReportMap[K] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [n, setN] = useState(0);
  const key = JSON.stringify(options);
  useEffect(() => {
    if (!isLive) return;
    let live = true;
    setBusy(true);
    setError('');
    loadReport(name, JSON.parse(key) as Options)
      .then((d) => live && setData(d))
      .catch((e: Error) => live && setError(e.message))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
  }, [name, key, n]);
  return { data, error, busy, reload: () => setN((x) => x + 1) };
}

export const AdminReports: React.FC<{ nav: AdminNav; me: AdminAccount | null }> = ({ nav, me }) => {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const t = window.sessionStorage.getItem(TAB_KEY) as Tab | null;
      return t && TABS.some((x) => x.id === t) ? t : 'logs';
    } catch {
      return 'logs';
    }
  });
  const choose = (t: Tab) => {
    setTab(t);
    try {
      window.sessionStorage.setItem(TAB_KEY, t);
    } catch {
      /* ignore */
    }
  };
  const [day, setDay] = useState(today());
  const [download, setDownload] = useState<{ name: ReportName; options: Options; format: 'pdf' | 'csv'; fromYear?: number } | null>(null);

  const by = me ? `${me.name || me.email} (${roleLabel(me.role)})` : 'Admin';

  const run = async (password: string) => {
    if (!download) return;
    const data = await downloadReport(download.name, password, download.options);
    const ctx = { by, fromYear: download.fromYear };
    const stamp = today();
    if (download.format === 'pdf') {
      const { title, html } = reportPdf(download.name, data, ctx);
      printHtml(html, title);
      nav.notify('Report ready: choose “Save as PDF” as the printer to keep it as a file.');
    } else {
      downloadCsv(`i-tutor-${download.name}-report-${stamp}.csv`, reportCsv(download.name, data, ctx));
      nav.notify('Report downloaded. It opens in Excel.');
    }
    setDownload(null);
  };

  const ask = (name: ReportName, options: Options, fromYear?: number) => (format: 'pdf' | 'csv') => setDownload({ name, options, format, fromYear });

  return (
    <div className="adm-page rep">
      <PageHead title="Reports" sub="What happened on i-Tutor, who did it, and what’s still to do. Downloads need the super admin password." />

      {!isLive && <div className="adm-banner">Reports read the live database, so they work on the live site only.</div>}

      <div className="adm-tabs rep-tabs" role="tablist" aria-label="Reports">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => choose(id)}>
            <Icon size={16} aria-hidden /> {label}
          </button>
        ))}
      </div>

      {isLive && tab === 'logs' && <LogsTab ask={ask} />}
      {isLive && tab === 'logins' && <LoginsTab ask={ask} />}
      {isLive && tab === 'content' && <ContentTab ask={ask} />}
      {isLive && tab === 'system' && (
        <SystemTab
          ask={ask}
          onDay={(d) => {
            setDay(d);
            choose('day');
          }}
        />
      )}
      {isLive && tab === 'day' && <DayTab ask={ask} day={day} onDay={setDay} />}
      {isLive && tab === 'users' && <UsersTab ask={ask} />}

      {download && (
        <ConfirmDialog
          title={`Download as ${download.format === 'pdf' ? 'PDF' : 'Excel'}`}
          message={
            <p className="adm-muted">
              Reports hold students’ and admins’ details, so downloading one needs the super admin password. The download is recorded in the log
              history.
            </p>
          }
          action="Download"
          onConfirm={run}
          onClose={() => setDownload(null)}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------ Shared bits */

type Ask = (name: ReportName, options: Options, fromYear?: number) => (format: 'pdf' | 'csv') => void;

const Toolbar: React.FC<{ children?: React.ReactNode; onPdf: () => void; onCsv: () => void; onReload: () => void; busy: boolean; ready: boolean }> = ({
  children,
  onPdf,
  onCsv,
  onReload,
  busy,
  ready,
}) => (
  <div className="rep-bar">
    <div className="rep-bar__filters">{children}</div>
    <div className="rep-bar__actions">
      <button type="button" className="adm-icon-btn" onClick={onReload} disabled={busy} aria-label="Refresh" title="Refresh">
        <RefreshCw size={17} className={busy ? 'adm-spin' : ''} aria-hidden />
      </button>
      <button type="button" className="adm-btn" onClick={onCsv} disabled={!ready}>
        <FileSpreadsheet size={16} aria-hidden /> Excel
      </button>
      <button type="button" className="adm-btn adm-btn--primary" onClick={onPdf} disabled={!ready}>
        <FileText size={16} aria-hidden /> PDF
      </button>
    </div>
  </div>
);

const DateField: React.FC<{ label: string; value: string; onChange: (v: string) => void; max?: string; min?: string }> = ({ label, value, onChange, max, min }) => (
  <label className="rep-field">
    <span>{label}</span>
    <input type="date" className="adm-input" value={value} max={max ?? today()} min={min} onChange={(e) => e.target.value && onChange(e.target.value)} />
  </label>
);

const Status: React.FC<{ busy: boolean; error: string; empty?: boolean }> = ({ busy, error, empty }) =>
  error ? (
    <p className="adm-note is-error">{error}</p>
  ) : busy && empty ? (
    <p className="rep-loading">
      <LoaderCircle size={18} className="adm-spin" aria-hidden /> Loading the report…
    </p>
  ) : null;

const Stats: React.FC<{ items: Array<[string, string | number]> }> = ({ items }) => (
  <div className="rep-stats">
    {items.map(([label, v]) => (
      <div key={label} className="rep-stat">
        <strong>{typeof v === 'number' ? num(v) : v}</strong>
        <span>{label}</span>
      </div>
    ))}
  </div>
);

const Chart: React.FC<{ title: string; labels: string[]; series: Series[]; money?: boolean; height?: number }> = ({ title, labels, series, money, height }) => (
  <section className="adm-card rep-chart">
    <h2>{title}</h2>
    {/* Built from numbers and labels made here; every text is escaped. */}
    <div dangerouslySetInnerHTML={{ __html: barChartSvg(labels, series, { money, height }) + legendHtml(series) }} />
  </section>
);

const KindTag: React.FC<{ kind: LogRow['kind'] }> = ({ kind }) => (
  <span className={`rep-tag is-${kind === 'login-failed' ? 'bad' : kind === 'action' ? 'plain' : kind === 'download' ? 'warn' : 'ok'}`}>{KIND_LABEL[kind] ?? kind}</span>
);

const LogList: React.FC<{ rows: LogRow[]; timeOnly?: boolean }> = ({ rows, timeOnly }) =>
  rows.length ? (
    <div className="rep-table-wrap">
      <table className="rep-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>What</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.at}-${i}`}>
              <td className="rep-when">{timeOnly ? new Date(r.at).toLocaleTimeString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' }) : when(r.at)}</td>
              <td>
                <b>{byWho(r)}</b>
                <small>{roleLabel(r.role)}</small>
              </td>
              <td>
                {r.text}
                {r.ip && <small>From {r.ip}</small>}
              </td>
              <td>
                <KindTag kind={r.kind} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="adm-muted rep-empty">Nothing in this period.</p>
  );

/* ------------------------------------------------------------- Log history */

const LogsTab: React.FC<{ ask: Ask }> = ({ ask }) => {
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today());
  const [kind, setKind] = useState('all');
  const [admin, setAdmin] = useState('');
  const options = { from, to, kind, admin };
  const { data, error, busy, reload } = useReport('logs', options);
  const go = ask('logs', options);
  return (
    <>
      <Toolbar onPdf={() => go('pdf')} onCsv={() => go('csv')} onReload={reload} busy={busy} ready={Boolean(data)}>
        <DateField label="From" value={from} onChange={setFrom} max={to} />
        <DateField label="To" value={to} onChange={setTo} min={from} />
        <label className="rep-field">
          <span>Show</span>
          <select className="adm-input" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">Everything</option>
            <option value="actions">Actions</option>
            <option value="logins">Sign-ins and sign-outs</option>
            <option value="downloads">Downloads</option>
          </select>
        </label>
        <label className="rep-field">
          <span>Who</span>
          <select className="adm-input" value={admin} onChange={(e) => setAdmin(e.target.value)}>
            <option value="">Everyone</option>
            {data?.admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({roleLabel(a.role)})
              </option>
            ))}
            <option value="system">System (AI tutor and automatic jobs)</option>
          </select>
        </label>
      </Toolbar>
      <Status busy={busy} error={error} empty={!data} />
      {data && (
        <>
          <Stats
            items={[
              ['Entries', data.rows.length],
              ['Actions', data.rows.filter((r) => r.kind === 'action').length],
              ['Sign-ins', data.rows.filter((r) => r.kind === 'login').length],
              ['Failed sign-ins', data.rows.filter((r) => r.kind === 'login-failed').length],
            ]}
          />
          {data.truncated && <p className="adm-note">Showing the newest 3,000. Choose fewer days to see the rest.</p>}
          <section className="adm-card rep-card">
            <LogList rows={data.rows} />
          </section>
          <p className="adm-muted rep-hint">Entries from before this report existed don’t say who did them.</p>
        </>
      )}
    </>
  );
};

/* ------------------------------------------------------------ Admin sign-ins */

const LoginsTab: React.FC<{ ask: Ask }> = ({ ask }) => {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(today());
  const options = { from, to };
  const { data, error, busy, reload } = useReport('logins', options);
  const go = ask('logins', options);
  return (
    <>
      <Toolbar onPdf={() => go('pdf')} onCsv={() => go('csv')} onReload={reload} busy={busy} ready={Boolean(data)}>
        <DateField label="From" value={from} onChange={setFrom} max={to} />
        <DateField label="To" value={to} onChange={setTo} min={from} />
      </Toolbar>
      <Status busy={busy} error={error} empty={!data} />
      {data && (
        <>
          <Stats
            items={[
              ['Admins', data.admins.length],
              ['Sign-ins', data.rows.filter((r) => r.kind === 'login').length],
              ['Failed sign-ins', data.rows.filter((r) => r.kind === 'login-failed').length],
              ['Unknown emails tried', data.unknownFailed],
            ]}
          />
          <section className="adm-card rep-card">
            <h2>Admins</h2>
            <div className="rep-table-wrap">
              <table className="rep-table">
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Role</th>
                    <th>Last signed in</th>
                    <th className="n">Sign-ins</th>
                    <th className="n">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.admins.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <b>{a.name}</b>
                        <small>{a.email}</small>
                      </td>
                      <td>
                        {roleLabel(a.role)} {a.status !== 'active' && <span className="rep-tag is-warn">Invited</span>}
                      </td>
                      <td className="rep-when">{a.lastLoginAt ? when(a.lastLoginAt) : 'Never'}</td>
                      <td className="n">{num(a.signIns)}</td>
                      <td className="n">{a.failed ? <span className="rep-tag is-bad">{a.failed}</span> : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="adm-card rep-card">
            <h2>Every sign-in and sign-out</h2>
            <LogList rows={data.rows} />
          </section>
        </>
      )}
    </>
  );
};

/* ------------------------------------------------------------ Past questions */

const CoverageTable: React.FC<{ subjects: SubjectCoverage[]; fromYear: number }> = ({ subjects, fromYear }) => (
  <div className="rep-table-wrap">
    <table className="rep-table rep-cover">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Status</th>
          <th>Done (published)</th>
          <th>In review</th>
          <th>Missing since {fromYear}</th>
          <th className="n">Questions</th>
        </tr>
      </thead>
      <tbody>
        {subjects.map((s) => {
          const st = coverageState(s);
          return (
            <tr key={s.subject} className={`is-${st}`}>
              <td>
                <b>{s.subject}</b>
              </td>
              <td>
                <span className={`rep-tag is-${st === 'done' ? 'ok' : st === 'review' ? 'warn' : 'plain'}`}>{COVERAGE_LABEL[st]}</span>
              </td>
              <td className="rep-years">{yearRanges(s.done) || '–'}</td>
              <td className="rep-years">{yearRanges(s.review) || '–'}</td>
              <td className="rep-years is-missing">{st === 'waiting' ? 'All years' : yearRanges(missingYears(s, fromYear)) || 'None'}</td>
              <td className="n">
                {num(s.published)}
                {s.drafts > 0 && <small>+{num(s.drafts)} drafts</small>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const ContentTab: React.FC<{ ask: Ask }> = ({ ask }) => {
  const { data, error, busy, reload } = useReport('content', {});
  const [fromYear, setFromYear] = useState(FIRST_PAPER_YEAR);
  const [exam, setExam] = useState('');
  const go = ask('content', {}, fromYear);
  const shown = data?.exams.filter((e) => !exam || e.id === exam) ?? [];
  return (
    <>
      <Toolbar onPdf={() => go('pdf')} onCsv={() => go('csv')} onReload={reload} busy={busy} ready={Boolean(data)}>
        <label className="rep-field">
          <span>Exam</span>
          <select className="adm-input" value={exam} onChange={(e) => setExam(e.target.value)}>
            <option value="">All exams</option>
            {data?.exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="rep-field">
          <span>Count missing from</span>
          <select className="adm-input" value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))}>
            {PAPER_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </Toolbar>
      <Status busy={busy} error={error} empty={!data} />
      {shown.map((e) => {
        const subs = e.kind === 'school' ? e.schools.flatMap((s) => s.subjects) : e.subjects;
        const count = (st: string) => subs.filter((s) => coverageState(s) === st).length;
        return (
          <section key={e.id} className="adm-card rep-card">
            <div className="adm-card__head">
              <h2>
                {e.name} {!e.enabled && <span className="rep-tag is-plain">Switched off</span>}
              </h2>
              {e.kind !== 'school' && (
                <p className="rep-counts">
                  <span className="rep-tag is-ok">{count('done')} done</span>
                  <span className="rep-tag is-warn">{count('review')} in review</span>
                  <span className="rep-tag is-plain">{count('waiting')} waiting for upload</span>
                </p>
              )}
            </div>
            {e.kind === 'school' ? (
              e.schools.length ? (
                e.schools.map((s) => (
                  <div key={s.school} className="rep-school">
                    <h3>{s.school}</h3>
                    <CoverageTable subjects={s.subjects} fromYear={fromYear} />
                  </div>
                ))
              ) : (
                <p className="adm-muted">No Post-UTME papers yet: waiting for upload.</p>
              )
            ) : (
              <CoverageTable subjects={e.subjects} fromYear={fromYear} />
            )}
          </section>
        );
      })}
      {data && !exam && data.practice.length > 0 && (
        <section className="adm-card rep-card">
          <h2>Practice questions (by syllabus)</h2>
          <div className="rep-table-wrap">
            <table className="rep-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th className="n">Published</th>
                  <th className="n">Drafts</th>
                </tr>
              </thead>
              <tbody>
                {data.practice.map((p) => (
                  <tr key={p.subject}>
                    <td>
                      <b>{p.subject}</b>
                    </td>
                    <td className="n">{num(p.published)}</td>
                    <td className="n">{num(p.drafts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
};

/* ------------------------------------------------------------- System report */

const SystemTab: React.FC<{ ask: Ask; onDay: (day: string) => void }> = ({ ask, onDay }) => {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(today());
  const options = { from, to };
  const { data, error, busy, reload } = useReport('system', options);
  const go = ask('system', options);
  const preset = (n: number) => {
    setFrom(daysAgo(n - 1));
    setTo(today());
  };
  const days = data ? [...data.days].reverse() : [];
  const t = data?.totals;
  return (
    <>
      <Toolbar onPdf={() => go('pdf')} onCsv={() => go('csv')} onReload={reload} busy={busy} ready={Boolean(data)}>
        <div className="adm-seg rep-seg" role="group" aria-label="Period">
          {[7, 30, 90, 365].map((n) => (
            <button key={n} type="button" className={from === daysAgo(n - 1) && to === today() ? 'is-on' : ''} onClick={() => preset(n)}>
              {n === 365 ? '1 year' : `${n} days`}
            </button>
          ))}
        </div>
        <DateField label="From" value={from} onChange={setFrom} max={to} />
        <DateField label="To" value={to} onChange={setTo} min={from} />
      </Toolbar>
      <Status busy={busy} error={error} empty={!data} />
      {data && t && (
        <>
          <section className="adm-card rep-card">
            <h2>Everything in i-Tutor now</h2>
            <Stats
              items={[
                ['Students', t.students],
                ['Verified', t.verified],
                ['Premium now', t.premium],
                ['Money received', naira(t.revenueNaira)],
                ['Published questions', t.questionsPublished],
                ['Draft questions', t.questionsDraft],
                ['Need review', t.needsReview],
                ['Papers', t.papers],
                ['Practice sessions', t.practiceSessions],
                ['AI requests', t.aiRequests],
                ['AI cost (estimate)', naira(t.aiNaira)],
                ['Admins', t.admins],
              ]}
            />
          </section>
          <section className="adm-card rep-card">
            <h2>
              {longDay(data.from)} to {longDay(data.to)}
            </h2>
            <Stats
              items={[
                ['New students', data.period.newStudents],
                ['Payments', data.period.payments],
                ['Money received', naira(data.period.revenueNaira)],
                ['Questions added', data.period.questionsAdded],
                ['Practice sessions', data.period.practiceSessions],
                ['AI requests', data.period.aiRequests],
                ['Admin actions', data.period.adminActions],
                ['Admin sign-ins', data.period.signIns],
              ]}
            />
          </section>
          {days.length > 1 && (
            <Chart
              title="New students and practice, day by day"
              labels={days.map((d) => d.date.slice(5).split('-').reverse().join('/'))}
              series={[
                { name: 'New students', values: days.map((d) => d.newStudents), color: CHART_COLORS.teal },
                { name: 'Students who practised', values: days.map((d) => d.activeStudents), color: CHART_COLORS.amber },
              ]}
              height={220}
            />
          )}
          <section className="adm-card rep-card">
            <h2>Day by day</h2>
            <p className="adm-muted rep-hint">Click a day to open its daily report.</p>
            <div className="rep-table-wrap">
              <table className="rep-table rep-days">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="n">New students</th>
                    <th className="n">Payments</th>
                    <th className="n">Money</th>
                    <th className="n">Questions added</th>
                    <th className="n">Practice</th>
                    <th className="n">AI requests</th>
                    <th className="n">Admin actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.days.map((d) => (
                    <tr key={d.date} onClick={() => onDay(d.date)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onDay(d.date)}>
                      <td className="rep-when">{longDay(d.date)}</td>
                      <td className="n">{num(d.newStudents)}</td>
                      <td className="n">{num(d.payments)}</td>
                      <td className="n">{naira(d.revenueNaira)}</td>
                      <td className="n">{num(d.questionsAdded)}</td>
                      <td className="n">{num(d.practiceSessions)}</td>
                      <td className="n">{num(d.aiRequests)}</td>
                      <td className="n">{num(d.adminActions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
};

/* -------------------------------------------------------------- Daily report */

const DayTab: React.FC<{ ask: Ask; day: string; onDay: (d: string) => void }> = ({ ask, day, onDay }) => {
  const options = { date: day };
  const { data, error, busy, reload } = useReport('day', options);
  const go = ask('day', options);
  const shift = (n: number) => {
    const d = new Date(`${day}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    const next = d.toISOString().slice(0, 10);
    if (next <= today()) onDay(next);
  };
  const s = data?.summary;
  return (
    <>
      <Toolbar onPdf={() => go('pdf')} onCsv={() => go('csv')} onReload={reload} busy={busy} ready={Boolean(data)}>
        <button type="button" className="adm-btn" onClick={() => shift(-1)}>
          ← Day before
        </button>
        <DateField label="Date" value={day} onChange={onDay} />
        <button type="button" className="adm-btn" onClick={() => shift(1)} disabled={day >= today()}>
          Day after →
        </button>
      </Toolbar>
      <Status busy={busy} error={error} empty={!data} />
      {data && s && (
        <>
          <h2 className="rep-day-title">{longDay(data.date)}</h2>
          <Stats
            items={[
              ['New students', s.newStudents],
              ['Payments', s.payments],
              ['Money received', naira(s.revenueNaira)],
              ['Questions added', s.questionsAdded],
              ['Practice sessions', s.practiceSessions],
              ['Students who practised', s.activeStudents],
              ['AI requests', s.aiRequests],
              ['Admin actions', s.adminActions],
            ]}
          />
          <div className="rep-cols">
            <section className="adm-card rep-card">
              <h2>Questions added</h2>
              {data.papers.length ? (
                <ul className="rep-list">
                  {data.papers.map((p) => (
                    <li key={`${p.exam}${p.school}${p.subject}${p.year}`}>
                      <span>{[p.exam === 'UTME' ? 'JAMB' : p.exam, p.school, p.subject, p.year || ''].filter(Boolean).join(' ')}</span>
                      <b>{num(p.published + p.drafts)}</b>
                      {p.drafts > 0 && <small>{p.published ? `${num(p.drafts)} drafts` : 'all drafts'}</small>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="adm-muted">None.</p>
              )}
            </section>
            <section className="adm-card rep-card">
              <h2>New students</h2>
              {data.students.length ? (
                <ul className="rep-list">
                  {data.students.map((u, i) => (
                    <li key={`${u.at}-${i}`}>
                      <span>{u.name}</span>
                      <small>{u.exams.join(', ') || '–'}</small>
                      {!u.verified && <span className="rep-tag is-warn">Not verified</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="adm-muted">None.</p>
              )}
              {data.payments.length > 0 && (
                <>
                  <h3>Payments</h3>
                  <ul className="rep-list">
                    {data.payments.map((p, i) => (
                      <li key={`${p.at}-${i}`}>
                        <span>{p.name}</span>
                        <small>{p.plan}</small>
                        <b>{naira(p.naira)}</b>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
          <section className="adm-card rep-card">
            <h2>What admins did</h2>
            <LogList rows={data.activity} timeOnly />
          </section>
        </>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ Students */

const UsersTab: React.FC<{ ask: Ask }> = ({ ask }) => {
  const [months, setMonths] = useState(12);
  const options = { months };
  const { data, error, busy, reload } = useReport('users', options);
  const go = ask('users', options);
  const labels = data?.months.map((m) => monthName(m.month, true)) ?? [];
  const sum = (k: 'joined' | 'verified' | 'paidStudents' | 'payments' | 'revenueNaira') => data?.months.reduce((n, m) => n + m[k], 0) ?? 0;
  const maxExam = Math.max(1, ...(data?.byExam.map((e) => e.count) ?? [1]));
  return (
    <>
      <Toolbar onPdf={() => go('pdf')} onCsv={() => go('csv')} onReload={reload} busy={busy} ready={Boolean(data)}>
        <div className="adm-seg rep-seg" role="group" aria-label="Months">
          {[6, 12, 24, 36].map((n) => (
            <button key={n} type="button" className={months === n ? 'is-on' : ''} onClick={() => setMonths(n)}>
              {n < 12 ? `${n} months` : n === 12 ? '1 year' : `${n / 12} years`}
            </button>
          ))}
        </div>
      </Toolbar>
      <Status busy={busy} error={error} empty={!data} />
      {data && (
        <>
          <Stats
            items={[
              ['Students', data.totals.students],
              ['Verified', data.totals.verified],
              ['Premium now', data.totals.premium],
              ['Have ever paid', data.totals.everPaid],
              ['Paid, of verified', `${data.totals.paidRate}%`],
              ['Active in 30 days', data.totals.active30],
              ['Money received (all time)', naira(data.totals.revenueNaira)],
              ['Joined in this period', sum('joined')],
            ]}
          />
          <Chart
            title="Students joining each month"
            labels={labels}
            series={[
              { name: 'Joined', values: data.months.map((m) => m.joined), color: CHART_COLORS.teal },
              { name: 'Verified', values: data.months.map((m) => m.verified), color: CHART_COLORS.green },
              { name: 'Paid', values: data.months.map((m) => m.paidStudents), color: CHART_COLORS.amber },
            ]}
          />
          <Chart
            title="Money received each month"
            labels={labels}
            series={[{ name: 'Money received (₦)', values: data.months.map((m) => m.revenueNaira), color: CHART_COLORS.amber }]}
            money
            height={200}
          />
          <div className="rep-cols">
            <section className="adm-card rep-card">
              <h2>Month by month</h2>
              <div className="rep-table-wrap">
                <table className="rep-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="n">Joined</th>
                      <th className="n">Verified</th>
                      <th className="n">Paid</th>
                      <th className="n">Money</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.months].reverse().map((m) => (
                      <tr key={m.month}>
                        <td>{monthName(m.month)}</td>
                        <td className="n">{num(m.joined)}</td>
                        <td className="n">{num(m.verified)}</td>
                        <td className="n">{num(m.paidStudents)}</td>
                        <td className="n">{naira(m.revenueNaira)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td className="n">{num(sum('joined'))}</td>
                      <td className="n">{num(sum('verified'))}</td>
                      <td className="n">–</td>
                      <td className="n">{naira(sum('revenueNaira'))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
            <section className="adm-card rep-card">
              <h2>Students by exam</h2>
              {data.byExam.length ? (
                <ul className="adm-bars rep-bars">
                  {data.byExam.map((e) => (
                    <li key={e.exam}>
                      <span className="adm-bars__name">{e.exam}</span>
                      <span className="adm-bars__track" aria-hidden>
                        <i style={{ width: `${(e.count / maxExam) * 100}%` }} />
                      </span>
                      <span className="adm-bars__num">{num(e.count)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="adm-muted">No students yet.</p>
              )}
              <p className="adm-muted rep-hint">A student can register for more than one exam. The full student list is in the downloads.</p>
            </section>
          </div>
        </>
      )}
    </>
  );
};
