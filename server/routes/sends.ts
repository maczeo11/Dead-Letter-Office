import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { bearer, AuthRequest } from '../middleware/auth.js'

const router = Router()

// POST /api/sends/preview {leadIds: string[]} → splits sendable vs suppressed (BOUNCED/RISKY)
router.post('/preview', bearer, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const { leadIds } = req.body as { leadIds: string[] }
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: { message: 'leadIds required' } })
  }
  const leads = await prisma.lead.findMany({ where: { id: { in: leadIds }, userId } })
  const suppressed = leads.filter(l => l.status === 'BOUNCED' || l.status === 'RISKY')
  const sendable = leads.filter(l => l.status === 'VALID')
  return res.json({ sendable: sendable.map(l => l.id), suppressed: suppressed.map(l => ({ id: l.id, email: l.email, status: l.status })), counts: { sendable: sendable.length, suppressed: suppressed.length, total: leads.length } })
})

export default router
