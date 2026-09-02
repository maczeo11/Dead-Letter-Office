'use client'
import { useEffect, useState } from 'react'
import { getApiBase, request } from '@/lib/api'

type Hygiene = { total: number; hard: number; soft: number; score: number }
type Lead = { id: string; email: string; status: string; softCount: number; reason?: string; createdAt: string }

export default function Overview() {
  const [h, setH] = useState<Hygiene | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [token, setToken] = useState<string | null>(null)
  const [auth, setAuth] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('token')
    setToken(t)
    if (!t) return
    setAuth(true)
    request<Hygiene>('/hygiene', { token: t }).then(setH).catch(() => {})
    request<{ leads: Lead[]; total: number }>('/leads?status=ALL&page=1', { token: t })
      .then(j => { setLeads(j.leads); setTotal(j.total) })
      .catch(() => {})
  }, [])

  const bounced = leads.filter(l => l.status === 'BOUNCED').length
  const risky = leads.filter(l => l.status === 'RISKY').length

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="label">Bounce Autopsy Lab</div>
          <h1 className="font-serif text-4xl leading-none mt-2">
            Dead Letter <span className="italic text-[#c8553d]">Office</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-xl">
            Import CSV → webhook bounce → quarantine → hygiene 0-100 → suppress before the next send, so a bad list
            never burns the sending domain.
          </p>
        </div>
      </div>

      {!auth && (
        <div className="mt-8 tw-card p-8 text-center space-y-4 max-w-xl mx-auto border-l-4 border-l-[#c8553d]">
          <h2 className="font-serif text-2xl">Cold-Outbound Deliverability & List Hygiene</h2>
          <p className="text-xs text-zinc-400">
            Outbound marketing lists rot by 15-20% every 6 months. This platform consumes raw webhook bounces, executes
            forensic autopsies, quarantines bad mailboxes, and exports suppression lists so your sending domain never gets burned.
          </p>
          <div className="pt-2">
            <a
              href="/auth"
              className="inline-block bg-white text-black font-bold py-2.5 px-6 uppercase text-xs tracking-widest hover:bg-zinc-200 transition"
            >
              ⚡ 1-Click Demo Login →
            </a>
          </div>
        </div>
      )}

      {auth && (
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <button
            onClick={async () => {
              if (!token) return
              const res = await fetch(`${getApiBase()}/demo/seed`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              })
              const j = await res.json()
              if (j.ok) {
                request<Hygiene>('/hygiene', { token }).then(setH).catch(() => {})
                request<{ leads: Lead[]; total: number }>('/leads?status=ALL&page=1', { token })
                  .then(j => { setLeads(j.leads); setTotal(j.total) })
                  .catch(() => {})
              }
            }}
            className="border border-[#c8553d]/60 text-[#c8553d] hover:bg-[#c8553d]/10 px-3 py-1.5 text-xs uppercase tracking-widest transition"
          >
            ⚡ Seed Forensic Bounces & Autopsies
          </button>
          <a
            href="/import"
            className="border border-white/20 text-zinc-300 hover:text-white hover:bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest transition"
          >
            ↥ Import CSV
          </a>
          <a
            href="/webhooks-docs"
            className="border border-white/20 text-zinc-300 hover:text-white hover:bg-white/5 px-3 py-1.5 text-xs uppercase tracking-widest transition"
          >
            🚀 Webhook Sandbox
          </a>
        </div>
      )}

      {auth && (
        <>
          <div className="grid md:grid-cols-4 gap-4 mt-6">
            <div className="tw-card p-5">
              <div className="label">Total leads</div>
              <div className="font-serif text-3xl mt-2">{total}</div>
              <div className="meter mt-3"><span style={{ width: '100%' }} /></div>
            </div>
            <div className="tw-card p-5">
              <div className="label">Hygiene score</div>
              <div className="font-serif text-3xl mt-2">
                {h?.score ?? '—'}<span className="text-sm text-zinc-500"> /100</span>
              </div>
              <div className="meter mt-3">
                <span style={{ width: `${h?.score ?? 0}%` }} className={h && h.score > 90 ? '!bg-green-500' : h && h.score > 70 ? '!bg-amber-500' : '!bg-red-500'} />
              </div>
              <div className="text-xs text-zinc-500 mt-2">hard + 0.3·soft — RISKY after 3</div>
            </div>
            <div className="tw-card p-5">
              <div className="label">Bounced</div>
              <div className="font-serif text-3xl mt-2 text-red-400">{bounced}</div>
              <div className="text-xs text-zinc-500 mt-2">quarantined — auto-suppress</div>
            </div>
            <div className="tw-card p-5">
              <div className="label">Risky</div>
              <div className="font-serif text-3xl mt-2 text-amber-400">{risky}</div>
              <div className="text-xs text-zinc-500 mt-2">softCount ≥ 3 — retry limit</div>
            </div>
          </div>

          <div className="mt-6 tw-card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center">
              <span className="label">Recent leads</span>
              <a href="/leads" className="text-xs uppercase tracking-widest border-b border-[#c8553d] pb-0.5">
                View all →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-widest">
                  <tr>
                    <th className="text-left px-5 py-2">Email</th>
                    <th className="text-left px-5 py-2">Status</th>
                    <th className="text-left px-5 py-2">Reason</th>
                    <th className="text-left px-5 py-2">Soft</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 5).map(l => (
                    <tr key={l.id} className="border-t border-white/10 hover:bg-white/[0.03]">
                      <td className="px-5 py-3 font-mono text-xs">{l.email}</td>
                      <td className="px-5 py-3">
                        <span className={`tw-badge ${l.status === 'BOUNCED' ? 'border-red-500 text-red-400 rotate-1' : l.status === 'RISKY' ? 'border-amber-500 text-amber-400' : 'border-white/20'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">{l.reason || '—'}</td>
                      <td className="px-5 py-3 text-xs text-zinc-500">{l.softCount}</td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-500">No leads — import CSV or POST /demo/seed</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
