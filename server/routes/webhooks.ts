import { Router } from 'express'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import type { RawBodyRequest } from '../lib/rawBody.js'

const router = Router()

/**
 * POST /api/webhooks/bounce {userId, email, type: hard|soft, reason, eventId}
 *
 * Verified against the *raw* request bytes — re-serializing req.body would
 * change key order and whitespace and never match the sender's signature.
 * The body is only enqueued here; the worker applies it. `userId` is inside
 * the signed payload, so a caller without the secret cannot aim a bounce at
 * another tenant's list.
 */
router.post('/bounce', async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET || 'dev-webhook-secret-change-me'
  if (!process.env.WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WEBHOOK_SECRET is not set in production — using dev fallback')
  }

  const rawBody = (req as RawBodyRequest).rawBody ?? Buffer.alloc(0)
  const sig = (req.headers['x-bounce-signature'] as string) ?? ''
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

  // timingSafeEqual throws on length mismatch — guard first
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return res.status(401).json({ error: { message: 'bad signature' } })
  }

  const { userId, email, type, reason, eventId } = req.body as {
    userId?: string
    email?: string
    type?: string
    reason?: string
    eventId?: string
  }
  if (!userId || !email || !type || !eventId) {
    return res.status(400).json({ error: { message: 'userId, email, type, eventId required' } })
  }
  if (type !== 'hard' && type !== 'soft') {
    return res.status(400).json({ error: { message: 'type must be hard or soft' } })
  }

  const payload = JSON.stringify({ userId, email: email.trim().toLowerCase(), type, reason, eventId })

  await prisma.bounceEvent.create({ data: { payload, status: 'PENDING' } })

  return res.status(202).json({ ok: true, queued: true })
})

export default router
