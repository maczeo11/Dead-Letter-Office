'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getApiBase, request } from '@/lib/api'

type Bounce = { id: string; type: string; reason?: string; eventId: string; createdAt: string }
type Lead = { id: string; email: string; status: string; softCount: number; reason?: string; createdAt: string; bounces: Bounce[] }

export default function LeadAutopsy() {
  const { id } = useParams<{ id: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !id) return
    request<Lead>(`/leads/${id}`, { token })
      .then(setLead)
      .catch(e => setErr((e as Error).message))
  }, [id])

  if (err) return <div className="max-w-2xl mx-auto px-6 py-12"><p className="text-red-400">⚠️ {err}</p></div>
  if (!lead) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 animate-pulse space-y-6">
        <div className="h-3 bg-white/10 rounded w-28" />
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded w-24" />
            <div className="h-7 bg-white/10 rounded w-64" />
          </div>
          <div className="h-6 bg-white/10 rounded w-20" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="tw-card p-4 space-y-2">
            <div className="h-3 bg-white/10 rounded w-20" />
            <div className="h-6 bg-white/10 rounded w-12" />
          </div>
          <div className="tw-card p-4 space-y-2">
            <div className="h-3 bg-white/10 rounded w-20" />
            <div className="h-6 bg-white/10 rounded w-28" />
          </div>
          <div className="tw-card p-4 space-y-2">
            <div className="h-3 bg-white/10 rounded w-20" />
            <div className="h-6 bg-white/10 rounded w-24" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href="/leads" className="label hover:text-white">← Back to leads</Link>
      </div>

      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="label">Autopsy report</div>
          <h1 className="font-mono text-2xl mt-1">{lead.email}</h1>
        </div>
        <span className={`tw-badge text-sm px-3 py-1 ${lead.status === 'BOUNCED' ? 'border-red-500 text-red-400 rotate-2' : lead.status === 'RISKY' ? 'border-amber-500 text-amber-400 rotate-1' : 'border-green-500 text-green-400'}`}>
          {lead.status}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="tw-card p-4">
          <div className="label">Soft bounces</div>
          <div className="font-serif text-2xl mt-1">{lead.softCount}</div>
          <div className="text-xs text-zinc-500 mt-1">retry limit 3 → RISKY</div>
        </div>
        <div className="tw-card p-4">
          <div className="label">Last reason</div>
          <div className="font-mono text-xs mt-1 text-zinc-300 break-all">{lead.reason || '—'}</div>
        </div>
        <div className="tw-card p-4">
          <div className="label">Imported</div>
          <div className="text-sm mt-1">{new Date(lead.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="mt-6 tw-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <span className="label">Bounce events ({lead.bounces.length})</span>
        </div>
        {lead.bounces.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">No bounce events — this lead is clean</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left px-5 py-2">Type</th>
                  <th className="text-left px-5 py-2">Reason</th>
                  <th className="text-left px-5 py-2">Event ID</th>
                  <th className="text-left px-5 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {lead.bounces.map(b => (
                  <tr key={b.id} className="border-t border-white/10">
                    <td className="px-5 py-3">
                      <span className={`tw-badge ${b.type === 'hard' ? 'border-red-500 text-red-400' : 'border-amber-500 text-amber-400'}`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-300">{b.reason || '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500">{b.eventId}</td>
                    <td className="px-5 py-3 text-xs text-zinc-500">{new Date(b.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
