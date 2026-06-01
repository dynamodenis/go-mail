# GoMail Docs

Developer documentation for the bulk email platform. Start here when you need to
understand a subsystem before changing it.

## Index

| Doc | What it covers |
|-----|----------------|
| [email-sending-flow.md](./email-sending-flow.md) | End-to-end life of an email batch: from a user hitting **Send** (individual recipients or collections) → expansion & dedup → quota reservation → Inngest dispatch → Resend delivery → settlement. Includes every status transition, the retry/fallback paths, and the quota accounting model. |
| [inngest.md](./inngest.md) | Running Inngest in **development** (local dev server, two-terminal workflow) and **production** (Inngest Cloud sync, required env vars, proxy gotchas). Dev-vs-prod comparison at a glance. |

## Conventions

- Code references use `path:line` so they're clickable in most editors. Line
  numbers drift over time — treat them as a starting point, not gospel.
- Diagrams are [Mermaid](https://mermaid.js.org/); GitHub and most IDEs render
  them inline.
