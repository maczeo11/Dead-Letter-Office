'use client'
import { useEffect, useState } from 'react'
import { getApiBase } from '@/lib/api'

type Lead = { id: string; email: string; status: string; softCount: number; reason?: string }

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    fetch(`${getApiBase()}/leads?status=BOUNCED&page=1`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j.error?.message || 'failed')
        setLeads(j.leads || [])
      })
      .catch(e => setErr((e as Error).message))
  }, [])

  if (err) return <p className="p-6 text-red-400">Live backend not reachable: {err} — no fake data.</p>

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="font-serif text-3xl mb-4">Forensic table</h1>
      <p className="text-xs text-zinc-500 mb-4">email | BOUNCED stamp | reason mono `550 5.1.1` | softCount — uses `@@index([userId,status])` prefix search, no leading %.</p>
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-widest">
            <tr>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id} className="border-t border-white/10">
                <td className="px-4 py-2 font-serif">{l.email}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 text-xs border ${l.status === 'BOUNCED' ? 'border-red-500 text-red-400 rotate-1' : l.status === 'RISKY' ? 'border-amber-500 text-amber-400' : 'border-white/20'}`}>{l.status}</span>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-zinc-400">{l.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
