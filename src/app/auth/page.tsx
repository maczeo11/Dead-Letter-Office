'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiBase } from '@/lib/api'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const res = await fetch(`${getApiBase()}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error?.message || 'failed')
      localStorage.setItem('token', j.token)
      localStorage.setItem('user', JSON.stringify({ id: j.id, email: j.email }))
      router.push('/')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl">
            Dead Letter <span className="italic text-[#c8553d]">Office</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-2 uppercase tracking-widest">Bounce Autopsy Lab</p>
        </div>

        <div className="tw-card p-6">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 text-xs uppercase tracking-widest ${mode === 'login' ? 'bg-white text-black' : 'border border-white/20 text-zinc-400'}`}>
              Login
            </button>
            <button onClick={() => setMode('register')} className={`flex-1 py-2 text-xs uppercase tracking-widest ${mode === 'register' ? 'bg-white text-black' : 'border border-white/20 text-zinc-400'}`}>
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-white/30"
                placeholder="you@lab.dev" />
            </div>
            <div>
              <label className="label mb-1 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-white/30"
                placeholder="min 8 characters" />
            </div>

            {err && <p className="text-red-400 text-xs">{err}</p>}

            <button type="submit" disabled={loading} className="w-full bg-white text-black py-2.5 uppercase text-xs tracking-widest disabled:opacity-50">
              {loading ? '...' : mode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">JWT stored in localStorage → Bearer header</p>
      </div>
    </div>
  )
}
