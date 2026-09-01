import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { bearer, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', bearer, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const hs = await prisma.hygieneScore.findUnique({ where: { userId } })
  if (!hs) return res.json({ total: 0, hard: 0, soft: 0, score: 100 })
  return res.json({ total: hs.total, hard: hs.hard, soft: hs.soft, score: hs.score })
})

export default router
