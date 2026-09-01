# Dead Letter Office — Project Plan

> **For Outbox Labs — SDE Intern (Node/TS/MySQL/React/Tailwind) — 48h to Sept 3 11am**
> Form: https://forms.gle/BSsVLy11mCdsm6Rd6 — Live hosted portfolio required.

## 1. Goal

Build a **painkiller not vitamin** for outbound email: bounce hygiene engine that prevents domain burn ($10-15 + 2w warmup, reply 8%→2% when reputation collapses). Outbox owns Reachinbox.ai + Zapmail — this is mini-Zapmail.

## 2. Objectives (6) — review applied

1. **User auth** — JWT register/login, tenant isolation.
2. **Leads import** — CSV → MySQL `leads @unique([userId,email])`, bulk `createMany skipDuplicates` chunk 500, `email.trim().toLowerCase()`, transaction bumps `HygieneScore.total`.
3. **Bounce webhook** — `POST /webhooks/bounce {email, type, reason, eventId}` HMAC verified → `BounceEvent(status=PENDING)` queue → worker `FOR UPDATE SKIP LOCKED` → `BOUNCED|RISKY` (weighted `hard + 0.3·soft`, `RISKY` after 3 softs, `eventId @unique` idempotency).
4. **Hygiene score** — weighted `score = 100 - ((hard + 0.3·soft)/total*100)` `SOFT_WEIGHT=0.3, RISKY_AFTER_SOFT=3` → red <70 / amber 70-90 / green >90.
5. **Dashboard** — forensic lab UI: routes `/ , /import , /leads , /leads/[id] , /dashboard , /webhooks-docs` + table `email | BOUNCED stamp | reason mono 550 5.1.1 | score meter` + Suppress + `POST /api/sends/preview` suppression gate.
6. **Live deploy** — DLO first, CineFund scoped 90min cap, Vercel FE + Railway BE+MySQL + Docker, `HealthBar` shows LIVE/OFFLINE, `POST /api/demo/seed` for Loom.

## 3. Phases — 48h (working hours, reality 2× — buffer to Sept 2 night)

| Hr | Task | Commit |
|---|---|---|
| 0–0.5 | Doc deltas (this file + ARCHITECTURE) | `docs: apply review — weighted scoring, queue worker, route fix` |
| 0.5–2 | Schema + migrate + seed util (binaryTargets, @unique eventId) | `feat(db)` |
| 2–4 | JWT register/login/bearer + vitest on score fn | `feat(auth)` |
| 4–7 | CSV import (chunk 500, lowercase/trim, transaction) + leads list + `sends/preview` | `feat(leads)` |
| 7–9 | BounceEvent + HMAC + worker loop | `feat(webhook)` |
| 9–11 | UI: import / leads / autopsy card / dashboard, HealthBar reused, DLO theme | `feat(ui)` |
| 11–12 | `/api/demo/seed` + `/webhooks-docs` curl | `feat(demo)` |
| 12–14 | Docker + Railway + Vercel deploy, `prisma migrate deploy`, env/CORS | `chore: deploy` |
| 14–15 | Live E2E: seed → fire bounce → score drops → GIF + 60s Loom in README | `docs: demo` |
| 15+ | CineFund scoped deploy (90 min cap) → resume links → submit form | — |

## 4. Metrics

- Hygiene accuracy: weighted `hard + 0.3·soft` vs expected
- DB: `GET /leads?status=BOUNCED` uses `@@index([userId,status])`, `EXPLAIN` type=ref, key=userId_status
- Live: `GET /health/ready {mysql: ok, score:87}` 200, HealthBar green

## 5. Risks — sequencing

- **DLO first, CineFund scoped:** JD judges Node/TS/MySQL/Next/Tailwind — DLO only. CineFund needs Redis/Kafka/MinIO/FFmpeg — free tiers won't host, hard-fail on boot → cap 90min, ship Vercel FE only if API won't boot. HealthBar offline pill makes it designed.
- **Submit by Sept 2 night:** 2h buffer, not Sept 3 11am.
- Railway $5 trial is one-time — single Node+MySQL only, use private `MYSQL_URL`, fallback TiDB Serverless if GitHub <30d blocked.
- `*.ts` HLS ignore already fixed with `!web/**/*.ts` — keep Option A.

## 6. Links

- Repo: https://github.com/maczeo11/Dead-Letter-Office
- Plan: `PLAN.md` (lock), Architecture: `docs/ARCHITECTURE.md`
- Outbox: https://www.outboxlabs.ai + https://outbox.vc/products
