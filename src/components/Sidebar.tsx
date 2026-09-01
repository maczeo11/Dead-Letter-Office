'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const items = [
  { href: '/', label: 'Overview', icon: '◧' },
  { href: '/dashboard', label: 'Hygiene', icon: '◈' },
  { href: '/import', label: 'Import', icon: '↥' },
  { href: '/leads', label: 'Leads', icon: '≡' },
  { href: '/webhooks-docs', label: 'Webhooks', icon: '↯' },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) setUser(JSON.parse(raw))
  }, [])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/auth')
  }

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-white/10 bg-[#0b0b0c] sticky top-0 h-screen">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="font-serif text-[1.35rem] leading-none">
          Dead Letter <span className="italic text-[#c8553d]">Office</span>
        </div>
        <div className="label mt-1">Bounce Autopsy Lab</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(it => {
          const active = path === it.href
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-widest border-l ${active ? 'bg-white text-black border-white' : 'text-zinc-400 border-transparent hover:bg-white/[0.06] hover:text-white'}`}
            >
              <span className="w-4 text-center">{it.icon}</span>
              {it.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        {user ? (
          <div className="tw-card p-3">
            <div className="text-xs font-mono text-zinc-300 truncate">{user.email}</div>
            <button onClick={logout} className="mt-2 text-[11px] uppercase tracking-widest text-[#c8553d] hover:text-white">
              Logout
            </button>
          </div>
        ) : (
          <Link href="/auth" className="block tw-card p-3 hover:bg-white/[0.06]">
            <div className="label">Not logged in</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-[#c8553d]">Login / Register →</div>
          </Link>
        )}
      </div>
    </aside>
  )
}
