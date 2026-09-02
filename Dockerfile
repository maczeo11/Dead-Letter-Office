# Dead Letter Office — Express REST API + Prisma + Worker (Pure Backend)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY package.json ./
COPY server ./server
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx server/index.ts"]
