# Dead Letter Office — Docker (Next FE + Express BE + Postgres)

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
COPY --from=build /app/server ./server
COPY --from=build /app/src ./src
COPY --from=build /app/next.config.ts ./
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/postcss.config.mjs ./

EXPOSE 3000 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx server/index.ts & npx next start -p 3000"]
