'use client'
import { useEffect, useState } from 'react'
import { getApiBase } from '@/lib/api'

export default function HealthBar() {
  const [ready, setReady] = useState<{ mysql: string; score?: number } | null>(null)
  const [ok, setOk] = useState<boolean | null>(null)
  const base = getApiBase()

  useEffect(() => {
    fetch(`${base.replace('/api', '')}/health/ready`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        setOk(ok)
        setReady(j)
      })
      .catch(() => setOk(false))
  }, [base])

  if (ok === null) return null
  const isLive = ok && ready?.mysql === 'ok'
  return (
    <div className="w-full border-b border-zinc-800 bg-zinc-900 text-zinc-400 px-6 py-2 flex gap-4 text-xs">
      <span className={`inline-flex items-center gap-1.5 ${isLive ? 'text-green-400' : 'text-red-400'}`}>
        <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        {isLive ? 'LIVE backend' : 'OFFLINE — backend not reachable'}
      </span>
      <span className="text-zinc-500 hidden md:inline">→ {base}</span>
      {ready && <span className="text-zinc-500">mysql: {ready.mysql} {ready.score !== undefined && `· score ${ready.score}`}</span>}
      {!isLive && <span className="text-red-300">Check: npm run dev:server or set NEXT_PUBLIC_API_BASE</span>}
    </div>
  )
}
