'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getApiBase } from '@/lib/api'

type Hygiene = { total: number; hard: number; soft: number; score: number }

export default function Dashboard() {
  const [h, setH] = useState<Hygiene | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  async function loadHygiene(currentToken: string) {
    try {
      const r = await fetch(`${getApiBase()}/hygiene`, {
        headers: { Authorization: `Bearer ${currentToken}` },
        cache: 'no-store',
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error?.message || 'Failed to fetch hygiene')
      setH(j)
      setErr(null)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  useEffect(() => {
    const t = localStorage.getItem('token')
    setToken(t)
    if (!t) return
    loadHygiene(t)
  }, [])

  async function seedForensicData() {
    if (!token) return
    setLoading(true)
    setActionMsg(null)
    setErr(null)
    try {
      const res = await fetch(`${getApiBase()}/demo/seed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error?.message || 'Seeding failed')
      setH(j.hygiene)
      setActionMsg(`⚡ Seeded ${j.seeded.valid} clean, ${j.seeded.hardBounced} hard bounces, and ${j.seeded.risky} risky leads with full autopsy history!`)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function exportCleanLeads() {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${getApiBase()}/leads?status=VALID&limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const j = await res.json()
      if (!res.ok) throw new Error('Export failed')
      const csv = 'email,status\n' + j.leads.map((l: any) => `${l.email},${l.status}`).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clean-deliverable-suppression-list-${Date.now()}.csv`
      a.click()
      setActionMsg(`📥 Downloaded ${j.leads.length} validated deliverable leads (quarantined bounces suppressed).`)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 text-center">
        <div className="tw-card p-6 space-y-4">
          <h1 className="font-serif text-2xl">Authentication Required</h1>
          <p className="text-xs text-zinc-400">Please login to inspect your list hygiene score and bounce autopsy breakdown.</p>
          <Link href="/auth" className="inline-block bg-white text-black font-bold py-2 px-6 uppercase text-xs tracking-widest hover:bg-zinc-200">
            Login / 1-Click Demo →
          </Link>
        </div>
      </div>
    )
  }

  if (err && !h) return <div className="max-w-xl mx-auto px-6 py-8"><p className="text-red-400 text-sm">⚠️ {err}</p></div>
  if (!h) return <div className="max-w-xl mx-auto px-6 py-8"><p className="text-zinc-500">Loading list hygiene metrics…</p></div>

  const scoreColor = h.score >= 90 ? 'bg-emerald-500' : h.score >= 70 ? 'bg-amber-500' : 'bg-red-500'
  const riskPct = h.total > 0 ? Math.round(((h.hard + h.soft) / h.total) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="label">List Hygiene Engine</div>
          <h1 className="font-serif text-3xl mt-1">Domain Health & Autopsy</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={seedForensicData}
            disabled={loading}
            className="border border-[#c8553d]/60 text-[#c8553d] hover:bg-[#c8553d]/10 px-3 py-1.5 text-xs uppercase tracking-widest transition disabled:opacity-40"
          >
            ⚡ Seed Bounces & Autopsies
          </button>
          <button
            onClick={exportCleanLeads}
            disabled={loading || h.total === 0}
            className="bg-white text-black font-bold px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-zinc-200 transition disabled:opacity-40"
          >
            📥 Export Clean List
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded text-xs text-emerald-300 flex items-center justify-between">
          <span>✓ {actionMsg}</span>
          <Link href="/leads" className="underline font-bold ml-2">Inspect Leads →</Link>
        </div>
      )}

      {err && (
        <div className="p-3 bg-red-950/50 border border-red-500/50 rounded text-xs text-red-300">
          ⚠️ {err}
        </div>
      )}

      <div className="tw-card p-6 border-l-4 border-l-[#c8553d]">
        <div className="flex items-end justify-between">
          <div>
            <div className="label">List Hygiene Score</div>
            <div className="font-serif text-6xl mt-1 flex items-baseline gap-2">
              <span>{h.score}</span>
              <span className="text-zinc-500 text-sm font-sans font-normal">/ 100</span>
            </div>
          </div>
          <div className="text-right text-xs font-mono text-zinc-400 space-y-1">
            <div>Total: <span className="text-white font-bold">{h.total}</span></div>
            <div>Hard Bounces: <span className="text-red-400 font-bold">{h.hard}</span></div>
            <div>Soft Bounces: <span className="text-amber-400 font-bold">{h.soft}</span></div>
          </div>
        </div>
        <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-3 rounded-full ${scoreColor} transition-all duration-500`} style={{ width: `${h.score}%` }} />
        </div>
        <div className="mt-3 flex justify-between items-center text-[11px] text-zinc-500 font-mono">
          <span>Formula: 100 - ((hard + 0.3 · soft) / total × 100)</span>
          <span className={h.score >= 90 ? 'text-emerald-400' : h.score >= 70 ? 'text-amber-400' : 'text-red-400'}>
            {h.score >= 90 ? '● Domain Safe' : h.score >= 70 ? '▲ Warning: Warmup Risk' : '■ Critical: Burned Domain Risk'}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="tw-card p-5">
          <div className="label">Total Ingested Leads</div>
          <div className="font-serif text-3xl mt-1">{h.total}</div>
          <p className="text-xs text-zinc-500 mt-2">Deduplicated per tenant via @@unique(userId, email)</p>
        </div>
        <div className="tw-card p-5 border-l-2 border-l-red-500">
          <div className="label text-red-400">Hard Bounces (Quarantined)</div>
          <div className="font-serif text-3xl mt-1 text-red-400">{h.hard}</div>
          <p className="text-xs text-zinc-500 mt-2">Invalid mailboxes & dead domains automatically suppressed</p>
        </div>
        <div className="tw-card p-5 border-l-2 border-l-amber-500">
          <div className="label text-amber-400">Soft Bounces (Retries)</div>
          <div className="font-serif text-3xl mt-1 text-amber-400">{h.soft}</div>
          <p className="text-xs text-zinc-500 mt-2">Rate limits & full mailboxes; flagged RISKY after 3 failures</p>
        </div>
      </div>

      <div className="tw-card p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="label">Cold-Outbound Risk Breakdown</span>
          <span className="text-xs font-mono text-zinc-400">{riskPct}% rotted leads detected</span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden flex">
          <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${riskPct}%` }} />
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${100 - riskPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-3 font-mono">
          <span className="text-red-400">● {riskPct}% Auto-Suppressed (Burn Prevention)</span>
          <span className="text-emerald-400">● {100 - riskPct}% Safe to Send</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-2">
        <Link href="/webhooks-docs" className="tw-card p-4 hover:bg-white/[0.04] transition group">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-widest text-white group-hover:text-[#c8553d]">
              ⚡ Webhook Simulator →
            </span>
            <span className="text-zinc-500 text-xs font-mono">HMAC-SHA256</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Fire live signed hard/soft bounces and test queue idempotency</p>
        </Link>
        <Link href="/leads" className="tw-card p-4 hover:bg-white/[0.04] transition group">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-widest text-white group-hover:text-[#c8553d]">
              ≡ Lead Autopsy Explorer →
            </span>
            <span className="text-zinc-500 text-xs font-mono">{h.total} leads</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Inspect forensic SMTP diagnostic logs, reason codes, and retry counts</p>
        </Link>
      </div>
    </div>
  )
}
