import { Router } from 'express'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'

const router = Router()

// POST /api/webhooks/bounce {email, type: hard|soft, reason, eventId} — HMAC verified, enqueues PENDING
router.post('/bounce', async (req, res) => {
  const rawBody = JSON.stringify(req.body)
  const sig = (req.headers['x-bounce-signature'] as string) ?? ''
  const secret = process.env.WEBHOOK_SECRET || ''
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

  // timingSafeEqual throws on length mismatch — guard first
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return res.status(401).json({ error: { message: 'bad signature' } })
  }

  const { email, type, reason, eventId } = req.body as { email: string; type: string; reason?: string; eventId: string }
  if (!email || !type || !eventId) return res.status(400).json({ error: { message: 'email, type, eventId required' } })

  const payload = JSON.stringify({ email: email.trim().toLowerCase(), type, reason, eventId })

  await prisma.bounceEvent.create({ data: { payload, status: 'PENDING' } })

  return res.status(202).json({ ok: true, queued: true })
})

export default router
