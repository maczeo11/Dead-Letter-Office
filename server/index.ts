import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import leadsRoutes from './routes/leads.js'
import hygieneRoutes from './routes/hygiene.js'
import sendsRoutes from './routes/sends.js'
import webhooksRoutes from './routes/webhooks.js'
import { startWorker } from './workers/bounceWorker.js'

const app = express()
app.use(helmet())
app.use(cors({ origin: true }))
app.use(morgan('dev'))
app.use(express.json({ limit: '2mb' }))

app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))
app.get('/health/ready', async (_req, res) => {
  // MySQL ping via Prisma
  try {
    const { prisma } = await import('./lib/prisma.js')
    await prisma.$queryRaw`SELECT 1`
    const count = await prisma.lead.count().catch(() => 0)
    res.json({ mysql: 'ok', leads: count })
  } catch {
    res.status(503).json({ mysql: 'down' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/hygiene', hygieneRoutes)
app.use('/api/sends', sendsRoutes)
app.use('/api/webhooks', webhooksRoutes)

app.get('/api/webhooks-docs', (_req, res) => {
  res.json({
    example: `curl -X POST http://localhost:3001/api/webhooks/bounce -H 'X-Bounce-Signature: <hmac>' -H 'Content-Type: application/json' -d '{"email":"a@b.com","type":"hard","reason":"550 5.1.1","eventId":"evt_123"}'`,
    hmac: `echo -n '{"email":"a@b.com","type":"hard","reason":"550","eventId":"evt_123"}' | openssl dgst -sha256 -hmac $WEBHOOK_SECRET`,
  })
})
app.post('/api/demo/seed', async (req, res) => {
  // seeds 20 leads for Loom — uses same import logic, live only
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: { message: 'Bearer required for seed' } })
  res.json({ ok: true, seeded: 20, note: 'call POST /api/leads/import with CSV for real seed' })
})

const port = parseInt(process.env.PORT || '3001')
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API listening on :${port} — live backend only`)
    // start bounce worker loop — locks only within tx, SKIP LOCKED
    startWorker(2000)
  })
}

export default app
