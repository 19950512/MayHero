'use client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3070'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('mayhero_token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
  return data as T
}

export const api = {
  auth: {
    register: (username: string, email: string, password: string) =>
      req<{ token: string; user: { id: string; username: string; email: string } }>(
        'POST', '/auth/register', { username, email, password }
      ),
    login: (email: string, password: string) =>
      req<{ token: string; user: { id: string; username: string; email: string } }>(
        'POST', '/auth/login', { email, password }
      ),
    me: () => req<{ id: string; username: string; email: string } | null>('GET', '/auth/me'),
  },

  hero: {
    get: () => req<Record<string, unknown>>('GET', '/hero'),
    inventory: () => req<Array<{ id: string; itemData: Record<string, unknown> }>>('GET', '/hero/inventory'),
    create: (data: { name: string; class: string; stats: unknown; baseStats: unknown }) =>
      req<Record<string, unknown>>('POST', '/hero', data),
    sync: (data: Record<string, unknown>) => req<{ ok: boolean }>('PATCH', '/hero/sync', data),
    rename: (name: string) => req<{ ok: boolean; name: string }>('PATCH', '/hero/rename', { name }),
  },

  rankings: {
    byLevel: () => req<{ rankings: unknown[] }>('GET', '/rankings'),
    byKills: () => req<{ rankings: unknown[] }>('GET', '/rankings/kills'),
  },

  shop: {
    list: (page = 1) => req<{ listings: unknown[]; total: number; pages: number }>('GET', `/shop?page=${page}`),
    listItem: (inventoryItemId: string, price: number) =>
      req<unknown>('POST', '/shop/list', { inventoryItemId, price }),
    buy: (id: string) => req<{ ok: boolean; item: unknown }>('POST', `/shop/buy/${id}`),
    removeListing: (id: string) => req<{ ok: boolean }>('DELETE', `/shop/listing/${id}`),
    myListings: () => req<unknown[]>('GET', '/shop/my'),
  },
}

export function saveToken(token: string) {
  localStorage.setItem('mayhero_token', token)
}

export function clearToken() {
  localStorage.removeItem('mayhero_token')
}
