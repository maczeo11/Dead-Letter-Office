import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { bearer, AuthRequest } from '../middleware/auth.js'

const router = Router()

// POST /api/demo/seed — seeds 20 leads + updates HygieneScore, live only (requires Bearer)
router.post('/seed', bearer, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const emails = Array.from({ length: 20 }, (_, i) => `demo${i + 1}_${Date.now()}@example.com`)
  const rows = emails.map(email => ({ email, userId, status: 'VALID' as const }))

  const result = await prisma.lead.createMany({ data: rows, skipDuplicates: true })

  await prisma.hygieneScore.upsert({
    where: { userId },
    update: { total: { increment: result.count } },
    create: { userId, total: result.count, hard: 0, soft: 0, score: 100 },
  })

  const hs = await prisma.hygieneScore.findUnique({ where: { userId } })
  return res.json({ ok: true, seeded: result.count, hygiene: hs })
})

export default router
