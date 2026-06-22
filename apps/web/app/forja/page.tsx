'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import {
  CORE_INFO,
  NPC_STORE,
  getSuccessRate,
  canUseCoreForLevel,
  getItemDisplayName,
  ENHANCEMENT_MAX,
  SAFE_ENHANCEMENT_MAX,
} from '../game/enhancement'
import type { Equipment } from '../game/types'

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

const SLOT_PT: Record<string, string> = {
  weapon: 'Arma', armor: 'Armadura', helm: 'Elmo', ring: 'Anel',
}

function bonusText(bonuses: Equipment['bonuses']): string {
  return Object.entries(bonuses ?? {})
    .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
    .join(', ')
}

function EnhancementBar({ level }: { level: number }) {
  const pct = (level / ENHANCEMENT_MAX) * 100
  const color = level <= 7 ? 'bg-green-500' : level <= 14 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="w-full bg-stone-800 rounded-full h-1.5 mt-1">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function ForjaPage() {
  return (
    <Suspense fallback={<ForjaPageFallback />}>
      <ForjaPageContent />
    </Suspense>
  )
}

function ForjaPageFallback() {
  return <div className="h-full bg-[radial-gradient(circle_at_top,#3b2818_0%,#1d150f_35%,#100d08_70%,#090806_100%)]" />
}

function ForjaPageContent() {
  const { user, logout } = useAuthStore()
  const { hero, inventory, stackableInventory, enhanceInventoryItem } = useGameStore()

  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null)
  const [selectedCore, setSelectedCore] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; prevLevel: number; newLevel: number } | null>(null)
  const [animating, setAnimating] = useState(false)
  const [itemSearch, setItemSearch] = useState('')

  const searchParams = useSearchParams()
  useEffect(() => {
    const id = searchParams.get('id')
    const slot = searchParams.get('slot')
    const rarity = searchParams.get('rarity')
    const enh = parseInt(searchParams.get('enh') ?? '0', 10)
    if (!id || !slot || !rarity) return
    const match = inventory.find(item =>
      item.id === id && item.slot === slot && item.rarity === rarity &&
      (item.enhancement ?? 0) === enh
    )
    if (match) {
      setSelectedItem(match)
      setSelectedCore(null)
      setLastResult(null)
    }
  // Run once when inventory first becomes available after navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory.length])

  const enhanceableItems = inventory.filter(item => {
    const enhancement = item.enhancement ?? 0
    return enhancement < ENHANCEMENT_MAX
  })

  const filteredEnhanceableItems = itemSearch.trim()
    ? enhanceableItems.filter(item =>
        getItemDisplayName(item).toLowerCase().includes(itemSearch.toLowerCase())
      )
    : enhanceableItems

  const currentLevel = selectedItem?.enhancement ?? 0

  const availableCores = NPC_STORE.filter(entry => {
    const count = stackableInventory[entry.itemId] ?? 0
    if (count <= 0) return false
    return canUseCoreForLevel(entry.itemId, currentLevel)
  })

  const handleEnhance = () => {
    if (!selectedItem || !selectedCore || animating) return
    setAnimating(true)
    setLastResult(null)

    setTimeout(() => {
      const result = enhanceInventoryItem(selectedItem, selectedCore)
      if (!result) {
        setLastResult({ success: false, message: 'Item não encontrado no inventário.', prevLevel: currentLevel, newLevel: currentLevel })
        setAnimating(false)
        return
      }

      // Always sync selectedItem to the object now in inventory
      setSelectedItem(result.newItem)

      setLastResult({
        success: result.success,
        message: result.message,
        prevLevel: result.prevLevel,
        newLevel: result.newLevel,
      })
      setAnimating(false)
    }, 700)
  }

  const coreInfo = selectedCore ? CORE_INFO[selectedCore] : null
  const successRate = selectedItem && selectedCore && coreInfo
    ? getSuccessRate(currentLevel, coreInfo.perfect)
    : null

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
            <Link href="/loja" className="text-amber-100/55 hover:text-amber-100">Loja</Link>
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
          <div className="text-4xl mb-2">🔨</div>
          <h1 className="text-3xl font-bold tracking-[0.08em] text-amber-100">Forja de Aprimoramento</h1>
          <p className="text-amber-100/55 mt-1">Fortaleça seus equipamentos com núcleos de aprimoramento</p>
        </div>

        {!hero && (
          <div className="text-center text-amber-100/40 py-16">
            Inicie uma partida para usar a Forja.<br />
            <Link href="/" className="text-amber-400 hover:underline mt-1 inline-block">Jogar agora →</Link>
          </div>
        )}

        {hero && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: item selection + core selection */}
            <div className="space-y-4">
              {/* Item selection */}
              <div>
                <h2 className="text-sm font-bold text-amber-200 mb-2 uppercase tracking-widest">Escolher Equipamento</h2>
                {enhanceableItems.length > 0 && (
                  <input
                    type="text"
                    placeholder="Buscar item..."
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="w-full bg-[#0f0a07] border border-amber-100/15 rounded-lg px-3 py-1.5 text-xs text-amber-100 placeholder-amber-100/25 outline-none focus:border-amber-100/30 mb-2"
                  />
                )}
                {enhanceableItems.length === 0 ? (
                  <p className="text-amber-100/35 text-sm bg-[#18120d] rounded-xl p-4 border border-amber-100/10">
                    Nenhum equipamento no inventário para aprimorar.
                  </p>
                ) : filteredEnhanceableItems.length === 0 ? (
                  <p className="text-amber-100/35 text-xs bg-[#18120d] rounded-xl p-3 border border-amber-100/10">
                    Nenhum item encontrado para &quot;{itemSearch}&quot;
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filteredEnhanceableItems.map((item, idx) => {
                      const enh = item.enhancement ?? 0
                      const isSelected = selectedItem === item
                      return (
                        <button
                          key={`${item.id}-${idx}`}
                          onClick={() => { setSelectedItem(item); setSelectedCore(null); setLastResult(null) }}
                          className={`w-full text-left bg-[#18120d] rounded-xl px-3 py-2.5 border transition-colors ${isSelected ? 'border-amber-500/60 bg-amber-900/20' : `${RARITY_BORDER[item.rarity]} hover:border-amber-500/30`}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-xs ${RARITY_COLORS[item.rarity]}`}>{item.name}</span>
                                {enh > 0 && (
                                  <span className={`text-xs font-bold ${enh >= 15 ? 'text-red-400' : enh >= 8 ? 'text-amber-400' : 'text-green-400'}`}>+{enh}</span>
                                )}
                              </div>
                              <span className="text-amber-100/35 text-xs">{SLOT_PT[item.slot] ?? item.slot}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Core selection */}
              {selectedItem && (
                <div>
                  <h2 className="text-sm font-bold text-amber-200 mb-2 uppercase tracking-widest">Escolher Núcleo</h2>
                  {availableCores.length === 0 ? (
                    <div className="text-amber-100/35 text-sm bg-[#18120d] rounded-xl p-4 border border-amber-100/10">
                      <p>Nenhum núcleo disponível para +{currentLevel}.</p>
                      <Link href="/loja" className="text-amber-400 hover:underline text-xs mt-1 inline-block">
                        Comprar núcleos na Loja →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableCores.map(entry => {
                        const count = stackableInventory[entry.itemId] ?? 0
                        const rate = getSuccessRate(currentLevel, entry.perfect)
                        const isSelected = selectedCore === entry.itemId
                        return (
                          <button
                            key={entry.itemId}
                            onClick={() => setSelectedCore(entry.itemId)}
                            className={`w-full text-left bg-[#18120d] rounded-xl px-3 py-2.5 border transition-colors ${isSelected ? 'border-amber-500/60 bg-amber-900/20' : `${RARITY_BORDER[entry.rarity]} hover:border-amber-500/30`}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{entry.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`font-bold text-xs ${RARITY_COLORS[entry.rarity]}`}>{entry.name}</span>
                                  <span className="text-amber-100/40 text-xs">×{count}</span>
                                </div>
                                <span className={`text-xs font-bold ${entry.perfect ? 'text-green-400' : rate >= 0.5 ? 'text-green-400' : rate >= 0.2 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {entry.perfect ? '100%' : `${(rate * 100).toFixed(0)}%`} de sucesso
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: preview + result */}
            <div className="space-y-4">
              {/* Item preview */}
              {selectedItem ? (
                <div className={`bg-[#18120d] rounded-xl p-4 border ${RARITY_BORDER[selectedItem.rarity]}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{selectedItem.icon}</span>
                    <div>
                      <p className={`font-bold text-base ${RARITY_COLORS[selectedItem.rarity]}`}>
                        {getItemDisplayName(selectedItem)}
                      </p>
                      <p className="text-amber-100/40 text-xs">{SLOT_PT[selectedItem.slot]} • Nível {selectedItem.requiredLevel}+</p>
                    </div>
                  </div>
                  <p className="text-amber-100/50 text-xs">{bonusText(selectedItem.bonuses)}</p>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-amber-100/50">Aprimoramento</span>
                      <span className={`font-bold ${currentLevel >= 15 ? 'text-red-400' : currentLevel >= 8 ? 'text-amber-400' : 'text-green-400'}`}>
                        +{currentLevel} / +{ENHANCEMENT_MAX}
                      </span>
                    </div>
                    <EnhancementBar level={currentLevel} />
                  </div>

                  {currentLevel > SAFE_ENHANCEMENT_MAX && (
                    <p className="text-red-400/70 text-xs mt-2">⚠️ Acima de +{SAFE_ENHANCEMENT_MAX}: falha pode reduzir o aprimoramento.</p>
                  )}
                </div>
              ) : (
                <div className="bg-[#18120d] rounded-xl p-8 border border-amber-100/10 text-center text-amber-100/30 text-sm">
                  Selecione um equipamento
                </div>
              )}

              {/* Success rate info */}
              {selectedItem && selectedCore && successRate !== null && (
                <div className="bg-[#18120d] rounded-xl p-4 border border-amber-100/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-amber-100/60 text-sm">Tentativa</span>
                    <span className="text-amber-100/60 text-sm font-bold">+{currentLevel} → +{currentLevel + 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-100/60 text-sm">Taxa de sucesso</span>
                    <span className={`text-base font-bold ${coreInfo?.perfect ? 'text-green-400' : successRate >= 0.5 ? 'text-green-400' : successRate >= 0.2 ? 'text-amber-400' : 'text-red-400'}`}>
                      {coreInfo?.perfect ? '100%' : `${(successRate * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  {currentLevel > SAFE_ENHANCEMENT_MAX && !coreInfo?.perfect && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-red-400/70 text-xs">Em caso de falha</span>
                      <span className="text-red-400/70 text-xs">Volta para +{currentLevel - 1}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Attempt button */}
              <button
                onClick={handleEnhance}
                disabled={!selectedItem || !selectedCore || animating}
                className="w-full py-3 rounded-xl font-bold text-base bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-50 transition-colors"
              >
                {animating ? '⚒️ Aprimorando...' : '⚒️ Aprimorar'}
              </button>

              {/* Result */}
              {lastResult && (
                <div className={`rounded-xl p-4 border text-center text-sm font-bold transition-all ${lastResult.success ? 'bg-green-900/25 border-green-500/40 text-green-300' : 'bg-red-900/25 border-red-500/40 text-red-300'}`}>
                  {lastResult.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Guide */}
        <div className="mt-10 bg-[#18120d] rounded-xl p-5 border border-amber-100/10">
          <h3 className="text-amber-200 font-bold mb-3 text-sm uppercase tracking-widest">Como funciona</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-100/50 leading-relaxed">
            <div>
              <p className="text-amber-100/70 font-semibold mb-1">Núcleos por faixa</p>
              <p>🔸 Baixo — +1 a +5</p>
              <p>🔶 Médio — +6 a +10</p>
              <p>💠 Alto — +11 a +15</p>
              <p>💎 Altíssimo — +16 a +20</p>
            </div>
            <div>
              <p className="text-amber-100/70 font-semibold mb-1">Regras de falha</p>
              <p>✅ Até +{SAFE_ENHANCEMENT_MAX}: falha mantém o nível atual.</p>
              <p>⚠️ Acima de +{SAFE_ENHANCEMENT_MAX}: falha reduz -1 nível.</p>
              <p>⭐ Núcleos Perfeitos: 100% de sucesso, sem risco.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
