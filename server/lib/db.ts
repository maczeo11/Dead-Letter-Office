// Hexagonal DB adapter — swappable Postgres ↔ MySQL without touching business logic
// Business code imports { prisma } from './prisma.js' and { getDbProvider, quoted } from './db.js'

export type DbProvider = 'postgresql' | 'mysql'

export function getDbProvider(): DbProvider {
  const url = process.env.DATABASE_URL || ''
  if (url.startsWith('mysql://') || url.startsWith('mysql2://')) return 'mysql'
  return 'postgresql' // default: Neon, Railway Postgres, local pg
}

export function isMysql(): boolean {
  return getDbProvider() === 'mysql'
}

export function quoted(name: string): string {
  // Prisma maps model BounceEvent → table "BounceEvent" (quoted). Postgres uses "name", MySQL uses `name`.
  return isMysql() ? `\`${name}\`` : `"${name}"`
}

// For $queryRaw tagging — both dialects support FOR UPDATE SKIP LOCKED since MySQL 8.0.1 / Postgres 9.5
export function claimSql(limit: number): string {
  // Use unquoted identifiers where possible to avoid dialect quoting issues; Prisma table names are case-sensitive
  // but both engines accept unquoted if we match the exact case via quoted helper.
  const table = quoted('BounceEvent')
  const createdAt = quoted('createdAt')
  // Prisma $queryRaw with template tag handles parameter escaping; we interpolate LIMIT as number (safe, internal constant)
  return `SELECT id, payload FROM ${table} WHERE status = 'PENDING' ORDER BY ${createdAt} ASC LIMIT ${limit} FOR UPDATE SKIP LOCKED`
}
