# i-Tutor — Backend contract

What the backend must provide so the existing frontend and admin work against real
data. The frontend is ready: every server call goes through `src/services/` (or
`src/lib/question-import.ts` for the admin import), and each one already has the
request/response shape below.

- **Demo mode (today):** `VITE_API_URL` is empty. Every service uses a built-in stand-in,
  so the whole site works without a server.
- **Live mode:** set `VITE_API_URL` to the backend address (see `.env.example`). Each
  service then calls the endpoint listed here. No screen code needs to change.

Recommended stack: Express + TypeScript on Render/Railway, PostgreSQL (Supabase),
Paystack, Termii (SMS), Resend (email), an AI model behind `/api/tutor/*`,
`/api/classroom/*`, `/api/parse-questions` and `/api/admin/auto`.

---

## Conventions

| | |
|---|---|
| Format | JSON in, JSON out (`content-type: application/json`) |
| Errors | Any non-2xx with `{ "error": "Plain-English message for the student" }` — shown as-is in the UI |
| Student session | httpOnly cookie set at login/verify. Requests are sent with `credentials: 'include'` |
| Cross-domain | Frontend (Vercel) and API on different domains → CORS must allow the frontend origin **with credentials**; cookie `SameSite=None; Secure` |
| Admin auth | Header `x-admin-key` on every admin route (see Security §3 for the better long-term option) |
| Timeouts | Frontend waits 20s normally, 60s for AI routes. Stream AI replies if they're slower |

Shared types live in the frontend and can be copied to the backend:
`src/types/index.ts` (UserProfile, SchoolCert, StudentExam), `src/lib/cms.ts`
(CmsQuestion, CmsNews, CmsCourse), `src/data/courses.ts` (FacultySet),
`src/data/tutors.ts` (SolveRequest), `src/data/syllabus.ts` (Lesson),
`src/lib/auto-agent.ts` (AutoPlan, AutoAction), `src/lib/question-import.ts` (ParsedQuestion).

---

## 1. Accounts — `src/services/auth.ts`

| Endpoint | Body | Success | Used by |
|---|---|---|---|
| `POST /api/auth/signup` | `{ fullName, phoneOrEmail, password }` | `204` — account created, 6-digit code sent by SMS/email | `/register` |
| `POST /api/auth/verify` | `{ phoneOrEmail, code }` | `{ profile? }` + session cookie | `/verify` |
| `POST /api/auth/resend` | `{ phoneOrEmail }` | `204` | `/verify` "Resend" |
| `POST /api/auth/login` | `{ phoneOrEmail, password }` | `{ profile? }` + session cookie. `401` = wrong details | `/login` |
| `POST /api/auth/forgot` | `{ phoneOrEmail }` | `204` **always**, even if no account (don't reveal who's registered) | `/forgot-password` |
| `POST /api/auth/reset` | `{ phoneOrEmail, code, password }` | `204`; sign out other sessions | `/reset-password` |
| `POST /api/auth/logout` | — | `204` | Profile → Log out |

Phone numbers arrive normalised (`0803 123 4567` style, see `src/utils/phone.ts`).
Rate-limit signup/verify/login/forgot per number and per IP. The login screen
already shows a lock after 5 failed attempts; enforce the same on the server.

## 2. Student profile — `src/services/profile.ts`

| Endpoint | Body | Success |
|---|---|---|
| `GET /api/me` | — | `UserProfile` (or `401` when signed out) |
| `PATCH /api/me` | `Partial<UserProfile>` | `204` |

`UserProfile` includes `exams` (UTME, Post-UTME, WAEC, NECO, GCE, NABTEB),
`selectedSubjects` (JAMB), `schoolCert` (class + 7–9 subjects), `targetInstitution`,
`targetCourse`, `tutorId`, `plan`. **The server must ignore `plan` in PATCH** — only a
verified payment changes it (the frontend already strips it).

## 3. Payments (Paystack) — `src/services/payments.ts`

| Endpoint | Body | Success |
|---|---|---|
| `POST /api/payments/initialize` | `{ plan: 'monthly' \| 'quarter', method }` | `{ authorizationUrl, reference }` — the browser is sent to Paystack |
| `GET /api/payments/verify?reference=` | — | `{ status: 'success' \| 'failed' \| 'pending', plan, expiresAt }` |
| `POST /api/payments/webhook` | Paystack event | Verify the signature, mark the student Premium. **This is the source of truth.** |

Prices are on the Upgrade page: ₦2,500/month and the 3-month plan. Paystack's
callback URL should be `https://<site>/upgrade?reference=…`.

## 4. AI tutor — `src/services/tutor.ts`

| Endpoint | Body | Success | Used by |
|---|---|---|---|
| `POST /api/tutor/chat` | `{ message, history: { role: 'student'\|'tutor', text }[], tutorId? }` | `{ reply }` | Tutor panel chat |
| `POST /api/tutor/explain` | `SolveRequest + { tutorId? }` | `{ reply }` | "Ask AI" on every question, "Solve with Ada", exam results |

`SolveRequest`: `{ subject, question, options[], correctAnswer, explanation, yourAnswer?, topic?, mode?: 'solve' \| 'hint' }`.

- `mode: 'hint'` is sent **during a timed exam** — the reply must not reveal the answer.
- `tutorId` (`ada`, `tobi`, `zainab`) sets the teaching style; personas are in `src/data/tutors.ts`.
- The reply may use `**bold**` and line breaks; nothing else is rendered.
- The official `correctAnswer` is never changed by the AI. If the model disagrees,
  flag the question for admin review instead of telling the student another answer.
- **Free plan: 5 tutor questions/lessons a day, enforced here.** The browser counter
  (`src/lib/tutor-quota.ts`) is display only. Return `402` or `429` with a friendly `error` when used up.

## 5. Classroom — `src/services/classroom.ts`

| Endpoint | Body | Success |
|---|---|---|
| `POST /api/classroom/lesson` | `{ subject, topic, tutorId? }` | `Lesson` |

`Lesson` = `{ subject, topic, steps: { say, board: { kind, text }[] }[], check: { question, options[], answer, why } }`,
where `kind` is `title | line | formula | example | note`. Nine hand-written lessons
in `src/data/syllabus.ts` show the expected style and length. Counts toward the free quota.

## 6. Content students read (not wired yet)

Questions, news, courses and faculty sets currently live in the browser
(`src/lib/cms.ts`, localStorage key `itutor-cms-v1`), so each admin device has its own
copy. The backend should serve them from the database:

| Endpoint | Returns |
|---|---|
| `GET /api/questions?exam=&subject=&year=&school=` | Published `CmsQuestion[]` only |
| `GET /api/news` | Published `CmsNews[]` |
| `GET /api/courses` | `CmsCourse[]` (UTME courses + WAEC/NECO/GCE classes) |
| `GET /api/faculty-sets` | `FacultySet[]` |

When these exist, `cms.ts` loads from them on start instead of localStorage. Its
action functions (`cms.addQuestions`, `cms.saveNews`, …) map 1:1 to the admin
endpoints in §7, so admin screens don't change.

## 7. Admin — `src/services/admin.ts`, `src/lib/question-import.ts`

All need `x-admin-key`.

| Endpoint | Body | Success | Mirrors `cms.` |
|---|---|---|---|
| `GET /api/admin-check` | — | `{ ok: true, ai: boolean }`; `401` wrong key; `503` AI not configured | sign-in |
| `POST /api/parse-questions` | `{ subject, examType, year, source, text, file?: { name, mediaType, data(base64) } }` | `{ questions: ParsedQuestion[], warnings: string[] }` | Import with AI |
| `POST /api/admin/auto` | `{ message }` | `AutoPlan` (only the action kinds in `auto-agent.ts`) | i-Auto |
| `POST /api/admin/email` | `{ audience, subject, body }` | `{ queued }` | i-Auto email |
| `GET /api/admin/questions` | filters as §6, incl. drafts | `CmsQuestion[]` | bank |
| `POST /api/admin/questions` | `QuestionDraft[]` | created rows | `addQuestions` |
| `PATCH /api/admin/questions/:id` | `Partial<CmsQuestion>` | row | `updateQuestion` |
| `POST /api/admin/questions/status` | `{ ids, status }` | `204` | `setStatus` |
| `DELETE /api/admin/questions` | `{ ids }` | `204` | `deleteQuestions` |
| `PUT /api/admin/news/:id` · `DELETE …` · `POST /api/admin/news/publish` | | | `saveNews`, `deleteNews`, `publishNews` |
| `PUT /api/admin/courses/:id` · `DELETE …` | | | `saveCourse`, `deleteCourse` |
| `PUT /api/admin/faculty-sets/:faculty` | `FacultySet` | | `saveFacultySet` |
| `GET /api/admin/activity` | | `{ at, text }[]` | Overview activity |

`ParsedQuestion` and the AI import rules are documented at the top of
`src/lib/question-import.ts`. i-Auto's description of the admin panel (the model's
instructions) is `ADMIN_KNOWLEDGE` in `src/lib/auto-agent.ts`.

**Database rule:** one paper per exam + subject + year (+ school for Post-UTME).
Add a unique index; the admin UI already blocks duplicates but the server must too.

---

## Security checklist before real students

1. **Card details must not touch i-Tutor's code.** The current card form on `/upgrade`
   is a test-mode mock. In live mode `payForPlan` redirects to Paystack's checkout;
   remove the card form once live (PCI rule).
2. **Premium is decided by the server only** — from the Paystack webhook. Today the
   demo stores `itutor-plan` in the browser, which anyone can edit.
3. **Admin access:** the shared admin key is fine to start; move to real admin
   accounts (email + password + 2FA, roles) before adding more staff. Never ship the key in the frontend.
4. **Free-plan limits** (tutor, Ask AI, classroom) enforced on the server (§4).
5. **AI keys and the Paystack secret key** live only in the backend's environment
   variables. Only `VITE_API_URL` and the Paystack *public* key go to the frontend.
6. **Biometric login** is demo-only and is hidden automatically in live mode. Bring
   it back later with passkeys (WebAuthn).

## Known gaps in the UI (decide when building the backend)

- **Password reset has no code field.** `/forgot-password` sends a code, but
  `/reset-password` only asks for the new password; `resetPassword()` currently sends
  an empty `code`. Either add a 6-digit code field to the reset screen or send a reset
  link with a token in the URL.
- **Profile isn't persisted in demo mode** — a page reload returns to the demo
  student. In live mode `GET /api/me` restores it.
- **JAMB subject step** offers only Mathematics, Physics and Chemistry besides English;
  Arts/Commercial subjects show "coming soon".
- **Voice** (voice lessons, classroom mic, read-aloud) uses the browser's own speech —
  no backend needed. Chrome works best.

## Where each demo stand-in lives

| Feature | Stand-in today | Switches to |
|---|---|---|
| Sign-up, code, login, reset | Short delay, always succeeds | §1 |
| Profile | In memory; plan/tutor in localStorage | §2 |
| Payment | 2-second fake gateway | §3 |
| Tutor chat | Canned replies (`demoReply` in `services/tutor.ts`) | §4 |
| Ask AI / Solve with | Built from the question's stored explanation | §4 |
| Classroom | Hand-written lessons / topic outline | §5 |
| Content | Browser localStorage (`itutor-cms-v1`) | §6, §7 |
| Admin import | Pattern matcher (`basicParse`) for "1. … A. … Answer: C" papers | §7 |
| i-Auto | Rule-based planner (`planLocally`) | §7 |
| Student emails | Logged in Activity only | §7 |
