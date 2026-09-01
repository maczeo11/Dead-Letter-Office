'use client'
import { useEffect, useState } from 'react'
import { getApiBase } from '@/lib/api'

export default function Dashboard() {
  const [h, setH] = useState<{ total: number; hard: number; soft: number; score: number } | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    fetch(`${getApiBase()}/hygiene`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j.error?.message)
        setH(j)
      })
      .catch(e => setErr((e as Error).message))
  }, [])

  if (err) return <p className="p-6 text-red-400">{err}</p>
  if (!h) return <p className="p-6">Loading hygiene…</p>

  const color = h.score > 90 ? 'bg-green-500' : h.score > 70 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="font-serif text-3xl mb-4">Hygiene</h1>
      <div className="bg-white/[0.04] border border-white/10 rounded-lg p-6">
        <div className="flex justify-between text-xs uppercase tracking-widest">
          <span>Total {h.total}</span>
          <span>Hard {h.hard}</span>
          <span>Soft {h.soft}</span>
          <span className="font-bold">Score {h.score}</span>
        </div>
        <div className="mt-4 h-2 bg-white/10 rounded">
          <div className={`h-2 rounded ${color}`} style={{ width: `${h.score}%` }} />
        </div>
        <p className="mt-3 text-xs text-zinc-500">Weighted `hard + 0.3·soft` — RISKY after 3 softs. `score = 100 - ((hard+0.3*soft)/total*100)`</p>
      </div>
    </div>
  )
}
