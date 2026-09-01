'use client'
import { useEffect, useState } from 'react'
import { getApiBase } from '@/lib/api'

type Hygiene = { total: number; hard: number; soft: number; score: number }

export default function Dashboard() {
  const [h, setH] = useState<Hygiene | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setErr('No token — login first'); return }
    fetch(`${getApiBase()}/hygiene`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => { if (!ok) throw new Error(j.error?.message); setH(j) })
      .catch(e => setErr((e as Error).message))
  }, [])

  if (err) return <div className="max-w-xl mx-auto px-6 py-8"><p className="text-red-400 text-sm">{err}</p></div>
  if (!h) return <div className="max-w-xl mx-auto px-6 py-8"><p className="text-zinc-500">Loading…</p></div>

  const scoreColor = h.score > 90 ? 'bg-green-500' : h.score > 70 ? 'bg-amber-500' : 'bg-red-500'
  const riskPct = h.total > 0 ? Math.round(((h.hard + h.soft) / h.total) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="label">Hygiene</div>
      <h1 className="font-serif text-3xl mt-1 mb-6">Bounce score</h1>

      <div className="tw-card p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-serif text-6xl">{h.score}</div>
            <div className="text-zinc-500 text-sm mt-1">/ 100</div>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <div>hard: {h.hard}</div>
            <div>soft: {h.soft}</div>
            <div>total: {h.total}</div>
          </div>
        </div>
        <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-3 rounded-full ${scoreColor} transition-all`} style={{ width: `${h.score}%` }} />
        </div>
        <p className="mt-3 text-xs text-zinc-500">`score = 100 - ((hard + 0.3·soft) / total × 100)`</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="tw-card p-5">
          <div className="label">Total leads</div>
          <div className="font-serif text-2xl mt-1">{h.total}</div>
        </div>
        <div className="tw-card p-5">
          <div className="label">Hard bounces</div>
          <div className="font-serif text-2xl mt-1 text-red-400">{h.hard}</div>
          <div className="text-xs text-zinc-500 mt-1">quarantined — auto-suppressed</div>
        </div>
        <div className="tw-card p-5">
          <div className="label">Soft bounces</div>
          <div className="font-serif text-2xl mt-1 text-amber-400">{h.soft}</div>
          <div className="text-xs text-zinc-500 mt-1">3+ → RISKY status</div>
        </div>
      </div>

      <div className="mt-4 tw-card p-5">
        <div className="label">Risk breakdown</div>
        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden flex">
          <div className="h-2 bg-red-500 transition-all" style={{ width: `${riskPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-2">
          <span>{riskPct}% risk</span>
          <span>{100 - riskPct}% clean</span>
        </div>
      </div>
    </div>
  )
}
