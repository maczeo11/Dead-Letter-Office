// Live backend only — relative /api or custom NEXT_PUBLIC_API_BASE
export const getApiBase = (): string => {
  let raw = process.env.NEXT_PUBLIC_API_BASE || '/api'
  // If the old dead Railway URL is baked into Vercel env, fallback to /api (proxied via vercel.json to EC2)
  if (raw.includes('railway.app')) {
    raw = '/api'
  }
  const trimmed = raw.replace(/\/+$/, '')
  // If full http(s) origin was provided without /api path, append /api
  if (trimmed.startsWith('http') && !trimmed.endsWith('/api')) {
    return `${trimmed}/api`
  }
  return trimmed
}

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
