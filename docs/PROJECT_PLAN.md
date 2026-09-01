# Dead Letter Office — Project Plan

> **For Outbox Labs — SDE Intern (Node/TS/MySQL/React/Tailwind) — 48h to Sept 3 11am**
> Form: https://forms.gle/BSsVLy11mCdsm6Rd6 — Live hosted portfolio required.

## 1. Goal

Build a **painkiller not vitamin** for outbound email: bounce hygiene engine that prevents domain burn ($10-15 + 2w warmup, reply 8%→2% when reputation collapses). Outbox owns Reachinbox.ai + Zapmail — this is mini-Zapmail.

## 2. Objectives (6)

1. **User auth** — JWT register/login, tenant isolation.
2. **Leads import** — CSV → MySQL `leads @unique([userId,email])`, bulk `createMany skipDuplicates`.
3. **Bounce webhook** — `POST /webhooks/bounce {email, type, reason}` → `SKIP LOCKED` quarantine → `BOUNCED|RISKY`.
4. **Hygiene score** — `score = 100 - (bounced/total*100)` → red <70 / amber 70-90 / green >90.
5. **Dashboard** — forensic lab UI: table `email | BOUNCED stamp | reason mono 550 5.1.1 | score meter` + Suppress.
6. **Live deploy** — Vercel FE + Railway BE+MySQL + Docker, `HealthBar` shows LIVE/OFFLINE.

## 3. Phases — 48h

| Phase | Hours | Deliverable | Done when |
|---|---|---|---|
| **P1 Scaffold** | 4h | Next 14 TS Tailwind + Prisma MySQL + Express | `npm run dev` + `prisma db push` ok |
| **P2 Auth + Leads** | 6h | JWT + `POST /leads/import` CSV + hygiene calc + `@@index([userId,status])` | CSV 1k → 1k leads, score updates |
| **P3 Webhook** | 4h | `POST /webhooks/bounce` → `BOUNCED` + HygieneScore upsert SKIP LOCKED | bounce → BOUNCED exactly once |
| **P4 UI** | 4h | Dashboard forensic table + meter + HealthBar + `GET /leads?status` | FE shows live data, no fake |
| **P5 Deploy** | 2h | Docker + Jest 1 test + README live URLs + Vercel/Railway | `https://dead-letter-office.vercel.app` live |

## 4. Metrics

- Hygiene accuracy: `bounced/total` vs expected
- DB: `GET /leads?status=BOUNCED` uses `@@index`, `EXPLAIN` shows index
- Live: `GET /health/ready {mysql: ok, score:87}` 200, HealthBar green

## 5. Risks

- Railway MySQL credit $5/mo — keep DB <10MB, `migrate deploy` not `dev`
- `*.ts` HLS ignore already fixed with `!web/**/*.ts` — keep as is
- `NEXT_PUBLIC_` vs `VITE_` — Next uses `NEXT_PUBLIC_API_BASE`

## 6. Links

- Repo: https://github.com/maczeo11/Dead-Letter-Office
- Plan: `PLAN.md` (lock), Architecture: `docs/ARCHITECTURE.md`
- Outbox: https://www.outboxlabs.ai + https://outbox.vc/products
