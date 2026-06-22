'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { NPC_STORE } from '../game/enhancement'
import type { NpcStoreEntry } from '../game/enhancement'

const RARITY_COLORS: Record<string, string> = {
  common: 'text-stone-300',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-stone-600/40',
  rare: 'border-blue-500/40',
  epic: 'border-purple-500/40',
  legendary: 'border-amber-500/40',
}

const TIER_LABEL = ['', 'Baixo (+1~+5)', 'Médio (+6~+10)', 'Alto (+11~+15)', 'Altíssimo (+16~+20)']

export default function LojaPage() {
  const { user, logout } = useAuthStore()
  const { hero, buyFromNpcStore, stackableInventory } = useGameStore()
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [buying, setBuying] = useState<string | null>(null)

  const handleBuy = (entry: NpcStoreEntry, qty: number) => {
    if (!hero) { setMsg({ text: 'Inicie um herói para comprar.', ok: false }); return }
    setBuying(entry.itemId)
    const result = buyFromNpcStore(entry.itemId, qty)
    setMsg({ text: result.ok ? `Comprado ${qty}x ${entry.name}!` : (result.error ?? 'Erro.'), ok: result.ok })
    setBuying(null)
    setTimeout(() => setMsg(null), 3500)
  }

  const regular = NPC_STORE.filter(e => !e.perfect)
  const perfect = NPC_STORE.filter(e => e.perfect)

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,#3b2818_0%,#1d150f_35%,#100d08_70%,#090806_100%)] text-[var(--ink)]">
      <header className="border-b border-amber-900/40 bg-[#1a140f]/90 sticky top-0 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-amber-100 font-semibold text-xl tracking-[0.08em]">May Hero</Link>
          <div className="flex gap-4 text-sm items-center">
            {hero && (
              <div className="flex items-center gap-1">
                <span className="text-amber-100/60">Ouro</span>
                <span className="text-amber-300 font-bold">{hero.gold.toLocaleString()}</span>
              </div>
            )}
            <Link href="/forja" className="text-amber-100/55 hover:text-amber-100">Forja</Link>
            <Link href="/shop" className="text-amber-100/55 hover:text-amber-100">Mercado</Link>
            <Link href="/rankings" className="text-amber-100/55 hover:text-amber-100">Rankings</Link>
            {user ? (
              <>
                <Link href="/" className="text-amber-100/55 hover:text-amber-100">Jogar</Link>
                <span className="text-amber-100/35">@{user.username}</span>
                <button onClick={logout} className="text-amber-100/35 hover:text-amber-100/70">Sair</button>
              </>
            ) : (
              <Link href="/login" className="text-amber-300 hover:text-amber-200">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚒️</div>
          <h1 className="text-3xl font-bold tracking-[0.08em] text-amber-100">Loja do Ferreiro</h1>
          <p className="text-amber-100/55 mt-1">Núcleos de aprimoramento para fortalecer seus equipamentos</p>
        </div>

        {msg && (
          <div className={`mb-6 p-3 rounded-xl text-sm text-center ${msg.ok ? 'bg-green-900/30 text-green-300 border border-green-500/30' : 'bg-red-900/30 text-red-300 border border-red-500/30'}`}>
            {msg.text}
          </div>
        )}

        {!hero && (
          <div className="mb-6 p-3 rounded-xl text-sm text-center bg-amber-900/20 text-amber-300 border border-amber-500/30">
            Inicie uma partida para comprar itens.
          </div>
        )}

        {/* Regular cores */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-amber-200 mb-3 tracking-wide">Núcleos Comuns</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {regular.map(entry => (
              <CoreCard
                key={entry.itemId}
                entry={entry}
                owned={stackableInventory[entry.itemId] ?? 0}
                buying={buying === entry.itemId}
                onBuy={(qty) => handleBuy(entry, qty)}
                heroGold={hero?.gold ?? 0}
                disabled={!hero}
              />
            ))}
          </div>
        </section>

        {/* Perfect cores */}
        <section>
          <h2 className="text-lg font-bold text-amber-200 mb-1 tracking-wide">Núcleos Perfeitos</h2>
          <p className="text-amber-100/40 text-xs mb-3">Garantem 100% de sucesso no aprimoramento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {perfect.map(entry => (
              <CoreCard
                key={entry.itemId}
                entry={entry}
                owned={stackableInventory[entry.itemId] ?? 0}
                buying={buying === entry.itemId}
                onBuy={(qty) => handleBuy(entry, qty)}
                heroGold={hero?.gold ?? 0}
                disabled={!hero}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function CoreCard({
  entry,
  owned,
  buying,
  onBuy,
  heroGold,
  disabled,
}: {
  entry: NpcStoreEntry
  owned: number
  buying: boolean
  onBuy: (qty: number) => void
  heroGold: number
  disabled: boolean
}) {
  const [qty, setQty] = useState(1)
  const totalCost = entry.price * qty
  const canAfford = heroGold >= totalCost

  return (
    <div className={`bg-[#18120d] rounded-xl p-4 border ${RARITY_BORDER[entry.rarity]} flex gap-3`}>
      <div className="text-3xl w-10 text-center shrink-0 mt-0.5">{entry.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${RARITY_COLORS[entry.rarity]}`}>{entry.name}</p>
        <p className="text-amber-100/40 text-xs mt-0.5">{TIER_LABEL[entry.tier]}</p>
        <p className="text-amber-100/45 text-xs mt-1 leading-snug">{entry.description}</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-amber-300 font-bold text-sm">{entry.price.toLocaleString()} 🪙</span>
          <span className="text-amber-100/30 text-xs">×</span>
          <input
            type="number"
            min={1}
            max={99}
            value={qty}
            onChange={e => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            className="w-12 bg-[#0f0a07] border border-amber-100/20 rounded text-center text-amber-100 text-sm py-0.5"
            disabled={disabled}
          />
          <span className="text-amber-100/30 text-xs">= {totalCost.toLocaleString()} 🪙</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-amber-100/30 text-xs">Possui: {owned}</span>
          <button
            onClick={() => onBuy(qty)}
            disabled={buying || disabled || !canAfford}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-50 transition-colors"
          >
            {buying ? '...' : !canAfford ? 'Sem ouro' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  )
}
