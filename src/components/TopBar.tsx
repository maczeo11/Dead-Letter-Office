'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const crumbs: Record<string, string> = {
  '/': 'Overview',
  '/dashboard': 'Hygiene',
  '/import': 'Import',
  '/leads': 'Leads',
  '/webhooks-docs': 'Webhooks',
}

export default function TopBar() {
  const path = usePathname()
  return (
    <div className="h-11 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-[#0b0b0c]/90 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3 text-xs">
        <span className="label hidden md:inline">Dead Letter Office</span>
        <span className="text-white/20 hidden md:inline">/</span>
        <span className="uppercase tracking-widest text-white">{crumbs[path] ?? 'Lab'}</span>
        <span className="ml-2 hidden lg:inline-flex tw-badge border-white/20 text-white/60">TS + Tailwind • React 19</span>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/import" className="hidden md:inline-flex bg-white text-black px-3 py-1.5 uppercase text-[11px] tracking-widest">
          Import CSV
        </Link>
        <span className="h-6 w-px bg-white/10 hidden md:block" />
        <span className="h-6 w-6 rounded-full bg-white/10 grid place-items-center text-[10px]">BT</span>
      </div>
    </div>
  )
}
