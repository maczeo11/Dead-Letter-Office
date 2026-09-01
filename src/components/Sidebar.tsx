'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'Overview', icon: '◧' },
  { href: '/dashboard', label: 'Hygiene', icon: '◈' },
  { href: '/import', label: 'Import', icon: '↥' },
  { href: '/leads', label: 'Leads', icon: '≡' },
  { href: '/webhooks-docs', label: 'Webhooks', icon: '↯' },
]

export default function Sidebar() {
  const path = usePathname()
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
        <div className="tw-card p-3">
          <div className="label">Lab / Archive</div>
          <div className="mt-1 text-xs text-zinc-400">Forensic • 35mm + ledger • not AI slop</div>
          <div className="mt-2 text-[11px] text-zinc-500">Next TS + Tailwind + MySQL Prisma</div>
        </div>
      </div>
    </aside>
  )
}
