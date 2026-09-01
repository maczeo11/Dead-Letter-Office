# Dead Letter Office — Bounce Autopsy / List Hygiene Engine

> Forensic hygiene engine for outbound email — import CSV → bounce webhook → auto-quarantine + hygiene score 0-100 → domain stays 98%.
> **For Outbox Labs** — SDE Intern (Node/TS/MySQL/React/Tailwind) — painkiller not vitamin. Live: `outboxlabs.ai` + `Reachinbox` + `Zapmail` (domains burn $10-15, reply 8%→2%).

Built with **Next.js 14 + TypeScript + Tailwind + Node.js + Express + Prisma + MySQL + REST + Docker** — live hosted required for portfolio.

## How it works

CSV import → MySQL `leads @unique([userId,email])` → bounce webhook `hard/soft` → `SKIP LOCKED` quarantine → hygiene `100-(bounced/total*100)` → suppress before next campaign.

## Stack

- Frontend: Next.js 14 App Router, TypeScript, Tailwind (forensic lab: ink #0b0b0c, kraft #ece9e4, accent #c8553d, Courier mono)
- Backend: Node.js, TypeScript, Express, Prisma, MySQL 8, JWT, multer, csv-parse, REST
- Infra: Docker, Git, Vercel (FE) + Railway (BE+MySQL)

## Roadmap — incremental commits (human)

1. `init: Next+Tailwind+TS scaffold` — create-next-app
2. `feat(db): Prisma MySQL User/Lead/Bounce/Hygiene`
3. `feat(auth): JWT register/login`
4. `feat(leads): CSV import + hygiene score`
5. `feat(webhook): bounce quarantine SKIP LOCKED`
6. `feat(ui): forensic dashboard + HealthBar`
7. `chore: Docker + README live`

See `PLAN.md` for full spec — live URLs will be in this README after deploy.
