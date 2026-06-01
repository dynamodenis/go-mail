# Inngest — Dev & Production Workflows

Inngest is the background-job orchestrator behind email sending. This doc covers
how to run it locally and how it works once deployed. For *what* the functions
do, see [email-sending-flow.md](./email-sending-flow.md).

> **Mental model.** Your app only ever **serves** the functions (over HTTP at
> `/api/inngest`) and **sends events**. Something else does the *orchestrating* —
> deciding when to run functions, retrying, sleeping, fanning out. In **dev**
> that orchestrator is the local Inngest Dev Server. In **production** it's
> **Inngest Cloud**. Your code is identical in both; only the orchestrator and a
> couple of env vars change.

---

## 1. How it's wired in this repo

| Piece | Location | Notes |
|-------|----------|-------|
| Inngest client | `src/lib/inngest.ts` | `new Inngest({ id: "go-send" })` + event payload types. |
| Serve route | `src/routes/api/inngest.ts` | `serve({ client, functions })` exposed at `GET/POST/PUT /api/inngest`. |
| Functions | `src/features/email-schedule/inngest/functions.ts` | `dispatchBatch`, `sendEmailToRecipient`. |
| Dev script | `package.json` → `npm run inngest` | Local dev server pinned to port 3010. |

The `serve()` handler and the `Inngest` client **auto-detect** their mode and
**auto-read env vars** — there is no dev-vs-prod branching in the code.

---

## 2. Development workflow

Inngest needs **two processes** locally: your app (serves + sends) and the dev
server (orchestrates).

**Terminal 1 — the app:**
```bash
npm run dev          # http://localhost:3010, functions at /api/inngest
```

**Terminal 2 — the Inngest Dev Server:**
```bash
npm run inngest      # = npx inngest-cli@latest dev -u http://localhost:3010/api/inngest
```

Then open the **dev dashboard at http://localhost:8288**. You'll see
`dispatchBatch` and `sendEmailToRecipient` registered, and a live run stream when
you create a batch.

### Notes
- The `inngest` package (`^4.2.4`) is the **SDK** (`createFunction`, `serve`).
  The dev server is a **separate binary** (`inngest-cli`), fetched on demand by
  `npx` — nothing permanent is installed.
- **No signing/event keys are needed in dev.** The SDK detects the local dev
  server and skips request signing.
- The `-u` flag is **dev-only**. It tells the local server where your endpoint
  is. It does not exist and has no effect in production.

### Quick verification
1. Visit `http://localhost:3010/api/inngest` in a browser — it should return
   JSON (the function manifest). If it doesn't, the dev server can't sync.
2. Trigger an immediate batch from the app.
3. Watch the run in the 8288 dashboard step through
   `load-batch → fan-out → send-via-resend → mark-sent → maybe-finalize`.

### Common dev issues
| Symptom | Cause / fix |
|---------|-------------|
| Functions don't appear in 8288 | App not running on 3010, or `-u` URL wrong. Confirm the endpoint returns JSON. |
| Runs never start | Dev server started before the app — restart `npm run inngest` after `npm run dev` is up. |
| Emails error immediately | `RESEND_API_KEY` / `RESEND_FROM_EMAIL` not set (see [email-sending-flow.md §9](./email-sending-flow.md#9-configuration--feature-gating)). |

---

## 3. Production workflow

There is **no dev server in production** — you do not run `npm run inngest` on
your host. Instead, **Inngest Cloud** is the hosted orchestrator. It calls your
deployed `/api/inngest` endpoint over HTTPS to discover and invoke functions.

```
event fired in app
      │
      ▼
Inngest Cloud (hosted queue / scheduler)
      │  invokes over HTTPS
      ▼
https://<your-domain>/api/inngest   ← same serve() route, now public
      │
      ▼
dispatchBatch / sendEmailToRecipient
```

### One-time setup

1. **Deploy the app** so `/api/inngest` is publicly reachable, e.g.
   `https://<your-domain>/api/inngest`.
2. **Create an Inngest Cloud app/environment** at https://app.inngest.com and
   grab its keys.
3. **Set env vars** on the host (Railway, Vercel, etc.):

   | Var | Purpose |
   |-----|---------|
   | `INNGEST_EVENT_KEY` | Lets the app **send** events to Inngest Cloud. |
   | `INNGEST_SIGNING_KEY` | Lets the `serve()` route **verify** that incoming invocations are genuinely from Inngest. |

   These are read automatically by `Inngest({ id })` and `serve()` — no code
   change.
4. **Sync the app** with Inngest Cloud (register the endpoint URL). Do this via
   the dashboard ("Sync new app" → paste the URL), the platform integration
   (Vercel/Netlify), or a `PUT` to your endpoint. Re-sync after each deploy that
   adds/renames functions.

### Behind a proxy / custom domain

Inngest infers its public URL from request headers. If syncing registers the
wrong URL (common behind load balancers), pin it explicitly:

```ts
// src/routes/api/inngest.ts
const inngestHandler = serve({
  client: inngest,
  functions,
  serveHost: "https://<your-domain>", // or set INNGEST_SERVE_HOST
});
```

### Production checklist
- [ ] App deployed; `GET https://<your-domain>/api/inngest` returns JSON.
- [ ] `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` set in the host env.
- [ ] App synced in the Inngest Cloud dashboard (functions visible there).
- [ ] `RESEND_API_KEY` + `RESEND_FROM_EMAIL` set (delivery), `RESEND_RPS` tuned
      to the Resend plan.
- [ ] Triggered a real batch and confirmed runs in the Inngest Cloud dashboard.

---

## 4. Dev vs production at a glance

| | Development | Production |
|---|-------------|------------|
| Orchestrator | Local Inngest Dev Server (`npm run inngest`) | Inngest Cloud (hosted) |
| How functions are found | `-u http://localhost:3010/api/inngest` | One-time **sync** of the public URL |
| Signing/event keys | Not required | `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` required |
| Dashboard | http://localhost:8288 | https://app.inngest.com |
| Your code | identical | identical |
