'use client'

import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { ITEM_BY_ID, DUNGEON_BY_ID } from '../game/data'
import { api } from '../lib/api'
import { getItemDisplayName } from '../game/enhancement'
import { ItemDetailModal } from './ItemDetailModal'
import type { Equipment } from '../game/types'

const RARITY_BORDER: Record<Equipment['rarity'], string> = {
  common:    'border-stone-500/50',
  rare:      'border-blue-500/60',
  epic:      'border-purple-500/60',
  legendary: 'border-amber-500/70',
}

interface Props {
  onComposeMail?: (preItem?: Equipment) => void
}

export function Inventory({ onComposeMail }: Props) {
  const { inventory, hero, equipItemFromInventory, replaceInventory, currentDungeon, stackableInventory } = useGameStore()
  const currentZoneId = DUNGEON_BY_ID[currentDungeon]?.zoneId ?? 1
  const { user } = useAuthStore()
  const [detailItem, setDetailItem] = useState<Equipment | null>(null)
  const [sellItem, setSellItem] = useState<Equipment | null>(null)
  const [sellPrice, setSellPrice] = useState('')
  const [sellLoading, setSellLoading] = useState(false)
  const [sellError, setSellError] = useState<string | null>(null)

  if (!hero) return null

  const openDetail = (item: Equipment) => {
    setDetailItem(item)
    setSellItem(null)
    setSellError(null)
    setSellPrice('')
  }

  const handleSell = async (item: Equipment) => {
    if (!hero || !user) return
    const price = parseInt(sellPrice, 10)
    if (isNaN(price) || price < 1) { setSellError('Preço deve ser ≥ 1.'); return }
    setSellLoading(true)
    setSellError(null)
    try {
      const syncData = {
        name: hero.name, class: hero.class,
        level: hero.level, xp: hero.xp, xpToNext: hero.xpToNext,
        gold: hero.gold, totalKills: hero.totalKills, skillPoints: hero.skillPoints,
        currentZone: currentZoneId, stats: hero.stats, baseStats: hero.baseStats,
        equipment: hero.equipment, loadout: hero.loadout, inventory, stackableInventory,
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
      const dbItem = dbItems.find(di => di.itemData.id === item.id && di.itemData.slot === item.slot && di.itemData.rarity === item.rarity)
      if (!dbItem) throw new Error('Item não encontrado no servidor.')
      await api.shop.listItem(dbItem.id, price)
      setSellItem(null)
      setDetailItem(null)
    } catch (e) {
      setSellError(e instanceof Error ? e.message : 'Erro ao listar.')
    } finally {
      setSellLoading(false)
    }
  }

  const handleSend = async (item: Equipment) => {
    setDetailItem(null)
    if (onComposeMail) {
      onComposeMail(item)
    } else {
      api.hero.inventory()
        .then(dbItems => {
          const items = dbItems.map(db => {
            const raw = db.itemData
            if (typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.slot !== 'string' || typeof raw.rarity !== 'string' || typeof raw.icon !== 'string' || typeof raw.requiredLevel !== 'number' || !raw.bonuses || typeof raw.bonuses !== 'object') return null
            if (!['weapon', 'armor', 'helm', 'ring'].includes(raw.slot as string)) return null
            return raw as unknown as Equipment
          }).filter((i): i is Equipment => !!i)
          replaceInventory(items)
        })
        .catch(() => undefined)
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => { setDetailItem(null); setSellItem(null); setSellError(null); setSellPrice('') }}
          onEquip={() => { equipItemFromInventory(detailItem); setDetailItem(null) }}
          canEquip={hero.level >= detailItem.requiredLevel}
          onSell={user ? () => setSellItem(detailItem) : undefined}
          onSend={user ? () => handleSend(detailItem) : undefined}
          sellPanel={sellItem?.id === detailItem.id ? (
            <div className="flex flex-col gap-2">
              {sellError && <p className="text-red-400 text-xs">{sellError}</p>}
              <div className="flex gap-2 items-center">
                <span className="text-yellow-400 text-xs shrink-0">🪙 Preço</span>
                <input
                  type="number" min={1} placeholder="Ouro"
                  value={sellPrice}
                  onChange={e => { setSellPrice(e.target.value); setSellError(null) }}
                  className="flex-1 bg-black/40 border border-white/10 rounded-md px-2 py-1 text-xs text-white placeholder-white/20 outline-none focus:border-yellow-500/50"
                />
                <button
                  onClick={() => handleSell(detailItem)}
                  disabled={sellLoading}
                  className="px-3 py-1 rounded-md text-xs font-bold bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white transition-colors"
                >
                  {sellLoading ? '...' : 'Listar'}
                </button>
                <button onClick={() => { setSellItem(null); setSellError(null) }} className="text-white/40 hover:text-white/70 text-sm">✕</button>
              </div>
            </div>
          ) : undefined}
        />
      )}

      <p className="text-white/40 text-xs uppercase font-bold">Inventário ({inventory.length})</p>

      {/* Stackable items */}
      {Object.entries(stackableInventory).some(([, qty]) => qty > 0) && (
        <div className="bg-slate-900/40 rounded-lg border border-white/10 p-2.5">
          <p className="text-white/45 text-xs uppercase font-bold mb-2">Consumíveis e Recursos</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stackableInventory)
              .filter(([, qty]) => qty > 0)
              .map(([itemId, qty]) => {
                const def = ITEM_BY_ID[itemId]
                return (
                  <div key={itemId} className="flex flex-col items-center gap-0.5 w-14">
                    <div className="w-12 h-12 rounded-md border border-white/10 bg-black/30 flex items-center justify-center overflow-hidden">
                      {def?.sprite
                        ? <img src={def.sprite} alt={def.name} className="w-full h-full object-contain p-1" />
                        : <span className="text-xl">{def?.icon ?? '•'}</span>
                      }
                    </div>
                    <span className="text-amber-300 text-[10px] font-bold">x{qty}</span>
                    <span className="text-white/40 text-[9px] text-center leading-tight truncate w-full text-center">{def?.name ?? itemId}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Equipment grid */}
      {inventory.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-white/20 text-sm text-center">Nenhum item ainda.<br />Derrote inimigos para obter drops!</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {inventory.map((item, i) => {
            const sprite = ITEM_BY_ID[item.id]?.sprite
            const enhancement = item.enhancement ?? 0
            const canEquip = hero.level >= item.requiredLevel
            return (
              <button
                key={`${item.id}-${i}`}
                onClick={() => openDetail(item)}
                title={getItemDisplayName(item)}
                className={`relative aspect-square rounded-lg border-2 bg-black/40 hover:bg-black/70 transition-all overflow-hidden group ${RARITY_BORDER[item.rarity]} ${!canEquip ? 'opacity-60' : ''}`}
              >
                {sprite ? (
                  <img
                    src={sprite}
                    alt={item.name}
                    className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-150"
                  />
                ) : (
                  <span className="flex items-center justify-center h-full text-2xl group-hover:scale-110 transition-transform duration-150">
                    {item.icon}
                  </span>
                )}
                {enhancement > 0 && (
                  <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-amber-300 bg-black/80 rounded px-0.5 leading-tight">
                    +{enhancement}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
