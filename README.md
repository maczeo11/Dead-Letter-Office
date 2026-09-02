# Dead Letter Office — Bounce Autopsy / List Hygiene Engine

[![CI/CD Pipeline](https://github.com/maczeo11/Dead-Letter-Office/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/maczeo11/Dead-Letter-Office/actions/workflows/ci-cd.yml)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Frontend%20Live-black?style=flat&logo=vercel)](https://dead-letter-office-ten.vercel.app/)
[![Railway Deployment](https://img.shields.io/badge/Railway-Backend%20API%20Live-0B0D0E?style=flat&logo=railway)](https://dead-letter-office-production-5851.up.railway.app/health/ready)
[![Neon Database](https://img.shields.io/badge/Neon-PostgreSQL%20Serverless-00E599?style=flat&logo=postgresql&logoColor=black)](https://neon.tech)

> **Live Frontend**: [https://dead-letter-office-ten.vercel.app](https://dead-letter-office-ten.vercel.app)  
> **Live API Backend**: [https://dead-letter-office-production-5851.up.railway.app/api](https://dead-letter-office-production-5851.up.railway.app/api)

> Import a lead CSV → receive bounce webhooks → auto-quarantine bad addresses → score the list 0–100 → suppress the
> dead ones before the next campaign goes out, so a stale list never burns the sending domain.

Cold-outbound lists rot: 15–20% of a six-month-old list bounces. Enough hard bounces and the mailbox providers stop
trusting the sending domain — which costs the price of the domain plus a two-week warm-up to replace. The bounces are
usually sitting in a webhook log that nobody reads. This turns that log into a suppression list.

## How it works

```
CSV import ──▶ leads (@@unique [userId, email])
                    │
bounce webhook ─────┼──▶ HMAC over raw body ──▶ BounceEvent (PENDING)
                    │                                  │
                    │            worker: FOR UPDATE SKIP LOCKED ──▶ PROCESSING
                    │                                  │
                    └──────────── hard ⇒ BOUNCED ──────┤
                                  3× soft ⇒ RISKY      │
                                                       ▼
                              hygiene = 100 − ((hard + 0.3·soft) / total × 100)
                                                       │
                              POST /api/sends/preview ─┴──▶ sendable vs suppressed
```

Two details that matter more than the feature list:

- **Bounces are queued, not processed inline.** The webhook verifies and enqueues; a worker drains the queue with
  `FOR UPDATE SKIP LOCKED`. Providers retry aggressively and expect a fast 2xx — doing the write inline means either a
  slow webhook or a dropped event.
- **Redelivery cannot move the score.** `Bounce.eventId` is unique and the insert shares a transaction with the lead
  and score updates, so a duplicate event rolls the whole thing back. A claimed event that dies mid-flight is requeued
  by a stale-claim reaper, so the queue is at-least-once and the *effect* is exactly-once.

## Stack

- **Frontend** — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4
- **Backend** — Node.js, TypeScript, Express 5, Prisma, PostgreSQL 16, JWT, multer, csv-parse, REST
- **Infra** — Docker + Docker Compose, `/health/live` and `/health/ready` probes driving a live status bar
- **Tests** — vitest over the scoring and status-transition logic

Theme is a forensic lab: ink `#0b0b0c`, kraft `#ece9e4`, accent `#c8553d`, Courier for raw SMTP reasons.

## Run it

```bash
cp .env.example .env
docker compose up --build     # db :5433, api :3001, web :3000
```

Then register at `/auth`, import `sample-50-leads.csv` at `/import`, and fire a signed bounce at
`POST /api/webhooks/bounce` — `/webhooks-docs` has a copy-pasteable curl with the HMAC.

```bash
npm run dev        # Next.js only
npx tsx server/index.ts   # API only
npx vitest run     # tests
```

## API

| Method | Route | Notes |
|---|---|---|
| `POST` | `/api/auth/register` · `/api/auth/login` | bcrypt + JWT bearer |
| `POST` | `/api/leads/import` | multipart CSV (header `email`), 500-row chunks, dedupes per user |
| `GET` | `/api/leads?status=&search=&page=&limit=` | filtered + paginated, scoped to the caller |
| `GET` | `/api/leads/:id` | lead + its bounce history (the "autopsy") |
| `POST` | `/api/webhooks/bounce` | HMAC-signed, enqueues; `202` |
| `GET` | `/api/hygiene` | `{ total, hard, soft, score }` |
| `POST` | `/api/sends/preview` | splits lead ids into sendable vs suppressed |
| `GET` | `/health/live` · `/health/ready` | liveness / DB readiness |

## Data model

`User` → `Lead` (`@@unique([userId, email])`, `@@index([userId, status])`) → `Bounce` (`eventId @unique`), plus
`BounceEvent` as the queue (`@@index([status, createdAt])`) and one `HygieneScore` row per user.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.
