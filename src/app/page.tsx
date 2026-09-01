import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="label">Lab / Archive — 35mm + ledger</div>
          <h1 className="font-serif text-4xl leading-none mt-2">
            Forensic hygiene for <em className="italic text-[#c8553d]">outbound</em>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-xl">Import CSV → bounce webhook → auto-quarantine → hygiene 0-100. Painkiller for domain burn $10-15 — mini-Zapmail for Outbox Labs.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/import" className="bg-white text-black px-5 py-2.5 uppercase text-xs tracking-widest">
            Import CSV
          </Link>
          <Link href="/dashboard" className="border border-white/20 px-5 py-2.5 uppercase text-xs tracking-widest">
            View Hygiene
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="tw-card p-5">
          <div className="label">Total leads</div>
          <div className="font-serif text-3xl mt-2">1,247</div>
          <div className="meter mt-3">
            <span style={{ width: '100%' }} />
          </div>
          <div className="text-xs text-zinc-500 mt-2">@unique([userId,email]) — no leading %</div>
        </div>
        <div className="tw-card p-5">
          <div className="label">Hygiene score</div>
          <div className="font-serif text-3xl mt-2">
            87<span className="text-sm text-zinc-500"> /100</span>
          </div>
          <div className="meter mt-3">
            <span style={{ width: '87%' }} className="!bg-green-500" />
          </div>
          <div className="text-xs text-zinc-500 mt-2">hard + 0.3·soft — RISKY after 3 softs</div>
        </div>
        <div className="tw-card p-5">
          <div className="label">Live backend</div>
          <div className="font-mono text-sm mt-2">POST /webhooks/bounce</div>
          <div className="text-xs text-zinc-500 mt-1">HMAC + eventId @unique → SKIP LOCKED worker</div>
          <Link href="/webhooks-docs" className="inline-flex mt-3 text-xs uppercase tracking-widest border-b border-[#c8553d] pb-1">
            Curl docs →
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="tw-card p-5">
          <div className="label">Separate features — not one dashboard</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Link href="/import" className="border border-white/10 p-3 hover:bg-white/5">
              /import — CSV dropzone
            </Link>
            <Link href="/leads" className="border border-white/10 p-3 hover:bg-white/5">
              /leads — forensic table
            </Link>
            <Link href="/dashboard" className="border border-white/10 p-3 hover:bg-white/5">
              /dashboard — meter + autopsy
            </Link>
            <Link href="/webhooks-docs" className="border border-white/10 p-3 hover:bg-white/5">
              /webhooks-docs — HMAC curl
            </Link>
          </div>
        </div>
        <div className="tw-card p-5">
          <div className="label">Stack — different UI types</div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="tw-badge">Table — forensic leads</span>
            <span className="tw-badge">Card — hygiene</span>
            <span className="tw-badge">Meter — score</span>
            <span className="tw-badge">Stamp — BOUNCED</span>
            <span className="tw-badge">Mono — 550 5.1.1</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500">Different UI types/styles per feature — not bland dashboard.</p>
        </div>
      </div>
    </div>
  )
}
