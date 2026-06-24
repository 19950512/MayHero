'use client'

import { useState, useMemo } from 'react'
import { notFound } from 'next/navigation'
import { NPC_BY_ID } from '../../game/npcs'
import type { NpcSellEntry, NpcBuyEntry } from '../../game/npcs'
import { ITEM_BY_ID } from '../../game/items'
import { useGameStore } from '../../store/gameStore'
import { api } from '../../lib/api'
import { PageHeader } from '../../components/PageHeader'
import type { Equipment } from '../../game/types'

function parseDbEquipment(db: { id: string; itemData: Record<string, unknown>; listing?: { soldAt: string | null } | null }): Equipment | null {
  const raw = db.itemData
  if (
    typeof raw.id !== 'string' || typeof raw.name !== 'string' ||
    typeof raw.slot !== 'string' || typeof raw.rarity !== 'string' ||
    typeof raw.icon !== 'string' || typeof raw.requiredLevel !== 'number' ||
    !raw.bonuses || typeof raw.bonuses !== 'object'
  ) return null
  if (!['weapon', 'armor', 'helm', 'ring'].includes(raw.slot as string)) return null
  if (db.listing && db.listing.soldAt === null) return null
  return {
    id: raw.id,
    inventoryItemId: db.id,
    name: raw.name,
    slot: raw.slot as Equipment['slot'],
    rarity: raw.rarity as Equipment['rarity'],
    bonuses: raw.bonuses as Equipment['bonuses'],
    icon: raw.icon,
    requiredLevel: raw.requiredLevel,
    enhancement: typeof raw.enhancement === 'number' ? raw.enhancement : undefined,
  }
}

const RARITY_COLORS: Record<string, string> = {
  common:    'text-stone-300',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-amber-400',
}

const RARITY_BORDER: Record<string, string> = {
  common:    'border-stone-600/40',
  rare:      'border-blue-500/40',
  epic:      'border-purple-500/40',
  legendary: 'border-amber-500/40',
}

type ConfirmMode = 'buy' | 'sell'

interface ConfirmState {
  mode: ConfirmMode
  itemId: string
  qty: number
}

export default function NpcPageClient({ id }: { id: string }) {
  const npc = NPC_BY_ID[id]
  if (!npc) notFound()

  const { hero, inventory, stackableInventory, npcPurchased, buyFromNpc, sellToNpc, applyNpcEquipmentSell, replaceInventory } = useGameStore()

  const [tab, setTab] = useState<'comprar' | 'vender'>('comprar')
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const phrase = useMemo(
    () => npc.phrases[Math.floor(Math.random() * npc.phrases.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [npc.id]
  )

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3500)
  }

  const handleConfirm = async () => {
    if (!confirm) return

    if (confirm.mode === 'buy') {
      const result = buyFromNpc(npc.id, confirm.itemId, confirm.qty)
      setConfirm(null)
      flash(result.ok ? 'Comprado com sucesso!' : (result.error ?? 'Erro.'), result.ok)
      return
    }

    const itemDef = ITEM_BY_ID[confirm.itemId]
    if (itemDef?.stackable !== false) {
      const result = sellToNpc(npc.id, confirm.itemId, confirm.qty)
      setConfirm(null)
      flash(result.ok ? 'Vendido com sucesso!' : (result.error ?? 'Erro.'), result.ok)
      return
    }

    // Non-stackable equipment sell — needs server inventoryItemId
    setConfirming(true)
    try {
      let sellSource = inventory
      let itemsToSell = sellSource.filter(i => i.id === confirm.itemId && i.inventoryItemId).slice(0, confirm.qty)

      if (itemsToSell.length < confirm.qty) {
        // Auto-sync inventory from server to obtain IDs (items dropped mid-session lack them)
        const dbItems = await api.hero.inventory()
        const equippedDbIds = new Set<string>()
        if (hero) {
          for (const slot of ['weapon', 'armor', 'helm', 'ring'] as const) {
            const eq = hero.equipment[slot]
            if (eq?.inventoryItemId) equippedDbIds.add(eq.inventoryItemId)
          }
        }
        const synced: Equipment[] = []
        for (const db of dbItems) {
          if (equippedDbIds.has(db.id)) continue
          const eq = parseDbEquipment(db)
          if (eq) synced.push(eq)
        }
        replaceInventory(synced)
        sellSource = synced
        itemsToSell = sellSource.filter(i => i.id === confirm.itemId && i.inventoryItemId).slice(0, confirm.qty)
      }

      if (itemsToSell.length < confirm.qty) {
        setConfirm(null)
        flash('Itens não encontrados no servidor. Tente novamente.', false)
        return
      }

      const inventoryItemIds = itemsToSell.map(i => i.inventoryItemId!)
      const result = await api.hero.npcSell({ npcId: npc.id, inventoryItemIds })
      applyNpcEquipmentSell(inventoryItemIds, result.newGold)
      setConfirm(null)
      flash('Vendido com sucesso!', true)
    } catch (e) {
      setConfirm(null)
      flash(e instanceof Error ? e.message : 'Erro ao vender.', false)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,#3b2818_0%,#1d150f_35%,#100d08_70%,#090806_100%)] text-[var(--ink)]">
      <PageHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* NPC portrait */}
        <div className="flex flex-col items-center mb-8">
          {npc.sprite
            ? <img src={npc.sprite} alt={npc.name} className="w-36 h-36 object-contain mb-3 rounded-2xl" />
            : <div className="text-7xl mb-3">{npc.image}</div>
          }
          <h1 className="text-2xl font-bold text-amber-100 tracking-wide">{npc.name}</h1>
          <p className="text-amber-100/45 text-sm mt-1 text-center max-w-xs">{npc.lore}</p>
          <div className="mt-4 bg-[#18120d] border border-amber-700/30 rounded-xl px-5 py-3 max-w-sm text-center">
            <span className="text-amber-100/70 text-sm italic">"{phrase}"</span>
          </div>
        </div>

        {/* Flash message */}
        {msg && (
          <div className={`mb-5 p-3 rounded-xl text-sm text-center ${msg.ok ? 'bg-green-900/30 text-green-300 border border-green-500/30' : 'bg-red-900/30 text-red-300 border border-red-500/30'}`}>
            {msg.text}
          </div>
        )}

        {!hero && (
          <div className="mb-5 p-3 rounded-xl text-sm text-center bg-amber-900/20 text-amber-300 border border-amber-500/30">
            Inicie uma partida para negociar.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab('comprar')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'comprar' ? 'bg-amber-800 text-amber-50' : 'bg-[#18120d] text-amber-100/50 hover:text-amber-100/80 border border-amber-900/30'}`}
          >
            🛒 Comprar
          </button>
          <button
            onClick={() => setTab('vender')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'vender' ? 'bg-amber-800 text-amber-50' : 'bg-[#18120d] text-amber-100/50 hover:text-amber-100/80 border border-amber-900/30'}`}
          >
            💰 Vender
          </button>
        </div>

        {/* Buy tab */}
        {tab === 'comprar' && (
          <div className="flex flex-col gap-3">
            {npc.sells.map(entry => (
              <BuyCard
                key={entry.itemId}
                entry={entry}
                alreadyBought={npcPurchased[npc.id]?.[entry.itemId] ?? 0}
                heroGold={hero?.gold ?? 0}
                disabled={!hero}
                onRequest={(qty) => setConfirm({ mode: 'buy', itemId: entry.itemId, qty })}
              />
            ))}
          </div>
        )}

        {/* Sell tab */}
        {tab === 'vender' && (
          <div className="flex flex-col gap-3">
            {npc.buys.map(entry => {
              const def = ITEM_BY_ID[entry.itemId]
              const owned = def?.stackable !== false
                ? (stackableInventory[entry.itemId] ?? 0)
                : inventory.filter(i => i.id === entry.itemId).length
              return (
                <SellCard
                  key={entry.itemId}
                  entry={entry}
                  owned={owned}
                  disabled={!hero}
                  onRequest={(qty) => setConfirm({ mode: 'sell', itemId: entry.itemId, qty })}
                />
              )
            })}
          </div>
        )}
      </main>

      {/* Confirmation modal */}
      {confirm && (
        <ConfirmModal
          mode={confirm.mode}
          itemId={confirm.itemId}
          qty={confirm.qty}
          npcId={npc.id}
          heroGold={hero?.gold ?? 0}
          stackableInventory={stackableInventory}
          inventory={inventory}
          npcPurchased={npcPurchased}
          npcSells={npc.sells}
          npcBuys={npc.buys}
          loading={confirming}
          onChangeQty={(qty) => setConfirm(c => c ? { ...c, qty } : c)}
          onConfirm={handleConfirm}
          onCancel={() => !confirming && setConfirm(null)}
        />
      )}
    </div>
  )
}

function BuyCard({
  entry,
  alreadyBought,
  heroGold,
  disabled,
  onRequest,
}: {
  entry: NpcSellEntry
  alreadyBought: number
  heroGold: number
  disabled: boolean
  onRequest: (qty: number) => void
}) {
  const [qty, setQty] = useState(1)
  const itemDef = ITEM_BY_ID[entry.itemId]
  const remaining = entry.quantity - alreadyBought
  const total = entry.price * qty
  const canAfford = heroGold >= total
  const hasStock = remaining > 0

  if (!itemDef) return null

  return (
    <div className={`bg-[#18120d] rounded-xl p-4 border ${RARITY_BORDER[itemDef.rarity]} flex gap-3`}>
      <div className="w-10 h-10 flex items-center justify-center shrink-0 mt-0.5">
        {itemDef.sprite
          ? <img src={itemDef.sprite} alt={itemDef.name} className="w-9 h-9 object-contain" />
          : <span className="text-3xl">{itemDef.icon}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-bold text-sm ${RARITY_COLORS[itemDef.rarity]}`}>{itemDef.name}</p>
          <span className="text-amber-100/30 text-[10px] capitalize">{itemDef.category}</span>
        </div>
        <p className="text-amber-100/35 text-xs mt-0.5">Estoque: {hasStock ? remaining : 'Esgotado'}</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-amber-300 font-bold text-sm">{entry.price.toLocaleString()} 🪙</span>
          <span className="text-amber-100/30 text-xs">×</span>
          <input
            type="number"
            min={1}
            max={Math.min(remaining, 99)}
            value={qty}
            onChange={e => setQty(Math.max(1, Math.min(remaining, Number(e.target.value) || 1)))}
            className="w-12 bg-[#0f0a07] border border-amber-100/20 rounded text-center text-amber-100 text-sm py-0.5"
            disabled={disabled || !hasStock}
          />
          <span className="text-amber-100/40 text-xs">= {total.toLocaleString()} 🪙</span>
        </div>

        <div className="flex items-center justify-end mt-2">
          <button
            onClick={() => onRequest(qty)}
            disabled={disabled || !hasStock || !canAfford}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-50 transition-colors"
          >
            {!hasStock ? 'Esgotado' : !canAfford ? 'Sem ouro' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SellCard({
  entry,
  owned,
  disabled,
  onRequest,
}: {
  entry: NpcBuyEntry
  owned: number
  disabled: boolean
  onRequest: (qty: number) => void
}) {
  const [qty, setQty] = useState(1)
  const itemDef = ITEM_BY_ID[entry.itemId]
  const total = entry.price * qty
  const hasItems = owned > 0

  if (!itemDef) return null

  return (
    <div className={`bg-[#18120d] rounded-xl p-4 border ${RARITY_BORDER[itemDef.rarity]} flex gap-3`}>
      <div className="w-10 h-10 flex items-center justify-center shrink-0 mt-0.5">
        {itemDef.sprite
          ? <img src={itemDef.sprite} alt={itemDef.name} className="w-9 h-9 object-contain" />
          : <span className="text-3xl">{itemDef.icon}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-bold text-sm ${RARITY_COLORS[itemDef.rarity]}`}>{itemDef.name}</p>
          <span className="text-amber-100/30 text-[10px] capitalize">{itemDef.category}</span>
        </div>
        <p className="text-amber-100/35 text-xs mt-0.5">Você possui: {owned}</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-emerald-400 font-bold text-sm">{entry.price.toLocaleString()} 🪙</span>
          <span className="text-amber-100/30 text-xs">×</span>
          <input
            type="number"
            min={1}
            max={owned}
            value={qty}
            onChange={e => setQty(Math.max(1, Math.min(owned, Number(e.target.value) || 1)))}
            className="w-12 bg-[#0f0a07] border border-amber-100/20 rounded text-center text-amber-100 text-sm py-0.5"
            disabled={disabled || !hasItems}
          />
          <span className="text-amber-100/40 text-xs">= {total.toLocaleString()} 🪙</span>
        </div>

        <div className="flex items-center justify-end mt-2">
          <button
            onClick={() => onRequest(qty)}
            disabled={disabled || !hasItems}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-emerald-50 transition-colors"
          >
            {!hasItems ? 'Sem itens' : 'Vender'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({
  mode,
  itemId,
  qty,
  npcId,
  heroGold,
  stackableInventory,
  inventory,
  npcPurchased,
  npcSells,
  npcBuys,
  loading,
  onChangeQty,
  onConfirm,
  onCancel,
}: {
  mode: ConfirmMode
  itemId: string
  qty: number
  npcId: string
  heroGold: number
  stackableInventory: Record<string, number>
  inventory: { id: string }[]
  npcPurchased: Record<string, Record<string, number>>
  npcSells: NpcSellEntry[]
  npcBuys: NpcBuyEntry[]
  loading: boolean
  onChangeQty: (qty: number) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const itemDef = ITEM_BY_ID[itemId]
  if (!itemDef) return null

  const isBuy = mode === 'buy'
  const entry = isBuy
    ? npcSells.find(e => e.itemId === itemId)
    : npcBuys.find(e => e.itemId === itemId)
  if (!entry) return null

  const price = entry.price
  const total = price * qty

  const ownedQty = itemDef.stackable !== false
    ? (stackableInventory[itemId] ?? 0)
    : inventory.filter(i => i.id === itemId).length

  const maxQty = isBuy
    ? (entry as NpcSellEntry).quantity - (npcPurchased[npcId]?.[itemId] ?? 0)
    : ownedQty

  const canProceed = isBuy ? heroGold >= total : ownedQty >= qty

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onCancel}>
      <div
        className="bg-[#1a140f] border border-amber-800/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-amber-100 font-bold text-lg text-center mb-1">
          {isBuy ? 'Confirmar Compra' : 'Confirmar Venda'}
        </p>
        <p className="text-amber-100/40 text-xs text-center mb-5">
          {isBuy ? 'Você está comprando:' : 'Você está vendendo:'}
        </p>

        <div className="flex items-center gap-3 bg-[#120e0a] rounded-xl p-3 mb-5">
          {itemDef.sprite
            ? <img src={itemDef.sprite} alt={itemDef.name} className="w-9 h-9 object-contain" />
            : <span className="text-3xl">{itemDef.icon}</span>
          }
          <div>
            <p className={`font-bold text-sm ${RARITY_COLORS[itemDef.rarity]}`}>{itemDef.name}</p>
            <p className="text-amber-100/40 text-xs">{price.toLocaleString()} 🪙 por unidade</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <span className="text-amber-100/60 text-sm">Quantidade:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeQty(Math.max(1, qty - 1))}
              className="w-7 h-7 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 text-amber-100 text-sm font-bold"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={e => onChangeQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
              className="w-14 bg-[#0f0a07] border border-amber-100/20 rounded text-center text-amber-100 text-sm py-1"
            />
            <button
              onClick={() => onChangeQty(Math.min(maxQty, qty + 1))}
              className="w-7 h-7 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 text-amber-100 text-sm font-bold"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#120e0a] rounded-xl px-4 py-3 mb-5">
          <span className="text-amber-100/60 text-sm">Total:</span>
          <span className={`font-bold text-lg ${isBuy ? 'text-amber-300' : 'text-emerald-400'}`}>
            {isBuy ? '−' : '+'}{total.toLocaleString()} 🪙
          </span>
        </div>

        {isBuy && heroGold < total && (
          <p className="text-red-400 text-xs text-center mb-3">Ouro insuficiente.</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#18120d] border border-amber-900/30 text-amber-100/60 hover:text-amber-100 disabled:opacity-40 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canProceed || loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-colors ${isBuy ? 'bg-amber-800 hover:bg-amber-700 text-amber-50' : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-50'}`}
          >
            {loading ? 'Aguarde...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
