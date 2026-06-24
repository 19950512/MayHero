'use client'

import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { RARITY_COLORS, ITEM_BY_ID } from '../game/data'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import type { Equipment } from '../game/types'
import { PageHeader } from '../components/PageHeader'
import { ItemDetailModal } from '../components/ItemDetailModal'

type Listing = {
  id: string
  itemData: {
    id: string
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
  const [detailListing, setDetailListing] = useState<Listing | null>(null)
  const { user } = useAuthStore()
  const { addInventoryItem } = useGameStore()

  const toEquipment = (value: unknown): Equipment | null => {
    if (!value || typeof value !== 'object') return null
    const raw = value as Record<string, unknown>

    if (
      typeof raw.id !== 'string' ||
      typeof raw.name !== 'string' ||
      typeof raw.slot !== 'string' ||
      typeof raw.rarity !== 'string' ||
      typeof raw.icon !== 'string' ||
      typeof raw.requiredLevel !== 'number' ||
      !raw.bonuses ||
      typeof raw.bonuses !== 'object'
    ) {
      return null
    }

    const slot = raw.slot
    const rarity = raw.rarity
    if (!['weapon', 'armor', 'helm', 'ring'].includes(slot)) return null
    if (!['common', 'rare', 'epic', 'legendary'].includes(rarity)) return null

    const bonuses = raw.bonuses as Record<string, unknown>
    for (const val of Object.values(bonuses)) {
      if (typeof val !== 'number' || !Number.isFinite(val)) return null
    }

    return {
      id: raw.id,
      name: raw.name,
      slot: slot as Equipment['slot'],
      rarity: rarity as Equipment['rarity'],
      bonuses: bonuses as Equipment['bonuses'],
      icon: raw.icon,
      requiredLevel: raw.requiredLevel,
    }
  }

  const load = (p = 1) => {
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
      const result = await api.shop.buy(id)
      const bought = toEquipment(result.item)
      if (bought) addInventoryItem(bought)
      setMsg({ text: 'Item comprado! Já foi enviado ao seu inventário.', ok: true })
      load(page)
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : 'Erro ao comprar.', ok: false })
    } finally {
      setBuying(null)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,#3b2818_0%,#1d150f_35%,#100d08_70%,#090806_100%)] text-[var(--ink)]">
      <PageHeader />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-[0.08em] text-amber-100">Mercado de Itens</h1>
          <p className="text-amber-100/55 mt-1">{total} itens à venda</p>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-xl text-sm text-center ${msg.ok ? 'bg-green-900/30 text-green-300 border border-green-500/30' : 'bg-red-900/30 text-red-300 border border-red-500/30'}`}>
            {msg.text}
          </div>
        )}

        {detailListing && (() => {
          const eq = toEquipment(detailListing.itemData)
          return eq ? (
            <ItemDetailModal
              item={eq}
              onClose={() => setDetailListing(null)}
            />
          ) : null
        })()}

        {loading ? (
          <div className="text-center text-amber-100/35 py-16">Carregando itens...</div>
        ) : listings.length === 0 ? (
          <div className="text-center text-amber-100/30 py-16">
            Nenhum item à venda.<br />
            <span className="text-sm">Jogue para conseguir drops e liste itens!</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {listings.map(listing => {
                const item = listing.itemData
                const sprite = ITEM_BY_ID[item.id]?.sprite
                const bonusText = Object.entries(item.bonuses ?? {})
                  .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
                  .join(', ')

                return (
                  <div key={listing.id} className="bg-[#18120d] rounded-xl p-4 border border-amber-100/15 flex gap-3">
                    <button
                      onClick={() => setDetailListing(listing)}
                      className="w-14 h-14 rounded-lg border border-white/10 bg-black/30 flex items-center justify-center overflow-hidden shrink-0 hover:border-amber-500/40 transition-colors"
                      title={`Ver detalhes de ${item.name}`}
                    >
                      {sprite
                        ? <img src={sprite} alt={item.name} className="w-full h-full object-contain p-1" />
                        : <span className="text-3xl">{item.icon}</span>
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-bold text-sm ${RARITY_COLORS[item.rarity] ?? 'text-white'}`}>{item.name}</p>
                          <p className="text-amber-100/35 text-xs">{SLOT_PT[item.slot] ?? item.slot} • Nível {item.requiredLevel}+</p>
                          <p className="text-amber-100/45 text-xs mt-0.5 truncate">{bonusText}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-amber-300 font-bold text-sm">Ouro {listing.price}</p>
                          <p className="text-amber-100/30 text-xs">por {listing.seller?.name} Lv{listing.seller?.level}</p>
                        </div>
                        <button
                          onClick={() => handleBuy(listing.id)}
                          disabled={buying === listing.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-50 transition-colors"
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
                    onClick={() => {
                      setLoading(true)
                      setPage(p)
                    }}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${p === page ? 'bg-amber-800 text-amber-50' : 'bg-stone-800 text-amber-100/60 hover:bg-stone-700'}`}
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
