'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../lib/api'
import { RARITY_COLORS } from '../game/data'
import { useAuthStore } from '../store/authStore'

type Listing = {
  id: string
  itemData: {
    name: string
    icon: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    slot: string
    bonuses: Record<string, number>
    requiredLevel: number
  }
  price: number
  createdAt: string
  seller: { name: string; level: number }
}

const SLOT_PT: Record<string, string> = {
  weapon: 'Arma', armor: 'Armadura', helm: 'Elmo', ring: 'Anel',
}

export default function ShopPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const { user, logout } = useAuthStore()

  const load = (p = 1) => {
    setLoading(true)
    api.shop.list(p)
      .then(r => {
        setListings(r.listings as Listing[])
        setTotal(r.total)
        setPages(r.pages)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  const handleBuy = async (id: string) => {
    if (!user) { setMsg({ text: 'Faça login para comprar.', ok: false }); return }
    setBuying(id)
    try {
      await api.shop.buy(id)
      setMsg({ text: 'Item comprado! Sincronize o jogo para ver no inventário.', ok: true })
      load(page)
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro ao comprar.', ok: false })
    } finally {
      setBuying(null)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/80 sticky top-0 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl">⚔️ May Hero</Link>
          <div className="flex gap-3 text-sm items-center">
            <Link href="/rankings" className="text-white/50 hover:text-white">🏆 Rankings</Link>
            {user ? (
              <>
                <Link href="/" className="text-white/50 hover:text-white">⚔️ Jogar</Link>
                <span className="text-white/30">@{user.username}</span>
                <button onClick={logout} className="text-white/30 hover:text-white/60">Sair</button>
              </>
            ) : (
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">🛒 Mercado de Itens</h1>
          <p className="text-white/40 mt-1">{total} itens à venda</p>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-xl text-sm text-center ${msg.ok ? 'bg-green-900/30 text-green-300 border border-green-500/30' : 'bg-red-900/30 text-red-300 border border-red-500/30'}`}>
            {msg.text}
          </div>
        )}

        {loading ? (
          <div className="text-center text-white/30 py-16">Carregando itens...</div>
        ) : listings.length === 0 ? (
          <div className="text-center text-white/20 py-16">
            Nenhum item à venda.<br />
            <span className="text-sm">Jogue para conseguir drops e liste itens!</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {listings.map(listing => {
                const item = listing.itemData
                const bonusText = Object.entries(item.bonuses ?? {})
                  .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
                  .join(', ')

                return (
                  <div key={listing.id} className="bg-slate-900 rounded-xl p-4 border border-white/10 flex gap-3">
                    <div className="text-3xl w-10 text-center shrink-0">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-bold text-sm ${RARITY_COLORS[item.rarity] ?? 'text-white'}`}>{item.name}</p>
                          <p className="text-white/30 text-xs">{SLOT_PT[item.slot] ?? item.slot} • Nível {item.requiredLevel}+</p>
                          <p className="text-white/40 text-xs mt-0.5 truncate">{bonusText}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-yellow-400 font-bold text-sm">🪙 {listing.price}</p>
                          <p className="text-white/20 text-xs">por {listing.seller?.name} Lv{listing.seller?.level}</p>
                        </div>
                        <button
                          onClick={() => handleBuy(listing.id)}
                          disabled={buying === listing.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white transition-colors"
                        >
                          {buying === listing.id ? '...' : 'Comprar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${p === page ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-white/50 hover:bg-slate-700'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
