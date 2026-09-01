'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getApiBase } from '@/lib/api'

type Lead = { id: string; email: string; status: string; softCount: number; reason?: string; createdAt: string }

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setErr('No token — login first'); return }
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (filter !== 'ALL') params.set('status', filter)
    if (search) params.set('search', search)
    fetch(`${getApiBase()}/leads?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j.error?.message || 'failed')
        setLeads(j.leads || [])
        setTotal(j.total || 0)
        setErr(null)
      })
      .catch(e => setErr((e as Error).message))
  }, [page, filter, search])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="label">Leads</div>
          <h1 className="font-serif text-3xl mt-1">Forensic table</h1>
        </div>
        <div className="flex gap-2">
          {['ALL', 'VALID', 'BOUNCED', 'RISKY'].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest ${filter === s ? 'bg-white text-black' : 'border border-white/20 text-zinc-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <input type="text" placeholder="search email — e.g. gmail" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full max-w-sm bg-white/[0.04] border border-white/10 px-4 py-2 text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-white/30" />
      </div>

      {err && <p className="mt-4 text-red-400 text-sm">{err}</p>}

      <div className="mt-4 tw-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-widest">
              <tr>
                <th className="text-left px-5 py-2">Email</th>
                <th className="text-left px-5 py-2">Status</th>
                <th className="text-left px-5 py-2">Reason</th>
                <th className="text-left px-5 py-2">Soft</th>
                <th className="text-left px-5 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="border-t border-white/10 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 font-mono text-xs">{l.email}</td>
                  <td className="px-5 py-3">
                    <span className={`tw-badge ${l.status === 'BOUNCED' ? 'border-red-500 text-red-400 rotate-1' : l.status === 'RISKY' ? 'border-amber-500 text-amber-400' : 'border-white/20'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-400 max-w-xs truncate">{l.reason || '—'}</td>
                  <td className="px-5 py-3 text-xs text-zinc-500">{l.softCount}</td>
                  <td className="px-5 py-3">
                    <Link href={`/leads/${l.id}`} className="text-xs uppercase tracking-widest border-b border-[#c8553d] pb-0.5">
                      autopsy
                    </Link>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-500">No leads found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 text-xs text-zinc-500">
            <span>Page {page} of {totalPages} · {total} leads</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-white/10 disabled:opacity-30">← Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-white/10 disabled:opacity-30">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
