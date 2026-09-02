'use client'
import { useEffect, useState } from 'react'
import { getApiBase } from '@/lib/api'

export default function HealthBar() {
  const [status, setStatus] = useState<{ db: string; leads?: number } | null>(null)
  const [ok, setOk] = useState<boolean | null>(null)
  const base = getApiBase()

  useEffect(() => {
    fetch(`${base.replace(/\/api\/?$/, '')}/health/ready`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        setOk(ok)
        setStatus(j)
      })
      .catch(() => setOk(false))
  }, [base])

  if (ok === null) return null
  const isLive = ok && status?.db === 'ok'
  return (
    <div className="w-full border-b border-white/10 bg-[#0b0b0c] text-zinc-400 px-6 py-2 flex gap-4 text-xs">
      <span className={`inline-flex items-center gap-1.5 ${isLive ? 'text-green-400' : 'text-red-400'}`}>
        <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        {isLive ? 'LIVE' : 'OFFLINE'}
      </span>
      <span className="text-zinc-600 hidden md:inline">{base}</span>
      {status && <span className="text-zinc-500">db: {status.db} {status.leads !== undefined && `· ${status.leads} leads`}</span>}
    </div>
  )
}
