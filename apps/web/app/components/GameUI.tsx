'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import { BattleScreen } from './BattleScreen'
import { HeroStats } from './HeroStats'
import { Inventory } from './Inventory'
import { ZoneSelector } from './ZoneSelector'
import { Profile } from './Profile'
import type { Equipment } from '../game/types'

type Tab = 'battle' | 'stats' | 'inventory' | 'zones' | 'profile'

const TABS: { id: Tab; label: string; sigil: string }[] = [
  { id: 'battle',  label: 'Confronto', sigil: 'I'   },
  { id: 'stats',   label: 'Herói',     sigil: 'II'  },
  { id: 'inventory', label: 'Arsenal', sigil: 'III' },
  { id: 'zones',   label: 'Reinos',    sigil: 'IV'  },
  { id: 'profile', label: 'Perfil',    sigil: 'V'   },
]

const SYNC_INTERVAL_MS = 30_000

// Module-level flag — survives component remounts (e.g. navigating /forja → /)
// but resets on full page reload. Prevents re-hydrating on remount and wiping local enhancements.
let sessionInventoryHydrated = false

export function GameUI() {
  const [activeTab, setActiveTab] = useState<Tab>('battle')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')
  const [showNotifications, setShowNotifications] = useState(true)
  const {
    hero,
    battle,
    tick,
    notifications,
    dismissNotification,
    resetGame,
    inventory,
    stackableInventory,
    currentZone,
    killsInZone,
    battleEncounterId,
    setServerAuthoritativeRewards,
    startServerEncounter,
    applyServerVictoryResolution,
    replaceInventory,
  } = useGameStore()
  const { user, logout } = useAuthStore()
  const lastSyncRef = useRef<number>(0)
  const lastVictoryKeyRef = useRef<string | null>(null)
  const battleStartPendingRef = useRef(false)

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

    if (!['weapon', 'armor', 'helm', 'ring'].includes(raw.slot)) return null
    if (!['common', 'rare', 'epic', 'legendary'].includes(raw.rarity)) return null

    const bonuses = raw.bonuses as Record<string, unknown>
    for (const val of Object.values(bonuses)) {
      if (typeof val !== 'number' || !Number.isFinite(val)) return null
    }

    return {
      id: raw.id,
      name: raw.name,
      slot: raw.slot as Equipment['slot'],
      rarity: raw.rarity as Equipment['rarity'],
      bonuses: bonuses as Equipment['bonuses'],
      icon: raw.icon,
      requiredLevel: raw.requiredLevel,
      ...(typeof raw.enhancement === 'number' && raw.enhancement > 0
        ? { enhancement: raw.enhancement }
        : {}),
    }
  }

  const runTick = useCallback(() => { tick() }, [tick])
  useEffect(() => {
    const interval = setInterval(runTick, 500)
    return () => clearInterval(interval)
  }, [runTick])

  useEffect(() => {
    setServerAuthoritativeRewards(!!user)
    if (!user) sessionInventoryHydrated = false
  }, [user, setServerAuthoritativeRewards])

  // Hydrate local inventory from API once per session lifecycle.
  // Uses a module-level flag so navigating away and back doesn't re-run this
  // and overwrite locally-enhanced items with stale server data.
  useEffect(() => {
    if (!user || !hero) return
    if (sessionInventoryHydrated) return

    api.hero.inventory()
      .then(dbItems => {
        const items = dbItems
          .map(db => toEquipment(db.itemData))
          .filter((item): item is Equipment => !!item)
        replaceInventory(items)
        sessionInventoryHydrated = true
      })
      .catch(() => {
        // Ignore transient failures; local inventory remains available.
      })
  }, [user, hero, replaceInventory])

  useEffect(() => {
    // On refresh, persisted user may be stale; validate session with backend.
    api.auth.me().then((me) => {
      if (!me && user) {
        logout().catch(() => undefined)
      }
    }).catch(() => {
      // Ignore startup connectivity hiccups.
    })
  }, [user, logout])

  // Auto-dismiss notifications
  useEffect(() => {
    if (notifications.length === 0) return
    const t = setTimeout(() => dismissNotification(notifications[0].id), 3000)
    return () => clearTimeout(t)
  }, [notifications, dismissNotification])

  // Server-authoritative rewards for online battles.
  useEffect(() => {
    if (!user || !hero) return
    if (battle.phase !== 'victory' || !battle.enemy) return
    if (!battleEncounterId) return

    const key = `${battle.turn}:${battle.enemy.id}:${killsInZone}`
    if (lastVictoryKeyRef.current === key) return
    lastVictoryKeyRef.current = key

    api.hero.battleVictory({
      encounterId: battleEncounterId,
      enemyId: battle.enemy.id,
      currentZone,
      heroHpAfterBattle: hero.stats.hp,
    }).then(result => {
      applyServerVictoryResolution({
        hero: {
          ...result.hero,
          stats: result.hero.stats,
          baseStats: result.hero.baseStats,
        },
        rewards: {
          ...result.rewards,
          itemDrop: result.rewards.itemDrop,
          stackableDrops: result.rewards.stackableDrops,
        },
        serverState: result.serverState,
      })
    }).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : ''
      if (msg.toLowerCase().includes('não autorizado') || msg.toLowerCase().includes('unauthorized')) {
        setServerAuthoritativeRewards(false)
      }
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    })
  }, [user, hero, battle.phase, battle.turn, battle.enemy, battleEncounterId, currentZone, killsInZone, applyServerVictoryResolution, setServerAuthoritativeRewards])

  // In online mode, each fight must start from a server-issued encounter.
  useEffect(() => {
    if (!user || !hero) return
    if (battle.phase !== 'idle') return
    if (battleStartPendingRef.current) return
    if (battleEncounterId) return

    battleStartPendingRef.current = true
    api.hero.battleStart({ currentZone })
      .then(({ encounterId, enemyId }) => {
        startServerEncounter({ encounterId, enemyId })
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : ''
        if (msg.toLowerCase().includes('não autorizado') || msg.toLowerCase().includes('unauthorized')) {
          setServerAuthoritativeRewards(false)
        }
      })
      .finally(() => {
        battleStartPendingRef.current = false
      })
  }, [user, hero, battle.phase, battleEncounterId, currentZone, startServerEncounter, setServerAuthoritativeRewards])

  // Auto-sync to API
  useEffect(() => {
    if (!hero || !user) return
    const now = Date.now()
    if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return

    const syncData = {
      name: hero.name,
      class: hero.class,
      level: hero.level,
      xp: hero.xp,
      xpToNext: hero.xpToNext,
      gold: hero.gold,
      totalKills: hero.totalKills,
      skillPoints: hero.skillPoints,
      currentZone,
      stats: hero.stats,
      baseStats: hero.baseStats,
      equipment: hero.equipment,
      loadout: hero.loadout,
      inventory,
      stackableInventory,
    }

    setSyncStatus('syncing')
    lastSyncRef.current = now

    const doSync = () =>
      api.hero.sync(syncData as Record<string, unknown>)
        .then(() => setSyncStatus('ok'))
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : ''
          // Herói não existe na API ainda — cria primeiro, depois sincroniza
          if (msg.includes('não encontrado')) {
            api.hero.create({
              name: hero.name,
              class: hero.class,
              stats: hero.stats,
              baseStats: hero.baseStats,
            }).then(doSync).catch(() => setSyncStatus('error'))
          } else {
            setSyncStatus('error')
          }
        })
        .finally(() => setTimeout(() => setSyncStatus('idle'), 3000))

    doSync()
  }, [hero, user, inventory, stackableInventory, currentZone])

  const electronApi = typeof window !== 'undefined'
    ? (window as Window & { electronAPI?: { isElectron?: boolean; closeWindow?: () => void } }).electronAPI
    : undefined
  const isElectron = !!electronApi?.isElectron
  const handleClose = () => {
    if (isElectron) electronApi?.closeWindow?.()
  }

  if (!hero) return null

  return (
    <div className="flex flex-col h-screen bg-[radial-gradient(circle_at_top,#3a2b17_0%,#1b140d_30%,#100d08_70%,#0a0907_100%)] text-[var(--parchment)] select-none overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1a140f]/90 border-b border-amber-900/40 drag-region shrink-0">
        <div className="flex items-center gap-2 hidden sm:flex">
          <span className="text-amber-200 text-xs font-semibold tracking-[0.2em]">MAY HERO</span>
          {user && (
            <span className="text-amber-100/40 text-xs">@{user.username}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-amber-100/60">Nível</span>
            <span className="text-amber-200 font-bold">{hero.level}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-amber-100/60">XP</span>
            <span className="text-blue-300 font-semibold">{hero.xp}/{hero.xpToNext}</span>
          </div>
          <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${(hero.xp / hero.xpToNext) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 no-drag">
          {/* Sync indicator */}
          {user && (
            <span className={`text-xs ${syncStatus === 'syncing' ? 'text-amber-300' : syncStatus === 'ok' ? 'text-emerald-300' : syncStatus === 'error' ? 'text-red-300' : 'text-amber-100/30'}`}>
              {syncStatus === 'syncing' ? 'Sinc...' : syncStatus === 'ok' ? 'Sinc OK' : syncStatus === 'error' ? 'Sinc ERR' : 'Sinc'}
            </span>
          )}
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative w-6 h-6 rounded-md bg-amber-100/10 hover:bg-amber-100/20 flex items-center justify-center text-amber-100/70 hover:text-amber-50 text-xs transition-colors"
            title={showNotifications ? 'Ocultar notificações' : 'Mostrar notificações'}
            aria-label={showNotifications ? 'Ocultar notificações' : 'Mostrar notificações'}
          >
            {showNotifications ? '◉' : '○'}
            {!showNotifications && notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-600 text-[10px] leading-4 font-bold text-amber-50">
                {Math.min(notifications.length, 9)}
              </span>
            )}
          </button>
          <span className="text-amber-300 text-xs font-bold">Ouro {hero.gold}</span>
          {!user && (
            <Link href="/login" className="text-amber-200 text-xs hover:text-amber-100">Entrar</Link>
          )}
          {user && (
            <button onClick={logout} className="text-amber-100/40 text-xs hover:text-amber-100/70">Sair</button>
          )}
          {isElectron && (
            <button
              onClick={handleClose}
              className="w-5 h-5 rounded-full bg-amber-100/10 hover:bg-red-700/70 flex items-center justify-center text-amber-100/50 hover:text-amber-50 text-xs transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {showNotifications && notifications.length > 0 && (
        <div className="absolute top-10 right-3 z-50 flex flex-col gap-1 pointer-events-none">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`
                text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg
                ${n.type === 'xp' ? 'bg-blue-900/80 text-blue-100 border border-blue-300/20' :
                  n.type === 'gold' ? 'bg-amber-900/80 text-amber-100 border border-amber-300/20' :
                  n.type === 'levelup' ? 'bg-emerald-900/80 text-emerald-100 border border-emerald-300/20' :
                  n.type === 'item' ? 'bg-stone-800/90 text-stone-100 border border-stone-300/20' :
                  n.type === 'defeat' ? 'bg-red-900/85 text-red-100 border border-red-300/20' :
                  'bg-stone-700/90 text-stone-50'}
              `}
            >
              {n.message}
            </div>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="h-full">
          {activeTab === 'battle'    && <BattleScreen />}
          {activeTab === 'stats'     && <HeroStats />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'profile'   && <Profile />}
          {activeTab === 'zones' && (
            <div className="flex flex-col gap-4 h-full overflow-y-auto">
              <ZoneSelector />
              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <Link href="/rankings" className="text-center py-2 rounded-lg text-xs text-amber-200/70 hover:text-amber-200 hover:bg-amber-900/20 transition-colors">
                  Ver Tabela de Heróis
                </Link>
                <Link href="/shop" className="text-center py-2 rounded-lg text-xs text-amber-300/70 hover:text-amber-300 hover:bg-amber-950/30 transition-colors">
                  Mercado de Itens
                </Link>
                <Link href="/loja" className="text-center py-2 rounded-lg text-xs text-amber-300/70 hover:text-amber-300 hover:bg-amber-950/30 transition-colors">
                  ⚒️ Loja do Ferreiro
                </Link>
                <Link href="/forja" className="text-center py-2 rounded-lg text-xs text-amber-400/70 hover:text-amber-400 hover:bg-amber-950/30 transition-colors">
                  🔨 Forja de Aprimoramento
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Tem certeza? O progresso local será perdido!')) resetGame()
                  }}
                  className="py-2 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  Resetar Jogo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex border-t border-amber-900/40 bg-[#1a140f]/85">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-colors
              ${activeTab === tab.id ? 'text-amber-100' : 'text-amber-100/40 hover:text-amber-100/70'}
            `}
          >
            <span className="text-[10px] leading-none tracking-widest">{tab.sigil}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
