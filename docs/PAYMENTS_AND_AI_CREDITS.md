# Payments and AI credits

How students pay for i-Tutor Premium, what the AI allowance is, how each student's AI use is counted, and how to check what the AI costs us.

- **Part 1** is for everyone on the team: plans, the allowance, what students see, and what to do when something goes wrong.
- **Part 2** is for developers: the code, database fields, endpoints and settings.

Figures marked *estimate* come from Google's published Gemini prices and a ₦1,550 = $1 rate. Check Admin → AI usage for the real numbers.

---

# Part 1: How it works

## 1. Plans

| Plan | Price | Premium lasts | AI credits |
|---|---|---|---|
| Free | ₦0 | — | 5 AI prompts, once (they never renew) |
| Premium monthly | ₦2,500 | 30 days | 300 |
| Premium 3 months | ₦6,500 | 90 days | 900 |

Every plan, Free included, has unlimited past questions, answers, written explanations and CBT practice exams. These don't use the AI, so they cost us nothing to serve. Only the AI tutor uses the allowance.

## 2. The AI allowance

### Free students
- **5 AI prompts in total.** Each AI request counts as one prompt, whether it's a chat message, an explanation, a hint or a classroom lesson.
- **They don't come back** the next day or ever. After the fifth, the AI shows *"You've used your 5 free AI prompts"* with a **Subscribe** button.

### Premium students
- **Credits come with every payment:** 300 for a month, 900 for three months.
- **Bigger AI jobs use more credits:**

| What the student does | Credits | Our cost (estimate) |
|---|---|---|
| Sends a message to the AI tutor | 1 | ₦5–8 |
| Taps **Ask AI / Explain with AI** on a question | 1 | ₦7 |
| Asks for a **hint** during a practice exam | 1 | ₦2 |
| Taps a line on the classroom board → **Explain this / Why? / Another example** | 2 | ₦11 |
| Starts a **classroom lesson** | 3 | ₦22 |
| Gets an explanation that was already saved for that question | **0** | ₦0 |
| Uses **voice** (talking and listening) | **0** | ₦0 (the phone does it) |
| Checks admission requirements during sign-up | **0** | charged to us, shared between students |

- **Running out early:** the student stays Premium until their end date, with unlimited exams and past questions. Only the AI pauses until they renew.
- **Renewing:**
  - **Before the end date:** the new credits are **added** to what's left, and the end date moves forward by 30 (or 90) days. A student who renews on 5 November, with an end date of 14 November, gets 300 more credits now and a new end date of 14 December. They never lose days or credits they paid for.
  - **After the end date:** leftover credits are gone, and they start fresh with 300.
- **Credits don't carry over** from one paid period to the next unless the student renews before the end date.
- **A failed AI request gives its credit back** (for example, when the AI is busy or the student's connection drops).

### How long 300 credits last
300 credits over 30 days is 10 credits a day.

| Type of student | Typical day | Credits a day | 300 credits last |
|---|---|---|---|
| Light | 3–4 questions to the AI | 4 | about 75 days |
| Regular | 1 lesson + 5 questions | 8 | about 37 days (the whole month) |
| Serious | 1 lesson + 2 board explanations + 8 questions | 15 | about 20 days |
| Cramming before an exam | 2 lessons + 4 board explanations + 20 questions | 34 | about 9 days |

## 3. What the student sees

- **A ring** in the tutor and classroom headers shows what's left (e.g. **212**). It's green while there's plenty, orange under 25%, and red under 10%. Tapping it shows:
  - "212 of 300 AI credits left · renews 14 Nov";
  - where the credits went ("Classroom lessons · 6 · 18 credits", "Tutor chat · 40 · 40 credits" …);
  - the credit prices;
  - a **Renew now** button when they're running low.
- **A bigger card** on the dashboard and the upgrade page shows the same, with the renewal date.
- **Free students** see "3 of 5 free AI prompts left" and a **Subscribe** button.
- **When the allowance is used up,** the AI shows a clear message with **Subscribe** (Free) or **Renew now** (Premium). Nothing else is blocked.

## 4. How a payment goes through

Students pay on **Paystack's** own page (card, bank transfer or USSD). Card details never reach our server.

1. The student picks a plan on **/upgrade** and taps pay.
2. Our server creates a payment record (status *pending*) with a reference like `ITUT-3F9A1C02B7DE` and sends the student to Paystack.
3. The student pays. Paystack then:
   - sends the student back to **/upgrade?reference=…**, where the page asks our server "was this paid?"; and
   - tells our server directly through the **webhook** (`/api/payments/webhook`). This is the main source of truth.
4. When the payment is confirmed (by whichever arrives first), our server:
   - marks the payment *success*;
   - makes the student Premium and sets their end date;
   - adds their AI credits.
5. The student's ring updates straight away and the page says "Meet your personal tutor".

**Safety built in:**
- **Each payment counts once,** even if the webhook and the page check arrive at the same moment.
- **The webhook only accepts messages signed with our Paystack secret,** so nobody can fake a payment.
- **A payment for less than the plan price is marked failed** and gives nothing.
- **The browser can't change a plan.** Only a confirmed payment can.

## 5. Checking the AI bill: Admin → AI usage

In the admin, open **AI usage** and pick *Today*, *Last 7 days*, *Last 30 days* or *Last 90 days*.

| You'll see | What it means |
|---|---|
| AI cost | What Google will charge us for the period, in naira, from Gemini's own token counts |
| Premium students now | Students with an active Premium plan |
| AI cost per Premium student, a month | AI cost ÷ Premium students, scaled to 30 days. Compare it with the ₦2,500 they pay; it should stay well under about ₦700. |
| Answers served from saved explanations | AI explanations we didn't have to pay for again |
| Table by type | Requests, saved (free) answers, failures, credits taken, cost, and cost per request for each kind of AI use |

The naira figures use the prices and exchange rate in the server's settings (see section 10). Update them when Google changes its prices or the naira moves.

## 6. Checking one student's AI use

- **The student's own view:** they see their usage by tapping the ring, as described in section 3.
- **Admin:** there is **no per-student page in admin yet**. Every request is still recorded against the student, so a developer can look it up (section 12). Ask if you want a per-student view added to Admin → Users.

## 7. Is it profitable? (estimate)

Per Premium student, per month:

| | Typical student | Student who uses all 300 credits |
|---|---|---|
| Student pays | ₦2,500 | ₦2,500 |
| Paystack fee (about 1.5% + ₦100) | −₦137 | −₦137 |
| VAT, if we're VAT-registered | −₦174 | −₦174 |
| **We receive** | **≈ ₦2,190** | **≈ ₦2,190** |
| AI cost | −₦600 to −₦1,100 | −₦1,500 to −₦2,250 |
| **Left per student** | **≈ ₦1,100–1,600** | **≈ ₦0–700** |

- **Free students** cost at most about ₦35 each, once.
- **We never lose money on a student who uses up all their credits,** because the credits are paid for before they're used.
- **Saving explanations and keeping the chat on "low" thinking** keep costs at the low end of these ranges.

**Watch these:**
1. **The exchange rate:** Google bills in dollars.
2. **Google's prices**, which can change.
3. **Tax:** check VAT and company tax with an accountant.

If costs rise, change the credit prices or the monthly allowance (section 11). The ₦2,500 price doesn't have to change.

## 8. When something goes wrong

| Problem | What to do |
|---|---|
| "I paid but I'm still on Free" | Ask for the reference (`ITUT-…`, on the receipt Paystack emails). The student can reopen **/upgrade?reference=ITUT-…** to make the page check again. If Paystack shows it paid and our record still says *pending*, check that the webhook URL in Paystack is right (section 10). |
| "My credits are gone" | Check whether their Premium ended. Credits end with the paid period unless they renewed before the end date. |
| "The AI says I've used my credits, but I haven't" | A developer can check their `aiCredits` and recent `AiCall` rows (section 12). Failed requests give credits back automatically. |
| "The AI says it's busy" | Google's AI was briefly overloaded. The server already retries twice. The student's credit is returned, so they can just try again. |
| Students say the AI is too slow or failing a lot | Look at the *Failed* column in Admin → AI usage and the server logs (`pm2 logs itutor-api`). |
| A student was charged twice | Each payment reference is counted once. Two references means two payments: both added time and credits. Refund one in the Paystack dashboard if needed. |

## 9. Students who were Premium before credits existed

Anyone already Premium when this went live gets **300 credits automatically the first time they use the AI** (or open their ring). This happens once, so nobody is locked out.

---

# Part 2: For developers

## 10. Settings (backend `.env`)

| Setting | What it's for | Default |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | Paystack secret key. It also checks the webhook signature. | — (payments off) |
| `PAYSTACK_CALLBACK_URL` | Where Paystack sends the student back: `<site>/upgrade` | `http://localhost:5173/upgrade` |
| `PAYSTACK_FALLBACK_EMAIL_DOMAIN` | Paystack needs an email; phone-only students get `<digits>@<this>` | `students.itutor.ng` |
| `GEMINI_API_KEY` | The AI | — (AI off) |
| `AI_MODEL` / `AI_FALLBACK_MODEL` | Main model, plus an optional one to try when it's overloaded | `gemini-3.5-flash-lite` / none |
| `AI_PRICE_INPUT_PER_M` / `AI_PRICE_OUTPUT_PER_M` | Gemini's price in dollars per million tokens, for the AI usage report | `0.30` / `2.50` |
| `NAIRA_PER_DOLLAR` | Exchange rate for the AI usage report | `1550` |

In the **Paystack dashboard → Settings → API Keys & Webhooks**, set the webhook URL to:
`https://i-shelf.app/api-i-tutor/api/payments/webhook`

## 11. Where the rules live

| Rule | Backend | Frontend (display only) |
|---|---|---|
| Free prompts (5), credit prices, credits per plan | `src/lib/quota.ts`: `FREE_PROMPTS`, `CREDIT_COST`, `PLAN_CREDITS` | `src/services/credits.ts`: same names, **keep in step** |
| Plan prices and lengths | `src/routes/payments.ts`: `PLANS` | `src/components/web/UpgradeView.tsx`: `PLANS` |
| Granting credits on payment | `settlePayment()` in `src/routes/payments.ts` | — |
| Taking and refunding credits, recording usage | `withCredits()`, `recordAi()`, `recordCached()` in `src/lib/quota.ts` | `spendAi()` in `src/services/credits.ts` refreshes the ring |
| Token counting | `trackUsage()` in `src/ai/client.ts` (reads Gemini's `usageMetadata`) | — |
| Saved explanations | `/explain` in `src/routes/tutor.ts` | — |
| The ring | — | `src/components/web/CreditRing.tsx` |
| AI usage report | `src/routes/admin/ai-usage.ts` | `src/components/admin/AdminAiUsage.tsx` |

The server is the only authority: it takes credits **before** calling the AI, in one database statement that only succeeds when enough is left, so parallel requests can't overspend. The frontend only shows the allowance and refreshes it after each request.

To change a credit price or the allowance, edit both `quota.ts` and `credits.ts`, plus the wording in `cms/home.ts`, `UpgradeView.tsx`, `DashboardView.tsx` and `ProfileView.tsx`. If the homepage was edited in the CMS, update its pricing block there too.

## 12. Database

**`User`** (fields for the plan and credits):

| Field | Meaning |
|---|---|
| `plan`, `planExpiresAt` | `'premium'` while `planExpiresAt` is in the future. Only payments change these. |
| `aiCredits` | Premium credits left in the current paid period |
| `aiCreditsGranted` | Credits given for the current paid period (the "of 300") |
| `aiCreditsSince` | When the current paid period's credits started (for the breakdown) |
| `freeAiUsed` | Free prompts used, out of 5 |

**`Payment`**: one per checkout, with `_id` = Paystack reference, `plan`, `amountKobo`, `status` (`pending` / `success` / `failed`) and `paidAt`.

**`AiCall`**: one row per AI request.

| Field | Meaning |
|---|---|
| `userId` | The student (empty for calls not tied to one student) |
| `kind` | `chat`, `explain`, `hint`, `board`, `lesson` or `admissions` |
| `credits` | Credits taken (0 for free prompts, saved answers and failures) |
| `cached` | Served from a saved explanation: no AI call |
| `failed` | The request failed (credit given back). Google may still bill its tokens. |
| `model`, `inputTokens`, `outputTokens` | Gemini's counts; output includes the hidden "thinking" tokens |
| `at` | When it happened |

**`Explanation`**: saved explanations. `_id` is a hash of the question, options, answer, the student's pick and the tutor, so editing a question gives it a fresh explanation. Answers the AI doubted aren't saved.

### Looking up one student
In MongoDB Atlas → Browse Collections → `itutor`:
1. Find the student in **`User`** with the filter `{ "phoneOrEmail": "student@example.com" }`. Note their `_id`, `aiCredits`, `freeAiUsed` and `planExpiresAt`.
2. Open **`AiCall`** and filter by that id: `{ "userId": "<their _id>" }`. Sort by `at` descending. Each row is one AI request, with its credits and tokens.
3. Open **`Payment`** and filter with `{ "userId": ObjectId("<their _id>") }` to see their payments.

## 13. Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/payments/initialize` | `{ plan: 'monthly' \| 'quarter', method? }` → `{ authorizationUrl, reference }` |
| GET | `/api/payments/verify?reference=…` | Checks with Paystack if still pending → `{ status, plan, expiresAt }` |
| POST | `/api/payments/webhook` | Paystack only (signed). Settles `charge.success`. |
| GET | `/api/me/credits` | `{ plan, left, total, renewsAt, breakdown: [{ kind, uses, credits }] }` |
| GET | `/api/admin/ai-usage?days=30` | Admin: AI cost by kind, in naira |

Every AI endpoint (`/api/tutor/chat`, `/api/tutor/explain`, `/api/classroom/lesson`, `/api/classroom/explain`) answers **402** with a message when the allowance is used up. Separately, each student may make at most **20 AI requests a minute** (a burst limit).

## 14. Deploying changes to these rules

After changing the database fields in `prisma/schema.prisma`, run this on the VPS:

```bash
cd /opt/Api-i-Tutor
git pull
npm ci
npm run build
npx prisma db push      # adds new fields and collections; existing data is kept
pm2 restart itutor-api
```

On a developer's computer, stop the local API before running `npx prisma generate`. Windows locks a Prisma file while the API is running.
