'use client'
import { useState } from 'react'
import { getApiBase } from '@/lib/api'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setErr('Choose CSV with header email')
    const token = localStorage.getItem('token') || ''
    const fd = new FormData()
    fd.append('file', file)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch(`${getApiBase()}/leads/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error?.message || 'import failed')
      setMsg(`Imported ${j.imported}, skipped ${j.skipped} (chunk 500, lowercase/trim, skipDuplicates)`)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="font-serif text-3xl mb-6">Import leads</h1>
      <form onSubmit={submit} className="space-y-4 bg-white/[0.04] border border-white/10 rounded-lg p-6">
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
        <p className="text-xs text-zinc-500">CSV header must be `email` — `email.trim().toLowerCase()` + `createMany skipDuplicates` chunk 500, bumps `HygieneScore.total`.</p>
        {err && <p className="text-sm text-red-400">{err}</p>}
        {msg && <p className="text-sm text-green-400">{msg}</p>}
        <button type="submit" className="w-full bg-white text-black py-2 uppercase text-xs tracking-widest">
          Upload
        </button>
      </form>
    </div>
  )
}
