import Link from 'next/link'
import HealthBar from '@/components/HealthBar'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#ece9e4]">
      <HealthBar />
      <header className="border-b border-white/10 px-6 py-4 flex justify-between">
        <h1 className="font-serif text-xl">
          Dead Letter <span className="italic text-[#c8553d]">Office</span>
        </h1>
        <nav className="flex gap-4 text-xs uppercase tracking-widest">
          <Link href="/import" className="hover:text-white">
            Import
          </Link>
          <Link href="/leads" className="hover:text-white">
            Leads
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="font-serif text-4xl leading-tight">
          Films looking
          <br />
          for their <em className="italic text-[#c8553d]">backers</em> — now for email
        </h2>
        <p className="mt-4 text-zinc-400 max-w-xl">
          Import CSV → bounce webhook → auto-quarantine → hygiene score 0-100. Painkiller for domain burn $10-15.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Link href="/import" className="bg-white text-black px-6 py-3 uppercase text-xs tracking-widest text-center">
            Import CSV
          </Link>
          <Link href="/dashboard" className="border border-white/20 px-6 py-3 uppercase text-xs tracking-widest text-center">
            View Hygiene
          </Link>
          <Link href="/webhooks-docs" className="border border-white/20 px-6 py-3 uppercase text-xs tracking-widest text-center">
            Webhook Docs
          </Link>
        </div>
        <p className="mt-8 text-xs text-zinc-500">Next.js 14 + TypeScript + Tailwind + Node TS + MySQL Prisma + REST + Docker — forensic lab ink/kraft/Courier</p>
      </main>
    </div>
  )
}
