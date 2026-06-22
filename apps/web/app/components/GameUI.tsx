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

type Tab = 'battle' | 'stats' | 'inventory' | 'zones'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'battle', label: 'Batalha', icon: '⚔️' },
  { id: 'stats', label: 'Herói', icon: '🧙' },
  { id: 'inventory', label: 'Bolsa', icon: '🎒' },
  { id: 'zones', label: 'Zonas', icon: '🗺️' },
]

const SYNC_INTERVAL_MS = 30_000

export function GameUI() {
  const [activeTab, setActiveTab] = useState<Tab>('battle')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')
  const { hero, tick, notifications, dismissNotification, resetGame, inventory, currentZone, killsInZone } = useGameStore()
  const { user, logout } = useAuthStore()
  const lastSyncRef = useRef<number>(0)

  const runTick = useCallback(() => { tick() }, [tick])
  useEffect(() => {
    const interval = setInterval(runTick, 500)
    return () => clearInterval(interval)
  }, [runTick])

  // Auto-dismiss notifications
  useEffect(() => {
    if (notifications.length === 0) return
    const t = setTimeout(() => dismissNotification(notifications[0].id), 3000)
    return () => clearTimeout(t)
  }, [notifications, dismissNotification])

  // Auto-sync to API
  useEffect(() => {
    if (!hero || !user) return
    const now = Date.now()
    if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return

    const syncData = {
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
      inventory,
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
  }, [killsInZone, hero, user, inventory, currentZone])

  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron
  const handleClose = () => {
    if (isElectron) (window as any).electronAPI.closeWindow()
  }

  if (!hero) return null

  return (
    <div className="flex flex-col h-screen bg-slate-950 select-none overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-white/5 drag-region shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-xs font-bold tracking-widest">⚔️ MAY HERO</span>
          {user && (
            <span className="text-white/20 text-xs">@{user.username}</span>
          )}
        </div>
        <div className="flex items-center gap-2 no-drag">
          {/* Sync indicator */}
          {user && (
            <span className={`text-xs ${syncStatus === 'syncing' ? 'text-blue-400' : syncStatus === 'ok' ? 'text-green-400' : syncStatus === 'error' ? 'text-red-400' : 'text-white/20'}`}>
              {syncStatus === 'syncing' ? '↻' : syncStatus === 'ok' ? '✓' : syncStatus === 'error' ? '✗' : '●'}
            </span>
          )}
          <span className="text-yellow-400 text-xs font-bold">🪙 {hero.gold}</span>
          {!user && (
            <Link href="/login" className="text-indigo-400 text-xs hover:text-indigo-300">Entrar</Link>
          )}
          {user && (
            <button onClick={logout} className="text-white/20 text-xs hover:text-white/50">Sair</button>
          )}
          {isElectron && (
            <button
              onClick={handleClose}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center text-white/50 hover:text-white text-xs transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="absolute top-10 right-3 z-50 flex flex-col gap-1 pointer-events-none">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`
                text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg
                ${n.type === 'xp' ? 'bg-blue-700/90 text-blue-100' :
                  n.type === 'gold' ? 'bg-yellow-700/90 text-yellow-100' :
                  n.type === 'levelup' ? 'bg-purple-700/90 text-purple-100' :
                  n.type === 'item' ? 'bg-indigo-700/90 text-indigo-100' :
                  n.type === 'defeat' ? 'bg-red-800/90 text-red-100' :
                  'bg-slate-700/90 text-white'}
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
          {activeTab === 'battle' && <BattleScreen />}
          {activeTab === 'stats' && <HeroStats />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'zones' && (
            <div className="flex flex-col gap-4 h-full overflow-y-auto">
              <ZoneSelector />
              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <Link href="/rankings" className="text-center py-2 rounded-lg text-xs text-indigo-400/70 hover:text-indigo-400 hover:bg-indigo-900/20 transition-colors">
                  🏆 Ver Rankings Online
                </Link>
                <Link href="/shop" className="text-center py-2 rounded-lg text-xs text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-900/20 transition-colors">
                  🛒 Mercado de Itens
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
      <div className="shrink-0 flex border-t border-white/5 bg-slate-900/80">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-colors
              ${activeTab === tab.id ? 'text-white' : 'text-white/30 hover:text-white/60'}
            `}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
