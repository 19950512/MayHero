'use client'

import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { RARITY_COLORS } from '../game/data'
import { api } from '../lib/api'
import type { Equipment } from '../game/types'

const SLOT_LABELS: Record<Equipment['slot'], string> = {
  weapon: 'Arma',
  armor: 'Armadura',
  helm: 'Elmo',
  ring: 'Anel',
}

interface ListingForm {
  index: number
  price: string
  loading: boolean
  error: string | null
  success: boolean
}

export function Inventory() {
  const { inventory, hero, equipItemFromInventory, currentZone } = useGameStore()
  const { user } = useAuthStore()
  const [form, setForm] = useState<ListingForm | null>(null)

  if (!hero) return null

  const handleStartList = (index: number) => {
    setForm({ index, price: '', loading: false, error: null, success: false })
  }

  const handleCancel = () => setForm(null)

  const handleSubmitList = async (item: Equipment) => {
    if (!form || !hero || !user) return
    const price = parseInt(form.price, 10)
    if (isNaN(price) || price < 1) {
      setForm(f => f ? { ...f, error: 'Preço deve ser ≥ 1.' } : null)
      return
    }

    setForm(f => f ? { ...f, loading: true, error: null } : null)

    try {
      // Ensure hero is synced to DB so inventory items have IDs
      const syncData = {
        level: hero.level, xp: hero.xp, xpToNext: hero.xpToNext,
        gold: hero.gold, totalKills: hero.totalKills, skillPoints: hero.skillPoints,
        currentZone, stats: hero.stats, baseStats: hero.baseStats,
        equipment: hero.equipment, inventory,
      }
      try {
        await api.hero.sync(syncData as Record<string, unknown>)
      } catch (e) {
        const msg = e instanceof Error ? e.message : ''
        if (msg.includes('não encontrado')) {
          await api.hero.create({ name: hero.name, class: hero.class, stats: hero.stats, baseStats: hero.baseStats })
          await api.hero.sync(syncData as Record<string, unknown>)
        } else throw e
      }

      // Fetch DB inventory to get item IDs
      const dbItems = await api.hero.inventory()
      const dbItem = dbItems.find(di =>
        di.itemData.id === item.id &&
        di.itemData.slot === item.slot &&
        di.itemData.rarity === item.rarity
      )
      if (!dbItem) throw new Error('Item não encontrado no servidor. Sincronize e tente novamente.')

      await api.shop.listItem(dbItem.id, price)
      setForm(f => f ? { ...f, loading: false, success: true } : null)
      setTimeout(() => setForm(null), 2000)
    } catch (e) {
      setForm(f => f ? { ...f, loading: false, error: e instanceof Error ? e.message : 'Erro ao listar.' } : null)
    }
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto">
      <p className="text-white/40 text-xs uppercase font-bold">Inventário ({inventory.length})</p>
      {inventory.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/20 text-sm text-center">
            Nenhum item ainda.<br />
            Derrote inimigos para obter drops!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {inventory.map((item, idx) => {
            const canEquip = hero.level >= item.requiredLevel
            const bonusText = Object.entries(item.bonuses)
              .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
              .join(', ')
            const isListingThis = form?.index === idx

            return (
              <div
                key={`${item.id}-${idx}`}
                className="bg-slate-800/60 rounded-lg border border-white/5 overflow-hidden"
              >
                <div className="p-2.5 flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-bold ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
                      <span className="text-white/20 text-xs">•</span>
                      <span className="text-white/30 text-xs">{SLOT_LABELS[item.slot]}</span>
                    </div>
                    <p className="text-white/40 text-xs truncate">{bonusText}</p>
                    {item.requiredLevel > 1 && (
                      <p className={`text-xs ${canEquip ? 'text-white/20' : 'text-red-400/60'}`}>
                        Nível {item.requiredLevel}+
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => equipItemFromInventory(item)}
                      disabled={!canEquip}
                      className="px-2.5 py-1.5 rounded-md text-xs font-bold bg-indigo-700 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                    >
                      Equipar
                    </button>
                    {user && !isListingThis && (
                      <button
                        onClick={() => handleStartList(idx)}
                        className="px-2.5 py-1.5 rounded-md text-xs font-bold bg-yellow-700/80 hover:bg-yellow-600 text-white transition-colors"
                      >
                        Vender
                      </button>
                    )}
                    {isListingThis && !form?.success && (
                      <button
                        onClick={handleCancel}
                        className="px-2 py-1.5 rounded-md text-xs text-white/40 hover:text-white/70 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline listing form */}
                {isListingThis && (
                  <div className="px-2.5 pb-2.5 border-t border-white/5 pt-2">
                    {form.success ? (
                      <p className="text-green-400 text-xs text-center font-bold">✓ Listado no mercado!</p>
                    ) : (
                      <>
                        {form.error && (
                          <p className="text-red-400 text-xs mb-1.5">{form.error}</p>
                        )}
                        <div className="flex gap-2 items-center">
                          <span className="text-yellow-400 text-xs">🪙</span>
                          <input
                            type="number"
                            min={1}
                            placeholder="Preço em ouro"
                            value={form.price}
                            onChange={e => setForm(f => f ? { ...f, price: e.target.value, error: null } : null)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-md px-2 py-1 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-500/50"
                          />
                          <button
                            onClick={() => handleSubmitList(item)}
                            disabled={form.loading}
                            className="px-3 py-1 rounded-md text-xs font-bold bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white transition-colors"
                          >
                            {form.loading ? '...' : 'Listar'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
