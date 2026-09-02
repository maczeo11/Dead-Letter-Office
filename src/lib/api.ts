// Live backend only — relative /api or custom NEXT_PUBLIC_API_BASE
export const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE || '/api'

export async function request<T>(path: string, opts: RequestInit & { token?: string } = {}): Promise<T> {
  const base = getApiBase()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as Record<string, string>) }
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`
  const res = await fetch(base + path, { ...opts, headers, cache: 'no-store' })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error((detail as { error?: { message?: string } } | null)?.error?.message || `${opts.method || 'GET'} ${path} failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export type Hygiene = { total: number; hard: number; soft: number; score: number }
export type Lead = { id: string; email: string; status: string; softCount: number; reason?: string; createdAt: string }
