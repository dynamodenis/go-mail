# TODO

Outstanding work on the per-user send-quota system (see `src/lib/quota.ts`,
`EmailSendLedger` in `prisma/schema.prisma`, and the quota gate in
`src/features/email-schedule/api/service.ts`).

---

## 1. Close the quota concurrency gap (read-then-act race)

**What:** The quota gate in `service.ts#expandBatch` reads current usage with
`sumLedgerSince()`, decides `used + created > cap`, then publishes the dispatch
event. The ledger rows that the read counts are only written much later, in the
Inngest `mark-sent` step (one row per successful send). So the value the check
reads and the value that makes it true are updated at different times.

**Why it's a problem:** Two batches expanding concurrently both read the ledger
*before* either has written any rows, so both see the same stale `used` and both
pass the gate. Net effect: the user can exceed their cap.

Example — FREE plan (cap 100), used 0:

| Step | Batch A (60) | Batch B (60) |
|------|--------------|--------------|
| read | used = 0     |              |
| read |              | used = 0     |
| gate | 0+60 > 100? no → publish | |
| gate |              | 0+60 > 100? no → publish |
| send | +60 ledger rows | +60 ledger rows |

Result: 120 sends against a 100 cap. This is a TOCTOU race — correct only when
per-user batch expansion is strictly serialized. It can be triggered by a user
firing multiple batches at once, or by Inngest running expansions / retries
concurrently.

**Severity:** Acceptable while quotas are soft (marketing limits, small bounded
overshoot). Must fix before tying caps to real cost/billing or before treating
the cap as an abuse boundary.

**Fix options:**
- Reserve quota atomically at check time instead of at send time — write a
  reservation row in the same transaction as the read.
- Serialize per-user expansion: Inngest `concurrency` key of `1` per `userId`
  on the expansion step, or a Postgres advisory lock keyed by `userId`.
- DB-level guard: `SELECT ... FOR UPDATE` on the usage read, or a check
  constraint that rejects writes past the cap.

---

## 2. Update `subscriptionStartedAt` from billing (Stripe webhook)

**What:** `User.subscriptionStartedAt` is the anchor for monthly send-quota
cycles (`currentPeriodStart()` in `src/lib/quota.ts`). It currently defaults to
`now()` at signup and is **never updated** afterward.

**Why it's a problem:** When a user changes plans (upgrade/downgrade), the
billing cycle anchor should move to match their real Stripe subscription period.
Right now it stays pinned to signup time, so quota windows won't line up with
what the user is actually billed for once paid plans exist. The schema comment
on the field already flags this as the intended hook.

**Fix:** When Stripe is wired up, have the subscription webhook
(`customer.subscription.created` / `.updated`) overwrite `subscriptionStartedAt`
with the subscription's `current_period_start` on plan change.
