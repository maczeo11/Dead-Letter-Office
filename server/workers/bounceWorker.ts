import { prisma } from '../lib/prisma.js'
import { computeScore, RISKY_AFTER_SOFT, SOFT_WEIGHT } from '../lib/score.js'

type BounceEventRow = { id: string; payload: string }

export async function processBounceEvents() {
  // Worker pull — locks only hold within tx, SKIP LOCKED avoids contention
  const rows = await prisma.$transaction(async tx => {
    const found = await tx.$queryRaw<BounceEventRow[]>`
      SELECT id, payload FROM BounceEvent WHERE status = 'PENDING'
      ORDER BY createdAt ASC LIMIT 10 FOR UPDATE SKIP LOCKED`
    if (found.length === 0) return []
    const ids = found.map(r => r.id)
    await tx.bounceEvent.updateMany({ where: { id: { in: ids } }, data: { status: 'DONE' } })
    // re-read to ensure we own them — simplified: mark DONE then process
    return found
  })

  for (const row of rows) {
    try {
      const { email, type, reason, eventId } = JSON.parse(row.payload) as {
        email: string
        type: string
        eventId: string
        reason?: string
      }

      // find lead (userId unknown from webhook — need to lookup by email across users? For MVP, assume single tenant or first match)
      const lead = await prisma.lead.findFirst({ where: { email } })
      if (!lead) continue

      // idempotent Bounce via eventId @unique
      try {
        await prisma.bounce.create({ data: { leadId: lead.id, eventId, type, reason } })
      } catch (e: unknown) {
        if ((e as { code?: string }).code === 'P2002') continue // deduped
        throw e
      }

      // weighted hygiene + status
      const isHard = type === 'hard'
      const userId = lead.userId

      // update Lead: softCount, status
      let newStatus = lead.status
      let newSoftCount = lead.softCount
      if (isHard) {
        newStatus = 'BOUNCED'
      } else {
        newSoftCount = lead.softCount + 1
        if (newSoftCount >= RISKY_AFTER_SOFT) newStatus = 'RISKY'
      }

      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: newStatus, softCount: newSoftCount, reason },
      })

      // update HygieneScore weighted
      const hs = await prisma.hygieneScore.findUnique({ where: { userId } })
      if (hs) {
        const hard = hs.hard + (isHard ? 1 : 0)
        const soft = hs.soft + (isHard ? 0 : 1)
        const score = computeScore(hs.total, hard, soft)
        await prisma.hygieneScore.update({ where: { userId }, data: { hard, soft, score } })
      }
    } catch (err) {
      await prisma.bounceEvent.update({ where: { id: row.id }, data: { status: 'FAILED' } })
      console.error('bounce worker failed', row.id, err)
    }
  }

  return rows.length
}

export function startWorker(intervalMs = 2000) {
  setInterval(() => {
    processBounceEvents().catch(console.error)
  }, intervalMs)
  console.log(`bounce worker every ${intervalMs}ms — FOR UPDATE SKIP LOCKED`)
}
