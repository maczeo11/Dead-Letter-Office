import { Router } from 'express'
import multer from 'multer'
import { parse } from 'csv-parse/sync'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { bearer, AuthRequest } from '../middleware/auth.js'
import { computeScore } from '../lib/score.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })
const router = Router()

// POST /api/leads/import — CSV with header email,name — chunk 500, lowercase/trim, skipDuplicates, bump total
router.post('/import', bearer, upload.single('file'), async (req: AuthRequest, res) => {
  const userId = req.userId!
  const buf = (req.file as Express.Multer.File | undefined)?.buffer
  let emails: string[] = []

  if (buf) {
    const records = parse(buf, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[]
    emails = records.map(r => (r.email || r.Email || Object.values(r)[0] || '').trim().toLowerCase()).filter(Boolean)
  } else if (Array.isArray((req.body as { emails?: string[] }).emails)) {
    emails = ((req.body as { emails: string[] }).emails || []).map(e => e.trim().toLowerCase()).filter(Boolean)
  }

  if (emails.length === 0) return res.status(400).json({ error: { message: 'no emails provided (CSV with header email or {emails: []})' } })

  // Deduplicate upfront so chunking does not drop intra-chunk duplicates from skipped count
  const uniqueEmails = [...new Set(emails)]
  const CHUNK = 500
  let imported = 0
  let skipped = emails.length - uniqueEmails.length

  for (let i = 0; i < uniqueEmails.length; i += CHUNK) {
    const chunk = uniqueEmails.slice(i, i + CHUNK)
    // lowercased on the way in so @@unique([userId, email]) actually dedupes
    const rows = chunk.map(email => ({ email, userId, status: 'VALID' }))
    const result = await prisma.lead.createMany({ data: rows, skipDuplicates: true })
    imported += result.count
    skipped += chunk.length - result.count
  }

  // Bump total and recompute in one transaction, so a concurrent import or
  // bounce can't read a total that doesn't match the score it derives.
  await prisma.$transaction(async tx => {
    const hs = await tx.hygieneScore.upsert({
      where: { userId },
      update: { total: { increment: imported } },
      create: { userId, total: imported, hard: 0, soft: 0, score: 100 },
    })
    await tx.hygieneScore.update({
      where: { userId },
      data: { score: computeScore(hs.total, hs.hard, hs.soft) },
    })
  })

  return res.status(201).json({ imported, skipped, total: emails.length })
})

router.get('/', bearer, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const rawStatus = req.query.status as unknown as string
  const status = typeof rawStatus === 'string' ? rawStatus : undefined
  const rawSearch = req.query.search as unknown as string
  const search = typeof rawSearch === 'string' ? rawSearch.trim().toLowerCase() : undefined
  const page = Math.max(1, parseInt(String(req.query.page || '1')) || 1)
  const limit = Math.min(50, parseInt(String(req.query.limit || '20')) || 20)
  const skip = (page - 1) * limit

  const where: Prisma.LeadWhereInput = { userId }
  if (status && status !== 'ALL') where.status = status
  // Substring match, so "gmail" finds bob@gmail.com. It cannot use the email
  // index, but every query is scoped by userId (+ status), so @@index([userId,
  // status]) bounds the scan to one tenant's slice. A trigram/FTS index is the
  // next step if a single tenant's list outgrows that.
  if (search) where.email = { contains: search }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.lead.count({ where }),
  ])

  return res.json({ leads, total, page, limit, totalPages: Math.ceil(total / limit) })
})

router.get('/:id', bearer, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const id = String(req.params.id)
  const lead = await prisma.lead.findFirst({ where: { id, userId }, include: { bounces: true } })
  if (!lead) return res.status(404).json({ error: { message: 'lead not found' } })
  return res.json(lead)
})

export default router
