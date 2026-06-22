'use client'

import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { RARITY_COLORS, ITEM_BY_ID, DUNGEON_BY_ID } from '../game/data'
import { api } from '../lib/api'
import { getItemDisplayName } from '../game/enhancement'
import { ItemDetailModal } from './ItemDetailModal'
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
  const { inventory, hero, equipItemFromInventory, currentDungeon, stackableInventory } = useGameStore()
  const currentZoneId = DUNGEON_BY_ID[currentDungeon]?.zoneId ?? 1
  const { user } = useAuthStore()
  const [form, setForm] = useState<ListingForm | null>(null)
  const [search, setSearch] = useState('')
  const [detailItem, setDetailItem] = useState<Equipment | null>(null)

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
      const syncData = {
        name: hero.name,
        class: hero.class,
        level: hero.level, xp: hero.xp, xpToNext: hero.xpToNext,
        gold: hero.gold, totalKills: hero.totalKills, skillPoints: hero.skillPoints,
        currentZone: currentZoneId, stats: hero.stats, baseStats: hero.baseStats,
        equipment: hero.equipment, loadout: hero.loadout, inventory,
        stackableInventory,
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

  const filteredInventory = search.trim()
    ? inventory.filter(item =>
        getItemDisplayName(item).toLowerCase().includes(search.toLowerCase()) ||
        SLOT_LABELS[item.slot].toLowerCase().includes(search.toLowerCase())
      )
    : inventory

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto">
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEquip={() => equipItemFromInventory(detailItem)}
          canEquip={hero.level >= detailItem.requiredLevel}
        />
      )}

      <p className="text-white/40 text-xs uppercase font-bold">Inventário ({inventory.length})</p>

      {/* Search */}
      {inventory.length > 0 && (
        <input
          type="text"
          placeholder="Buscar item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/25 outline-none focus:border-white/25"
        />
      )}

      {/* Stackable items */}
      {Object.entries(stackableInventory).some(([, qty]) => qty > 0) && (
        <div className="bg-slate-900/40 rounded-lg border border-white/10 p-2.5">
          <p className="text-white/45 text-xs uppercase font-bold mb-2">Consumíveis e Recursos</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stackableInventory)
              .filter(([, qty]) => qty > 0)
              .map(([itemId, qty]) => {
                const item = ITEM_BY_ID[itemId]
                return (
                  <div key={itemId} className="px-2 py-1 rounded-md border border-white/10 bg-black/30 text-xs text-white/80 flex items-center gap-1.5">
                    <span>{item?.icon ?? '•'}</span>
                    <span>{item?.name ?? itemId}</span>
                    <span className="text-amber-300 font-bold">x{qty}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Equipment list */}
      <div className="flex flex-col gap-1.5">
        {inventory.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-white/20 text-sm text-center">
              Nenhum item ainda.<br />
              Derrote inimigos para obter drops!
            </p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <p className="text-white/25 text-xs text-center py-4">Nenhum item encontrado para &quot;{search}&quot;</p>
        ) : (
          filteredInventory.map((item) => {
            const realIdx = inventory.indexOf(item)
            const canEquip = hero.level >= item.requiredLevel
            const enhancement = item.enhancement ?? 0
            const bonusText = Object.entries(item.bonuses)
              .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
              .join(', ')
            const isListingThis = form?.index === realIdx

            return (
              <div
                key={`${item.id}-${realIdx}`}
                className="bg-slate-800/60 rounded-lg border border-white/5 overflow-hidden"
              >
                <div className="p-2.5 flex items-center gap-3">
                  {/* Clickable icon → detail modal */}
                  <button
                    onClick={() => setDetailItem(item)}
                    className="text-xl w-8 text-center shrink-0 hover:scale-125 transition-transform"
                    title="Ver detalhes"
                  >
                    {item.icon}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`text-xs font-bold ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
                      {enhancement > 0 && (
                        <span className={`text-xs font-bold px-1 rounded ${enhancement >= 15 ? 'text-red-400 bg-red-900/20' : enhancement >= 8 ? 'text-amber-400 bg-amber-900/20' : 'text-green-400 bg-green-900/20'}`}>
                          +{enhancement}
                        </span>
                      )}
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
                        onClick={() => handleStartList(realIdx)}
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
                          <span className="text-yellow-400 text-xs">Ouro</span>
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
          })
        )}
      </div>
    </div>
  )
}
