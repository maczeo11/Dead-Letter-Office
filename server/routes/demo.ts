import { Router } from 'express'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { bearer, AuthRequest } from '../middleware/auth.js'
import { computeScore } from '../lib/score.js'

const router = Router()

const HARD_BOUNCE_REASONS = [
  '550 5.1.1 <alex.vance@deadcorp.io>: Recipient address rejected: User unknown in virtual mailbox table',
  '554 5.7.1 <sarah.crook@defunctfin.com>: Relay access denied - domain suspended for non-payment',
  '550 5.2.1 The email account that you tried to reach does not exist: <ceo@stealthstartup.dev>',
  '550 5.1.2 Host or domain name not found: <john@vaporware-saas.biz>',
  '553 5.3.0 Recipient address rejected: mailbox disabled due to spam activity',
  '550 5.7.26 SPF and DKIM authentication failed for sending domain',
  '550 5.0.0 Permanent delivery failure: target server blacklisted sender IP',
  '554 5.4.14 Hop count exceeded - mail routing loop detected',
]

const SOFT_BOUNCE_REASONS = [
  '452 4.2.2 Mailbox full / quota exceeded - recipient has not drained inbox',
  '421 4.7.0 Rate limit exceeded - sending server throttling concurrent connections',
  '451 4.4.1 Connection timed out during TLS handshake',
  '451 4.3.0 Mail system temporary error - backend storage unavailable',
]

// POST /api/demo/seed — seeds 40 valid, 8 hard-bounced, 5 risky leads with realistic SMTP autopsy history
router.post('/seed', bearer, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const ts = Date.now()

  // 1. Valid leads (35 leads)
  const validEmails = [
    'sundar.p@alphabet.com', 'satya.n@microsoft.com', 'sam.altman@openai.com',
    ' Jensen.huang@nvidia.com', 'tim.cook@apple.com', 'demis.hassabis@deepmind.com',
    'bhanu.teja@gitam.edu', 'clara.oswald@tardis.org', 'bruce.wayne@waynecorp.com',
    'diana.prince@themiscira.gov', 'barry.allen@star-labs.com', 'hal.jordan@ferrisair.com',
    'peter.parker@dailybugle.nyc', 'tony.stark@starkindustries.com', 'steve.rogers@shield.gov',
    'natasha.romanoff@redroom.org', 'bruce.banner@gamma-labs.edu', 'thor.odinson@asgard.realm',
    'wanda.maximoff@westview.net', 'vision.synthezoid@avengers.org', 'stephen.strange@kamar-taj.org',
    'carol.danvers@starforce.space', 'maria.hill@shield-ops.net', 'daisy.johnson@quake.net',
    'jemma.simmons@biochem.edu', 'alphonso.mack@garage.net', 'matthew.murdock@nelsonmurdock.law',
    'foggy.nelson@nelsonmurdock.law', 'jessica.jones@alias-investigations.com', 'luke.cage@harlem-heroes.org',
    'danny.rand@randcorp.com', 'colleen.wing@chikara-dojo.org', 'misty.knight@nypd.gov',
    'rachel.green@ralphlauren.com', 'monica.geller@alessandro.rest'
  ].map(e => e.trim().toLowerCase())

  // 2. Hard Bounce leads (8 leads)
  const hardBounces = [
    { email: `alex.vance_${ts}@deadcorp.io`, reason: HARD_BOUNCE_REASONS[0] },
    { email: `sarah.crook_${ts}@defunctfin.com`, reason: HARD_BOUNCE_REASONS[1] },
    { email: `ceo_${ts}@stealthstartup.dev`, reason: HARD_BOUNCE_REASONS[2] },
    { email: `john_${ts}@vaporware-saas.biz`, reason: HARD_BOUNCE_REASONS[3] },
    { email: `spammer_${ts}@burner-domain.cc`, reason: HARD_BOUNCE_REASONS[4] },
    { email: `auth_fail_${ts}@unverified-relay.net`, reason: HARD_BOUNCE_REASONS[5] },
    { email: `blacklisted_${ts}@spamcop-flagged.org`, reason: HARD_BOUNCE_REASONS[6] },
    { email: `loop_${ts}@broken-mx-routing.com`, reason: HARD_BOUNCE_REASONS[7] },
  ]

  // 3. Risky leads (3x soft bounces) (5 leads)
  const riskyLeads = [
    { email: `overquota.mark_${ts}@cloudscale.io`, softCount: 3, reason: SOFT_BOUNCE_REASONS[0] },
    { email: `throttled.elena_${ts}@fastcorp.net`, softCount: 3, reason: SOFT_BOUNCE_REASONS[1] },
    { email: `timeout.david_${ts}@slowmail.org`, softCount: 4, reason: SOFT_BOUNCE_REASONS[2] },
    { email: `tempfail.priya_${ts}@unstable-host.in`, softCount: 3, reason: SOFT_BOUNCE_REASONS[3] },
    { email: `storagefull.clark_${ts}@metropolis-daily.news`, softCount: 3, reason: SOFT_BOUNCE_REASONS[0] },
  ]

  // Insert valid leads
  await prisma.lead.createMany({
    data: validEmails.map(email => ({ email, userId, status: 'VALID' })),
    skipDuplicates: true,
  })

  // Insert Hard Bounced leads + autopsy entries
  for (const hb of hardBounces) {
    const lead = await prisma.lead.upsert({
      where: { userId_email: { userId, email: hb.email } },
      create: { userId, email: hb.email, status: 'BOUNCED', softCount: 0, reason: hb.reason },
      update: { status: 'BOUNCED', reason: hb.reason },
    })
    await prisma.bounce.create({
      data: {
        leadId: lead.id,
        eventId: `evt_hard_${lead.id}_${Date.now()}`,
        type: 'hard',
        reason: hb.reason,
      },
    }).catch(() => {})
  }

  // Insert Risky leads + soft bounce autopsy history
  for (const r of riskyLeads) {
    const lead = await prisma.lead.upsert({
      where: { userId_email: { userId, email: r.email } },
      create: { userId, email: r.email, status: 'RISKY', softCount: r.softCount, reason: r.reason },
      update: { status: 'RISKY', softCount: r.softCount, reason: r.reason },
    })
    // Insert 3 bounce records for autopsy
    for (let i = 1; i <= r.softCount; i++) {
      await prisma.bounce.create({
        data: {
          leadId: lead.id,
          eventId: `evt_soft_${i}_${lead.id}_${Date.now()}`,
          type: 'soft',
          reason: `${r.reason} (attempt ${i} of 3)`,
        },
      }).catch(() => {})
    }
  }

  // Recalculate totals and hygiene score
  const totalLeads = await prisma.lead.count({ where: { userId } })
  const hardCount = await prisma.lead.count({ where: { userId, status: 'BOUNCED' } })
  const softBouncesTotal = await prisma.bounce.count({
    where: { type: 'soft', lead: { userId } },
  })

  const score = computeScore(totalLeads, hardCount, softBouncesTotal)

  const hs = await prisma.hygieneScore.upsert({
    where: { userId },
    update: { total: totalLeads, hard: hardCount, soft: softBouncesTotal, score },
    create: { userId, total: totalLeads, hard: hardCount, soft: softBouncesTotal, score },
  })

  return res.json({
    ok: true,
    seeded: {
      valid: validEmails.length,
      hardBounced: hardBounces.length,
      risky: riskyLeads.length,
      total: totalLeads,
    },
    hygiene: hs,
  })
})

// POST /api/demo/simulate-webhook — allows testing HMAC verified webhooks directly from the UI
router.post('/simulate-webhook', bearer, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const { email, type, reason, customEventId } = req.body as {
    email: string
    type: 'hard' | 'soft'
    reason?: string
    customEventId?: string
  }

  if (!email || !type) {
    return res.status(400).json({ error: { message: 'email and type (hard/soft) required' } })
  }

  const eventId = customEventId || `evt_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const defaultReason = type === 'hard'
    ? '550 5.1.1 Recipient address rejected: User unknown'
    : '452 4.2.2 Mailbox quota exceeded - temporary deferral'

  const bodyObj = {
    userId,
    email: email.trim().toLowerCase(),
    type,
    reason: reason || defaultReason,
    eventId,
  }

  const rawBody = JSON.stringify(bodyObj)
  const secret = process.env.WEBHOOK_SECRET || 'dev-webhook-secret-change-me'
  const sig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

  // Enqueue as a verified bounce event into the queue
  await prisma.bounceEvent.create({
    data: { payload: rawBody, status: 'PENDING' },
  })

  return res.status(202).json({
    ok: true,
    queued: true,
    eventId,
    signature: sig,
    payload: bodyObj,
    note: 'Enqueued into FOR UPDATE SKIP LOCKED worker pipeline',
  })
})

export default router
