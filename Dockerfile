# Dead Letter Office — local run (simple, not full prod)
# For local: `docker compose up` or `npm run dev` + `npx tsx server/index.ts`
FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000 3001
ENV PORT=3001
ENV NODE_ENV=production

# Simple — run API with tsx (no compile step needed for 48h MVP)
CMD ["npx", "tsx", "server/index.ts"]
