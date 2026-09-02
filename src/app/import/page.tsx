'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getApiBase } from '@/lib/api'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem('token'))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return setErr('Please login or register first before importing leads.')
    if (!file) return setErr('Please choose a CSV file with header "email"')
    
    const fd = new FormData()
    fd.append('file', file)
    setErr(null)
    setMsg(null)
    setLoading(true)

    try {
      const res = await fetch(`${getApiBase()}/leads/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error?.message || 'Import failed')
      setMsg(`Successfully imported ${j.imported} leads (${j.skipped} duplicate skipped).`)
      setFile(null)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadSampleLeads() {
    if (!token) return setErr('Please login or register first before importing leads.')
    setErr(null)
    setMsg(null)
    setLoading(true)
    try {
      // 50 sample leads directly
      const sampleCsv = `email\n` + [
        'sarah.connor@cyberdyne.io', 'john.doe@acmecorp.com', 'alex.smith@fintechlabs.co',
        'elena.rostova@cloudscale.net', 'marcus.vance@outboundflow.ai', 'priya.sharma@datacore.in',
        'david.kim@hypergrowth.tech', 'clara.oswald@tardis.org', 'bruce.wayne@wayneenterprises.com',
        'clark.kent@dailyplanet.com', 'diana.prince@themiscira.gov', 'barry.allen@star-labs.com',
        'hal.jordan@ferrisair.com', 'arthur.curry@atlantis-deep.org', 'victor.stone@titans.net',
        'peter.parker@dailybugle.nyc', 'tony.stark@starkindustries.com', 'steve.rogers@shield.gov',
        'natasha.romanoff@redroom.org', 'bruce.banner@gamma-labs.edu', 'thor.odinson@asgard.realm',
        'loki.laufeyson@mischief.io', 'wanda.maximoff@westview.net', 'vision.synthezoid@avengers.org',
        'sam.wilson@airforce.mil', 'bucky.barnes@howling.org', 'james.rhodes@war-machine.mil',
        'stephen.strange@kamar-taj.org', 'wong.librarian@sanctum.org', 'carol.danvers@starforce.space',
        'nick.fury@eyepatch.gov', 'maria.hill@shield-ops.net', 'phil.coulson@tahiti.org',
        'melinda.may@cavalry.org', 'daisy.johnson@quake.net', 'leo.fitz@sci-ops.edu',
        'jemma.simmons@biochem.edu', 'alphonso.mack@garage.net', 'yo-yo.rodriguez@slingshot.org',
        'matthew.murdock@nelsonmurdock.law', 'foggy.nelson@nelsonmurdock.law', 'karen.page@bulletin.nyc',
        'frank.castle@punisher.mil', 'jessica.jones@alias-investigations.com', 'luke.cage@harlem-heroes.org',
        'danny.rand@randcorp.com', 'colleen.wing@chikara-dojo.org', 'misty.knight@nypd.gov',
        'elektra.natchios@thehand.org', 'wilson.fisk@hellskitchen.corp'
      ].join('\n')

      const blob = new Blob([sampleCsv], { type: 'text/csv' })
      const sampleFile = new File([blob], 'sample-50-leads.csv', { type: 'text/csv' })
      const fd = new FormData()
      fd.append('file', sampleFile)

      const res = await fetch(`${getApiBase()}/leads/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error?.message || 'Sample import failed')
      setMsg(`⚡ Loaded 50 sample leads! (${j.imported} new, ${j.skipped} deduplicated).`)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl">Import Leads</h1>
          <p className="text-xs text-zinc-400 mt-1">Upload CSV or load sample list for list hygiene testing</p>
        </div>
        <Link href="/leads" className="text-xs uppercase tracking-widest border border-white/20 px-3 py-1.5 hover:bg-white/10 transition">
          View Leads →
        </Link>
      </div>

      {!token ? (
        <div className="tw-card p-6 text-center space-y-3">
          <p className="text-sm text-zinc-300">Authentication Required</p>
          <p className="text-xs text-zinc-500">You must be logged in to import and manage outbound lead lists.</p>
          <Link href="/auth" className="inline-block bg-white text-black font-bold py-2 px-6 uppercase text-xs tracking-widest hover:bg-zinc-200 transition">
            Go to Login / 1-Click Demo →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={submit} className="space-y-4 bg-white/[0.04] border border-white/10 rounded-lg p-6">
            <div>
              <label className="label mb-2 block">Upload CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:uppercase file:tracking-widest file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
              />
            </div>
            
            <p className="text-xs text-zinc-500">
              CSV header must include <code>email</code>. Chunks of 500 with deduplication via <code>@@unique(userId, email)</code>.
            </p>

            {err && (
              <div className="p-3 bg-red-950/50 border border-red-500/50 rounded text-xs text-red-300">
                ⚠️ {err}
              </div>
            )}
            
            {msg && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded text-xs text-emerald-300 flex items-center justify-between">
                <span>✓ {msg}</span>
                <Link href="/leads" className="underline font-bold ml-2">Browse Leads →</Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-white text-black py-2.5 uppercase text-xs tracking-widest font-bold disabled:opacity-40 hover:bg-zinc-200 transition"
            >
              {loading ? 'Uploading & Processing...' : 'Upload CSV'}
            </button>
          </form>

          <div className="tw-card p-5 text-center border-dashed border-white/20">
            <p className="text-xs text-zinc-400 mb-3">Don't have a CSV handy? Test with pre-built dataset:</p>
            <button
              type="button"
              onClick={loadSampleLeads}
              disabled={loading}
              className="border border-[#c8553d]/50 text-[#c8553d] hover:bg-[#c8553d]/10 py-2 px-4 text-xs uppercase tracking-widest transition"
            >
              ⚡ 1-Click Load 50 Sample Leads
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
