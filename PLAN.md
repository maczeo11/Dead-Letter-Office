# Dead Letter Office — Bounce Autopsy / List Hygiene Engine [LOCKED 2026-09-01]

> **For Outbox Labs — SDE Intern (Node/TS/MySQL/React/Tailwind) — 48h to Sept 3 11am — Form https://forms.gle/BSsVLy11mCdsm6Rd6**
> **Research-deep:** Outbox = painkillers not vitamins [outbox.vc/products] owns Reachinbox.ai + Zapmail — pain: domains burn $10-15, reply 8%→2% when reputation collapses [zapmail+reachinbox]. **Not generic Todo — this is a deliverability survival tool.**

## Problem
15-20% outbound lists bounce → Gmail flags domain → domain burns → $10-15 + 2w warmup lost. Teams send, bounces sit in spam, never cleaned → next campaign burns again. No hygiene score.

## Solution
CSV import → bounce webhook → auto-quarantine (hard) / retry 3x (soft) → hygiene score 0-100 → suppress before next send → domain stays 98%. Shows Zapmail/Reachinbox infra understanding.

## Stack (JD 8/8 + 4/4 good-to-have)

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | **Next.js 14 App Router + TypeScript + Tailwind** | JD requires React or Next + Tailwind + TS |
| **Backend** | **Node.js + TypeScript + Express + Prisma + MySQL** | JD requires Node/TS/MySQL + REST + Git |
| **DB** | **MySQL 8 (Prisma)** indexes on `status, email` | DB optimization talk track |
| **Infra** | **Docker + Git** | Good-to-have — shows microservices-ready |
| **Cloud** | **Vercel (FE) + Railway (BE+MySQL)** free | Live hosted portfolio required |
| **Good-to-have** | AWS S3 presigned (like CineFund), Jest 2 tests | Shows AWS + testing |

## Features — MVP 48h (ship this, skip rest)

**Must (for live link):**
1. **Auth** `POST /auth/register, /login` JWT — protects tenant
2. **Leads import** `POST /leads/import` CSV → `leads` table, `email @unique` per user, bulk insert
3. **Bounce webhook** `POST /webhooks/bounce` `{email, type: hard/soft, reason}` → `leads.status = BOUNCED|RISKY` + `hygiene_scores` update
4. **Hygiene score** `GET /lists/:id/hygiene` → `score = 100 - (bounced/total*100)` — red <70, amber 70-90, green >90
5. **Dashboard** Tailwind forensic lab: table `email | status (stamp) | reason monospaced | score` + meter + `Suppress bounced` button

**Nice (if time):**
6. `GET /leads?status=BOUNCED&page&search` pagination + index demo
7. `GET /analytics/bounces` chart by day (Tailwind + Recharts)
8. `POST /campaigns/:id/send` respects hygiene → skips BOUNCED

## Data Model — Prisma MySQL

```prisma
model User { id String @id @default(uuid()) email String @unique password String }
model Lead { id String @id @default(uuid()) email String  userId String  status String @default("VALID") // VALID | BOUNCED | RISKY  reason String?  createdAt DateTime @default(now())  @@unique([userId, email]) @@index([userId, status]) }
model Bounce { id String @id @default(uuid()) leadId String  type String // hard | soft  reason String  createdAt DateTime @default(now()) @@index([leadId]) }
model HygieneScore { id String @id @default(uuid()) userId String @unique total Int bounced Int score Int @@index([userId]) }
```

## API — REST docs (Swagger at /docs)

```
POST   /api/auth/register {email,password}
POST   /api/auth/login -> {token}
POST   /api/leads/import  (multipart CSV) -> {imported, skipped}
GET    /api/leads?status=BOUNCED&page=1&search=gmail
POST   /api/webhooks/bounce {email, type, reason} -> auto-quarantine (live only, no fake)
GET    /api/hygiene -> {total, bounced, score}
GET    /health/ready -> {mysql: ok, score: 87}
```

## UI — Forensics Lab (not AI slop)

**Theme:** ink #0b0b0c + kraft #ece9e4 + accent red #c8553d + Courier for bounce reason + `BOUNCED` rubber stamp + dotted perf like CineFund — editorial, not gradient cards.
- `Inbox` badge `HYGIENE 87%` + meter `score` + `SUPPRESS` btn
- Table: `email` serif, `status` stamp, `reason` mono `550 5.1.1 User unknown`

## Deployment — Free Live (required for form)

| Layer | Free Host | Env |
|---|---|---|
| Next FE | **Vercel** `vercel --prod` | `NEXT_PUBLIC_API_BASE=https://dead-letter-api.up.railway.app/api` |
| Node BE | **Railway** (or Render) | `DATABASE_URL=mysql://...railway, JWT_SECRET=32b` |
| MySQL | **Railway MySQL** (or Neon) | Prisma `db push` |
| Docker | `Dockerfile` `node:20-alpine` | good-to-have |

```bash
# Live steps (30m)
railway login; railway init; railway add --database mysql
railway variables set JWT_SECRET=32b-random DATABASE_URL=mysql://...
railway up --service api
vercel --prod
# Add live URLs to resume header + form + maczéo.me
```

## 48h Timeline

| When | Do | Done |
|---|---|---|
| **Day1 4h** | `npx create-next-app@latest --typescript --tailwind` + `prisma init` + schema above + JWT | scaffold |
| **Day1 6h** | `POST /leads/import` + `POST /webhooks/bounce` + hygiene calc + MySQL indexes | backend live |
| **Day1 4h** | Dashboard Tailwind forensic table + meter + `GET /leads?status` | frontend live |
| **Day2 2h** | `GET /hygiene` score + `Suppress` + `health/ready` HealthBar | polish |
| **Day2 2h** | Docker + Jest 1 test `bounce → BOUNCED exactly once` + README + deploy Vercel/Railway | live link |
| **Sept3 10am** | Update resume 1 line + form https://forms.gle/BSsVLy11mCdsm6Rd6 with live URLs | submit |

## Interview Story

*“Outbox’s Zapmail burns $10/domain on bounces — I built Dead Letter Office as a mini-Zapmail hygiene engine: import 1k CSV → 87 bounced → auto-suppressed → hygiene 87% → next campaign skips bounced → domain stays 98%. Used MySQL unique per user + index on status, REST, Tailwind lab design.”*

## Links

- Outbox: https://www.outboxlabs.ai + https://outbox.vc/products + Reachinbox/Zapmail
- Form: https://forms.gle/BSsVLy11mCdsm6Rd6 (due Sept3 11am)
- Inspo: CineFund `C:\Users\bhanu\mycodes\go\cinefund\web\src\components\HealthBar.tsx:1` (already TS+Tailwind)

---
**Next:** Run `npx create-next-app` scaffold now? I’ll generate full `prisma/schema.prisma + Express api.ts + Next dashboard` in one go.
