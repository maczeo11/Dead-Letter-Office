'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const crumbs: Record<string, string> = {
  '/': 'Overview',
  '/dashboard': 'Hygiene',
  '/import': 'Import',
  '/leads': 'Leads',
  '/leads/[id]': 'Autopsy',
  '/webhooks-docs': 'Webhooks',
  '/auth': 'Login',
}

export default function TopBar() {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    const syncUser = () => {
      const raw = localStorage.getItem('user')
      setUser(raw ? JSON.parse(raw) : null)
    }
    syncUser()
    window.addEventListener('auth-change', syncUser)
    window.addEventListener('storage', syncUser)
    return () => {
      window.removeEventListener('auth-change', syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [path])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.dispatchEvent(new Event('auth-change'))
    router.push('/auth')
  }

  return (
    <div className="h-11 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-[#0b0b0c]/90 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3 text-xs">
        <span className="label hidden md:inline">Dead Letter Office</span>
        <span className="text-white/20 hidden md:inline">/</span>
        <span className="uppercase tracking-widest text-white">{crumbs[path] ?? 'Lab'}</span>
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link href="/import" className="hidden md:inline-flex bg-white text-black px-3 py-1.5 uppercase text-[11px] tracking-widest">
              Import CSV
            </Link>
            <span className="h-6 w-px bg-white/10 hidden md:block" />
            <span className="h-6 w-6 rounded-full bg-white/10 grid place-items-center text-[10px] font-mono">
              {user.email.charAt(0).toUpperCase()}
            </span>
            <button onClick={logout} className="text-[11px] uppercase tracking-widest text-zinc-500 hover:text-white">
              Logout
            </button>
          </>
        ) : (
          <Link href="/auth" className="bg-white text-black px-3 py-1.5 uppercase text-[11px] tracking-widest">
            Login
          </Link>
        )}
      </div>
    </div>
  )
}
