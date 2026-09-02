'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getApiBase } from '@/lib/api'

export default function WebhooksDocs() {
  const [token, setToken] = useState<string | null>(null)
  const [targetEmail, setTargetEmail] = useState('alex.vance@deadcorp.io')
  const [bounceType, setBounceType] = useState<'hard' | 'soft'>('hard')
  const [customReason, setCustomReason] = useState('550 5.1.1 Recipient address rejected: User unknown')
  const [simLoading, setSimLoading] = useState(false)
  const [simResult, setSimResult] = useState<any>(null)
  const [simError, setSimError] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem('token'))
  }, [])

  async function handleSimulate(isIdempotencyTest = false) {
    if (!token) return setSimError('Please login first to simulate inbound webhooks on your account.')
    setSimLoading(true)
    setSimError(null)

    const eventId = isIdempotencyTest ? 'evt_duplicate_idempotency_test_001' : undefined

    try {
      const res = await fetch(`${getApiBase()}/demo/simulate-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: targetEmail,
          type: bounceType,
          reason: customReason,
          customEventId: eventId,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error?.message || 'Simulation failed')
      setSimResult(j)
    } catch (e) {
      setSimError((e as Error).message)
    } finally {
      setSimLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="label">Webhooks & Integration</div>
          <h1 className="font-serif text-3xl mt-1">Inbound Bounce Ingestion</h1>
        </div>
        <Link href="/leads" className="text-xs uppercase tracking-widest border border-white/20 px-3 py-1.5 hover:bg-white/10 transition">
          View Forensic Logs →
        </Link>
      </div>

      {/* Interactive Webhook Simulator */}
      <div className="tw-card p-6 border-l-4 border-l-[#c8553d] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold font-serif">⚡ Interactive Webhook Simulator</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Test HMAC-SHA256 signature verification & SKIP LOCKED worker live from your browser</p>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest bg-[#c8553d]/20 text-[#c8553d] px-2 py-1 rounded">
            Live Sandbox
          </span>
        </div>

        {!token ? (
          <div className="p-4 bg-white/5 border border-white/10 rounded text-center text-xs">
            <p className="text-zinc-400">Login required to fire simulated webhooks against your tenant list.</p>
            <Link href="/auth" className="inline-block mt-2 bg-white text-black font-bold px-4 py-1.5 uppercase text-[11px]">
              Login / 1-Click Demo →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1 block">Target Lead Email</label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={e => setTargetEmail(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 px-3 py-2 text-xs font-mono focus:outline-none focus:border-white/30"
                  placeholder="e.g. user@targetcorp.com"
                />
              </div>
              <div>
                <label className="label mb-1 block">Bounce Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBounceType('hard')
                      setCustomReason('550 5.1.1 Recipient address rejected: User unknown')
                    }}
                    className={`flex-1 py-2 text-xs uppercase tracking-widest ${bounceType === 'hard' ? 'bg-red-500 text-white font-bold' : 'border border-white/20 text-zinc-400'}`}
                  >
                    🔴 Hard Bounce (Instant Quarantine)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBounceType('soft')
                      setCustomReason('452 4.2.2 Mailbox full / temporary storage quota exceeded')
                    }}
                    className={`flex-1 py-2 text-xs uppercase tracking-widest ${bounceType === 'soft' ? 'bg-amber-500 text-black font-bold' : 'border border-white/20 text-zinc-400'}`}
                  >
                    🟡 Soft Bounce (3x → Risky)
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="label mb-1 block">SMTP Diagnostic Diagnostic Line</label>
              <input
                type="text"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSimulate(false)}
                disabled={simLoading}
                className="bg-white text-black font-bold px-4 py-2 text-xs uppercase tracking-widest hover:bg-zinc-200 transition disabled:opacity-40"
              >
                {simLoading ? 'Signing & Enqueuing...' : '🚀 Fire Signed Webhook'}
              </button>
              <button
                type="button"
                onClick={() => handleSimulate(true)}
                disabled={simLoading}
                className="border border-[#c8553d]/50 text-[#c8553d] hover:bg-[#c8553d]/10 px-4 py-2 text-xs uppercase tracking-widest transition disabled:opacity-40"
              >
                🔄 Test Idempotency (Replay Same Event ID)
              </button>
            </div>

            {simError && (
              <div className="p-3 bg-red-950/50 border border-red-500/50 rounded text-xs text-red-300">
                ⚠️ {simError}
              </div>
            )}

            {simResult && (
              <div className="p-4 bg-black/80 border border-emerald-500/40 rounded space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-white/10 pb-2">
                  <span>✓ 202 ACCEPTED — ENQUEUED</span>
                  <span className="text-[10px] text-zinc-400">Worker drains in ≤ 2000ms</span>
                </div>
                <div className="text-zinc-400 break-all">
                  <span className="text-zinc-500">X-Bounce-Signature (HMAC-SHA256): </span>
                  <span className="text-[#c8553d]">{simResult.signature}</span>
                </div>
                <div className="text-zinc-400">
                  <span className="text-zinc-500">Event ID: </span>{simResult.eventId}
                </div>
                <div className="text-zinc-400">
                  <span className="text-zinc-500">Target: </span>{simResult.payload?.email} ({simResult.payload?.type})
                </div>
                <div className="pt-2 text-right">
                  <Link href="/leads" className="text-xs text-white underline hover:text-emerald-300 font-sans">
                    View in Leads Table & Autopsy →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Technical Documentation */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl">API Specification & Verification Pattern</h2>
        <pre className="bg-black border border-white/10 rounded p-4 text-xs overflow-x-auto leading-relaxed">
          {`# 1. Sign the exact raw request bytes with your tenant HMAC secret:
BODY='{"userId":"<uuid>","email":"a@b.com","type":"hard","reason":"550 5.1.1","eventId":"evt_123"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -r | cut -d' ' -f1)

# 2. Fire bounce webhook to ingestion endpoint:
curl -X POST https://dead-letter-office-production-5851.up.railway.app/api/webhooks/bounce \\
  -H "X-Bounce-Signature: $SIG" \\
  -H 'Content-Type: application/json' \\
  -d "$BODY"

# Returns HTTP 202 Accepted: {"ok":true,"queued":true}
# Replaying the exact same eventId will abort atomically without moving the score.`}
        </pre>
        
        <div className="grid md:grid-cols-2 gap-4 text-xs text-zinc-400">
          <div className="tw-card p-4">
            <div className="font-bold text-white mb-1">Queue & Concurrency Isolation</div>
            <p>
              Bounces are never processed inline. The API returns <code>202</code> immediately and queues <code>BounceEvent PENDING</code>. 
              The background worker drains rows using PostgreSQL <code>FOR UPDATE SKIP LOCKED</code>, guaranteeing zero lock contention across workers.
            </p>
          </div>
          <div className="tw-card p-4">
            <div className="font-bold text-white mb-1">Strict Transactional Idempotency</div>
            <p>
              <code>Bounce.eventId @unique</code> insert shares a single transaction with lead status updates and score increments. 
              Duplicate deliveries roll back whole without moving the Hygiene Score (100 → 90 once, never twice).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
