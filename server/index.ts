import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import leadsRoutes from './routes/leads.js'
import hygieneRoutes from './routes/hygiene.js'
import sendsRoutes from './routes/sends.js'
import webhooksRoutes from './routes/webhooks.js'
import demoRoutes from './routes/demo.js'
import { startWorker } from './workers/bounceWorker.js'
import { captureRawBody } from './lib/rawBody.js'

const app = express()
app.use(helmet())
app.use(cors({ origin: true }))
app.use(morgan('dev'))
// verify hook keeps the raw bytes for webhook HMAC checks
app.use(express.json({ limit: '2mb', verify: captureRawBody }))

app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))
app.get('/health/ready', async (_req, res) => {
  try {
    const { prisma } = await import('./lib/prisma.js')
    await prisma.$queryRaw`SELECT 1`
    const count = await prisma.lead.count().catch(() => 0)
    res.json({ db: 'ok', leads: count })
  } catch {
    res.status(503).json({ db: 'down' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/hygiene', hygieneRoutes)
app.use('/api/sends', sendsRoutes)
app.use('/api/webhooks', webhooksRoutes)
app.use('/api/demo', demoRoutes)

app.get('/api/webhooks-docs', (_req, res) => {
  const body = `{"userId":"<uuid>","email":"a@b.com","type":"hard","reason":"550 5.1.1","eventId":"evt_123"}`
  res.json({
    note: 'the signature is over the exact request bytes — sign the same string you send',
    hmac: `BODY='${body}'; SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -r | cut -d' ' -f1)`,
    example: `curl -X POST http://localhost:3001/api/webhooks/bounce -H "X-Bounce-Signature: $SIG" -H 'Content-Type: application/json' -d "$BODY"`,
  })
})

const port = parseInt(process.env.API_PORT || '3001')
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API listening on :${port} — live backend only`)
    // start bounce worker loop — locks only within tx, SKIP LOCKED
    startWorker(2000)
  })
}

export default app
