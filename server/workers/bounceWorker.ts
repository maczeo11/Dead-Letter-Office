import { prisma } from '../lib/prisma.js'
import { claimSql } from '../lib/db.js'
import { computeScore, nextLeadStatus } from '../lib/score.js'

type BounceEventRow = { id: string; payload: string }

type BouncePayload = {
  userId: string
  email: string
  type: string
  eventId: string
  reason?: string
}

const CLAIM_BATCH = 10
/** A claim older than this is assumed to belong to a dead worker and is requeued. */
export const STALE_CLAIM_MS = 60_000
export const MAX_ATTEMPTS = 5

/**
 * Claim a batch. `FOR UPDATE SKIP LOCKED` lets N workers pull disjoint rows
 * without blocking each other. Rows move PENDING → PROCESSING inside the
 * transaction, so the claim is durable, but they are only marked DONE *after*
 * the work commits — a crash mid-batch leaves them PROCESSING for the stale
 * reaper to requeue rather than silently dropping the bounce.
 */
async function claimBatch(): Promise<BounceEventRow[]> {
  return prisma.$transaction(async tx => {
    const found = await tx.$queryRawUnsafe<BounceEventRow[]>(claimSql(CLAIM_BATCH))
    if (found.length === 0) return []
    await tx.bounceEvent.updateMany({
      where: { id: { in: found.map(r => r.id) } },
      data: { status: 'PROCESSING', claimedAt: new Date(), attempts: { increment: 1 } },
    })
    return found
  })
}

/** Requeue events whose worker died mid-flight; give up after MAX_ATTEMPTS. */
export async function requeueStaleClaims(staleMs = STALE_CLAIM_MS) {
  const cutoff = new Date(Date.now() - staleMs)
  const [requeued, exhausted] = await Promise.all([
    prisma.bounceEvent.updateMany({
      where: { status: 'PROCESSING', claimedAt: { lt: cutoff }, attempts: { lt: MAX_ATTEMPTS } },
      data: { status: 'PENDING', claimedAt: null },
    }),
    prisma.bounceEvent.updateMany({
      where: { status: 'PROCESSING', claimedAt: { lt: cutoff }, attempts: { gte: MAX_ATTEMPTS } },
      data: { status: 'FAILED', error: 'exceeded max attempts' },
    }),
  ])
  return { requeued: requeued.count, exhausted: exhausted.count }
}

/**
 * Apply one bounce. Everything that mutates state runs in a single transaction
 * keyed on `Bounce.eventId @unique`, so a redelivered webhook either applies
 * once in full or rolls back entirely — the score can never be double-counted.
 */
async function applyBounce(p: BouncePayload): Promise<'applied' | 'duplicate' | 'unknown-lead'> {
  // Scoped by userId: Lead.email is only unique *per user*, so an unscoped
  // lookup would attribute one tenant's bounce to another tenant's lead.
  const lead = await prisma.lead.findUnique({
    where: { userId_email: { userId: p.userId, email: p.email } },
  })
  if (!lead) return 'unknown-lead'

  const isHard = p.type === 'hard'

  try {
    await prisma.$transaction(async tx => {
      // Idempotency guard — a duplicate eventId aborts the whole transaction.
      await tx.bounce.create({ data: { leadId: lead.id, eventId: p.eventId, type: p.type, reason: p.reason } })

      const updated = await tx.lead.update({
        where: { id: lead.id },
        data: { softCount: { increment: isHard ? 0 : 1 }, reason: p.reason },
      })
      const status = nextLeadStatus(updated.status, isHard, updated.softCount)
      if (status !== updated.status) {
        await tx.lead.update({ where: { id: lead.id }, data: { status } })
      }

      // Atomic increments rather than read-modify-write, so concurrent workers
      // on the same tenant can't clobber each other's counters.
      const hs = await tx.hygieneScore.upsert({
        where: { userId: lead.userId },
        create: { userId: lead.userId, total: 0, hard: isHard ? 1 : 0, soft: isHard ? 0 : 1, score: 100 },
        update: { hard: { increment: isHard ? 1 : 0 }, soft: { increment: isHard ? 0 : 1 } },
      })
      await tx.hygieneScore.update({
        where: { userId: lead.userId },
        data: { score: computeScore(hs.total, hs.hard, hs.soft) },
      })
    })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') return 'duplicate'
    throw e
  }

  return 'applied'
}

let lastRequeueAt = 0

export async function processBounceEvents() {
  // Only check stale claims periodically (e.g. once per minute) rather than every tick
  if (Date.now() - lastRequeueAt > STALE_CLAIM_MS) {
    lastRequeueAt = Date.now()
    await requeueStaleClaims().catch(err => console.error('Stale claims requeue failed', err))
  }

  const rows = await claimBatch()
  let applied = 0

  for (const row of rows) {
    try {
      const p = JSON.parse(row.payload) as BouncePayload
      const outcome = await applyBounce(p)
      if (outcome === 'applied') applied++
      // duplicate and unknown-lead are terminal, not failures — nothing to retry.
      await prisma.bounceEvent.update({
        where: { id: row.id },
        data: { status: 'DONE', error: outcome === 'applied' ? null : outcome },
      })
    } catch (err) {
      // Leave it FAILED with the reason; the reaper only rescues crashed
      // workers, so a poison payload stops here instead of looping forever.
      await prisma.bounceEvent.update({
        where: { id: row.id },
        data: { status: 'FAILED', error: (err as Error).message?.slice(0, 500) ?? 'unknown error' },
      })
      console.error('bounce worker failed', row.id, err)
    }
  }

  return { claimed: rows.length, applied }
}

export function startWorker(initialIntervalMs = 2000, maxIntervalMs = 20000) {
  let currentInterval = initialIntervalMs
  let running = false

  const tick = async () => {
    if (running) return
    running = true
    try {
      const { claimed } = await processBounceEvents()
      if (claimed > 0) {
        currentInterval = initialIntervalMs // busy, stay responsive
      } else {
        currentInterval = Math.min(Math.round(currentInterval * 1.5), maxIntervalMs) // back off to save DB compute
      }
    } catch (err) {
      console.error('bounce worker tick error', err)
      currentInterval = Math.min(Math.round(currentInterval * 1.5), maxIntervalMs)
    } finally {
      running = false
      setTimeout(tick, currentInterval)
    }
  }

  setTimeout(tick, initialIntervalMs)
  console.log(`bounce worker started (adaptive backoff ${initialIntervalMs}ms-${maxIntervalMs}ms) — FOR UPDATE SKIP LOCKED`)
}

