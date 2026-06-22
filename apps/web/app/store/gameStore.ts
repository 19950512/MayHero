'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Hero, BattleState, Equipment } from '../game/types'
import { ZONES } from '../game/data'
import {
  createHero,
  pickEnemy,
  simulateBattleTick,
  applyVictory,
  applyDefeat,
  equipItem,
  computeStats,
  healHero,
  allocateSkillPoint,
} from '../game/engine'
import type { SkillAllocStat } from '../game/types'

interface Notification {
  id: string
  message: string
  type: 'xp' | 'gold' | 'levelup' | 'item' | 'defeat' | 'info'
}

interface GameState {
  hero: Hero | null
  battle: BattleState
  currentZone: number
  inventory: Equipment[]
  notifications: Notification[]
  autoFight: boolean
  gameStarted: boolean
  killsInZone: number

  // Actions
  startGame: (name: string, heroClass: Hero['class']) => void
  tick: () => void
  toggleAutoFight: () => void
  changeZone: (zoneId: number) => void
  equipItemFromInventory: (item: Equipment) => void
  dismissNotification: (id: string) => void
  resetGame: () => void
  usePotion: () => void
  spendSkillPoint: (stat: SkillAllocStat) => void
}

const IDLE_BATTLE_STATE: BattleState = {
  active: false,
  enemy: null,
  enemyCurrentHp: 0,
  turn: 0,
  logs: [],
  phase: 'idle',
  lastTickAt: 0,
}

const MAX_LOGS = 12
const TICK_INTERVAL_MS = 1500

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      hero: null,
      battle: IDLE_BATTLE_STATE,
      currentZone: 1,
      inventory: [],
      notifications: [],
      autoFight: true,
      gameStarted: false,
      killsInZone: 0,

      startGame: (name, heroClass) => {
        const hero = createHero(name, heroClass)
        set({
          hero,
          gameStarted: true,
          battle: IDLE_BATTLE_STATE,
          currentZone: 1,
          killsInZone: 0,
          inventory: [],
          notifications: [],
        })
      },

      tick: () => {
        const { hero, battle, currentZone, autoFight, killsInZone } = get()
        if (!hero || !autoFight) return

        const now = Date.now()
        if (now - battle.lastTickAt < TICK_INTERVAL_MS) return

        // Start new fight if idle
        if (battle.phase === 'idle' || battle.phase === 'victory' || battle.phase === 'defeat') {
          if (battle.phase === 'defeat') {
            const healed = applyDefeat(hero)
            const enemy = pickEnemy(currentZone, killsInZone)
            set({
              hero: healed,
              battle: {
                active: true,
                enemy,
                enemyCurrentHp: enemy.stats.maxHp,
                turn: 0,
                logs: [{ id: 'start', turn: 0, actor: 'hero', message: `Você enfrenta ${enemy.name}!` }],
                phase: 'fighting',
                lastTickAt: now,
              },
            })
            return
          }

          const enemy = pickEnemy(currentZone, killsInZone)
          set(() => ({
            battle: {
              active: true,
              enemy,
              enemyCurrentHp: enemy.stats.maxHp,
              turn: 0,
              logs: [{ id: 'start', turn: 0, actor: 'hero', message: `${enemy.isBoss ? '⚠️ CHEFE! ' : ''}Você enfrenta ${enemy.name}!` }],
              phase: 'fighting',
              lastTickAt: now,
            },
          }))
          return
        }

        // Continue fight
        if (battle.phase === 'fighting' && battle.enemy) {
          const result = simulateBattleTick(hero, battle, hero.stats.hp)
          const newLogs = [...battle.logs, ...result.logs].slice(-MAX_LOGS)

          if (result.phase === 'victory') {
            const { hero: updatedHero, goldEarned, xpEarned, leveledUp, itemDrop } = applyVictory(hero, battle.enemy)
            const newNotifs: Notification[] = [
              { id: `xp-${now}`, message: `+${xpEarned} XP`, type: 'xp' },
              { id: `gold-${now}`, message: `+${goldEarned} ouro`, type: 'gold' },
            ]
            if (leveledUp) newNotifs.push({ id: `lvl-${now}`, message: `⬆️ Nível ${updatedHero.level}!`, type: 'levelup' })

            const newInventory = [...get().inventory]
            if (itemDrop) {
              newInventory.push(itemDrop)
              newNotifs.push({ id: `item-${now}`, message: `🎁 Drop: ${itemDrop.icon} ${itemDrop.name}`, type: 'item' })
            }

            set({
              hero: { ...updatedHero, stats: { ...updatedHero.stats, hp: result.heroHp } },
              battle: {
                ...battle,
                enemyCurrentHp: 0,
                turn: battle.turn + 1,
                logs: newLogs,
                phase: 'victory',
                lastTickAt: now,
              },
              killsInZone: killsInZone + 1,
              inventory: newInventory,
              notifications: [...get().notifications, ...newNotifs].slice(-5),
            })
          } else if (result.phase === 'defeat') {
            const newNotifs: Notification[] = [
              { id: `defeat-${now}`, message: `💀 Derrotado! -10% ouro`, type: 'defeat' },
            ]
            set({
              hero: { ...hero, stats: { ...hero.stats, hp: 0 } },
              battle: {
                ...battle,
                enemyCurrentHp: result.enemyHp,
                turn: battle.turn + 1,
                logs: newLogs,
                phase: 'defeat',
                lastTickAt: now,
              },
              notifications: [...get().notifications, ...newNotifs].slice(-5),
            })
          } else {
            set({
              hero: { ...hero, stats: { ...hero.stats, hp: result.heroHp } },
              battle: {
                ...battle,
                enemyCurrentHp: result.enemyHp,
                turn: battle.turn + 1,
                logs: newLogs,
                lastTickAt: now,
              },
            })
          }
        }
      },

      toggleAutoFight: () => set(s => ({ autoFight: !s.autoFight })),

      changeZone: (zoneId) => {
        const { hero } = get()
        const zone = ZONES.find(z => z.id === zoneId)
        if (!zone || !hero || hero.level < zone.minLevel) return
        set({ currentZone: zoneId, killsInZone: 0, battle: IDLE_BATTLE_STATE })
      },

      equipItemFromInventory: (item) => {
        const { hero, inventory } = get()
        if (!hero) return
        const updatedHero = equipItem(hero, item)
        const currentEquipped = hero.equipment[item.slot]
        const newInventory = inventory.filter(i => i.id !== item.id || i !== item)
        if (currentEquipped) newInventory.push(currentEquipped)
        set({ hero: updatedHero, inventory: newInventory })
      },

      dismissNotification: (id) =>
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

      usePotion: () => {
        const { hero } = get()
        if (!hero) return
        const potionCost = 10 + hero.level * 2
        if (hero.gold < potionCost) return
        const stats = computeStats(hero)
        const healAmt = Math.floor(stats.maxHp * 0.4)
        const healed = healHero(hero, healAmt)
        set({ hero: { ...healed, gold: healed.gold - potionCost } })
      },

      spendSkillPoint: (stat) => {
        const { hero } = get()
        if (!hero) return
        const updated = allocateSkillPoint(hero, stat)
        if (updated) set({ hero: updated })
      },

      resetGame: () =>
        set({
          hero: null,
          battle: IDLE_BATTLE_STATE,
          currentZone: 1,
          inventory: [],
          notifications: [],
          autoFight: true,
          gameStarted: false,
          killsInZone: 0,
        }),
    }),
    {
      name: 'mayhero-save',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hero: state.hero,
        currentZone: state.currentZone,
        inventory: state.inventory,
        gameStarted: state.gameStarted,
        killsInZone: state.killsInZone,
        autoFight: state.autoFight,
      }),
    }
  )
)
