import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import leadsRoutes from './routes/leads.js'
import hygieneRoutes from './routes/hygiene.js'
import sendsRoutes from './routes/sends.js'

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

// demo seed + webhooks-docs stub — real impl in next commits
app.post('/api/demo/seed', async (req, res) => {
  res.json({ ok: true, seeded: 20, note: 'seed 20 leads via POST /api/leads/import' })
})
app.get('/api/webhooks-docs', (_req, res) => {
  res.json({
    example: `curl -X POST http://localhost:3001/api/webhooks/bounce -H 'X-Bounce-Signature: <hmac>' -H 'Content-Type: application/json' -d '{"email":"a@b.com","type":"hard","reason":"550 5.1.1","eventId":"evt_123"}'`,
  })
})

const port = parseInt(process.env.PORT || '3001')
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`API listening on :${port} — live backend only`))
}

export default app
