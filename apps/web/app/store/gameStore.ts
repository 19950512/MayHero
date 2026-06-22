'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Hero, BattleState, Equipment } from '../game/types'
import { ZONES, MONSTER_BY_ID } from '../game/data'
import {
  createHero,
  pickEnemy,
  simulateBattleTick,
  applyVictory,
  applyDefeat,
  equipItem,
  unequipItem as engineUnequipItem,
  computeStats,
  healHero,
  allocateSkillPoint,
} from '../game/engine'
import type { SkillAllocStat } from '../game/types'
import { attemptEnhancement, NPC_STORE } from '../game/enhancement'
import type { EnhancementResult } from '../game/enhancement'

interface Notification {
  id: string
  message: string
  type: 'xp' | 'gold' | 'levelup' | 'item' | 'defeat' | 'info'
}

interface GameState {
  hero: Hero | null
  heroMessage: string
  battle: BattleState
  currentZone: number
  inventory: Equipment[]
  stackableInventory: Record<string, number>
  notifications: Notification[]
  autoFight: boolean
  serverAuthoritativeRewards: boolean
  battleEncounterId: string | null
  gameStarted: boolean
  killsInZone: number

  // Actions
  startGame: (name: string, heroClass: Hero['class']) => void
  tick: () => void
  toggleAutoFight: () => void
  changeZone: (zoneId: number) => void
  equipItemFromInventory: (item: Equipment) => void
  unequipItem: (item: Equipment) => void
  addInventoryItem: (item: Equipment) => void
  replaceInventory: (items: Equipment[]) => void
  dismissNotification: (id: string) => void
  resetGame: () => void
  usePotion: () => void
  spendSkillPoint: (stat: SkillAllocStat) => void
  renameHero: (newName: string) => void
  setHeroMessage: (message: string) => void
  setServerAuthoritativeRewards: (enabled: boolean) => void
  enhanceInventoryItem: (item: Equipment, coreId: string) => EnhancementResult | null
  buyFromNpcStore: (itemId: string, quantity: number) => { ok: boolean; error?: string }
  startServerEncounter: (payload: { encounterId: string; enemyId: string }) => void
  applyServerVictoryResolution: (payload: {
    hero: {
      level: number
      xp: number
      xpToNext: number
      gold: number
      totalKills: number
      skillPoints: number
      stats: Hero['stats']
      baseStats: Hero['baseStats']
    }
    rewards: {
      xpEarned: number
      goldEarned: number
      leveledUp: boolean
      itemDrop?: Equipment
      stackableDrops: Array<{ itemId: string; name: string; quantity: number }>
    }
    serverState: {
      killsInZone: number
    }
  }) => void
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
      heroMessage: '',
      battle: IDLE_BATTLE_STATE,
      currentZone: 1,
      inventory: [],
      stackableInventory: {},
      notifications: [],
      autoFight: true,
      serverAuthoritativeRewards: false,
      battleEncounterId: null,
      gameStarted: false,
      killsInZone: 0,

      startGame: (name, heroClass) => {
        const hero = createHero(name, heroClass)
        set({
          hero,
          heroMessage: '',
          gameStarted: true,
          battle: IDLE_BATTLE_STATE,
          currentZone: 1,
          killsInZone: 0,
          inventory: [],
          stackableInventory: {},
          notifications: [],
          serverAuthoritativeRewards: false,
          battleEncounterId: null,
        })
      },

      tick: () => {
        const { hero, battle, currentZone, autoFight, killsInZone } = get()
        if (!hero || !autoFight) return

        const now = Date.now()
        if (now - battle.lastTickAt < TICK_INTERVAL_MS) return

        // Start new fight if idle
        if (battle.phase === 'idle' || battle.phase === 'victory' || battle.phase === 'defeat') {
          if (get().serverAuthoritativeRewards) {
            if (battle.phase === 'defeat') {
              const healed = applyDefeat(hero)
              set({
                hero: healed,
                battle: {
                  ...IDLE_BATTLE_STATE,
                  logs: [{ id: 'recover', turn: battle.turn, actor: 'hero', message: 'Você recua para se recuperar.' }],
                  lastTickAt: now,
                },
                battleEncounterId: null,
              })
            }
            return
          }

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
              logs: [{ id: 'start', turn: 0, actor: 'hero', message: `${enemy.isBoss ? 'CHEFE! ' : ''}Você enfrenta ${enemy.name}!` }],
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
            if (get().serverAuthoritativeRewards) {
              set({
                hero: { ...hero, stats: { ...hero.stats, hp: result.heroHp } },
                battle: {
                  ...battle,
                  enemyCurrentHp: 0,
                  turn: battle.turn + 1,
                  logs: newLogs,
                  phase: 'victory',
                  lastTickAt: now,
                },
              })
              return
            }

            const { hero: updatedHero, goldEarned, xpEarned, leveledUp, itemDrop, stackableDrops } = applyVictory(hero, battle.enemy)
            const newNotifs: Notification[] = [
              { id: `xp-${now}`, message: `+${xpEarned} XP`, type: 'xp' },
              { id: `gold-${now}`, message: `+${goldEarned} ouro`, type: 'gold' },
            ]
            if (leveledUp) newNotifs.push({ id: `lvl-${now}`, message: `Nível ${updatedHero.level}!`, type: 'levelup' })

            const newInventory = [...get().inventory]
            const newStackableInventory = { ...get().stackableInventory }
            if (itemDrop) {
              newInventory.push(itemDrop)
              newNotifs.push({ id: `item-${now}`, message: `Drop: ${itemDrop.name}`, type: 'item' })
            }

            for (const stackDrop of stackableDrops) {
              newStackableInventory[stackDrop.itemId] = (newStackableInventory[stackDrop.itemId] ?? 0) + stackDrop.quantity
              newNotifs.push({
                id: `item-${now}-${stackDrop.itemId}`,
                message: `Drop: ${stackDrop.name} x${stackDrop.quantity}`,
                type: 'item',
              })
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
              stackableInventory: newStackableInventory,
              notifications: [...get().notifications, ...newNotifs].slice(-5),
            })
          } else if (result.phase === 'defeat') {
            const newNotifs: Notification[] = [
              { id: `defeat-${now}`, message: `Derrotado! -10% ouro`, type: 'defeat' },
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
        set({ currentZone: zoneId, killsInZone: 0, battle: IDLE_BATTLE_STATE, battleEncounterId: null })
      },

      equipItemFromInventory: (item) => {
        const { hero, inventory } = get()
        if (!hero) return
        const { hero: updatedHero, replacedItem } = equipItem(hero, item)
        const newInventory = inventory.filter(i => !(
          i.id === item.id && i.slot === item.slot &&
          i.rarity === item.rarity && i.name === item.name &&
          (i.enhancement ?? 0) === (item.enhancement ?? 0)
        ))
        if (replacedItem) newInventory.push(replacedItem)
        set({ hero: updatedHero, inventory: newInventory })
      },

      unequipItem: (item) => {
        const { hero, inventory } = get()
        if (!hero) return
        const result = engineUnequipItem(hero, item)
        if (!result) return
        set({ hero: result.hero, inventory: [...inventory, item] })
      },

      addInventoryItem: (item) => {
        const { inventory } = get()
        set({ inventory: [...inventory, item] })
      },

      replaceInventory: (items) => {
        set({ inventory: items })
      },

      dismissNotification: (id) =>
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

      usePotion: () => {
        const { hero, stackableInventory } = get()
        if (!hero) return
        const potionCount = stackableInventory.healing_potion ?? 0
        if (potionCount <= 0) return

        const stats = computeStats(hero)
        if (hero.stats.hp >= stats.maxHp) return

        const healAmt = Math.floor(stats.maxHp * 0.4)
        const healed = healHero(hero, healAmt)
        const newStackableInventory = { ...stackableInventory }
        const remaining = potionCount - 1
        if (remaining <= 0) delete newStackableInventory.healing_potion
        else newStackableInventory.healing_potion = remaining

        set({ hero: healed, stackableInventory: newStackableInventory })
      },

      enhanceInventoryItem: (item, coreId) => {
        const { hero, inventory, stackableInventory } = get()
        if (!hero) return null

        const coreCount = stackableInventory[coreId] ?? 0
        if (coreCount <= 0) return null

        const result = attemptEnhancement(item, coreId)
        if (result.message === 'Núcleo inválido.' || result.message.startsWith('Este núcleo')) return result

        // Find by structural equality — reference equality fails after re-renders/re-hydration
        const itemIdx = inventory.findIndex(i =>
          i.id === item.id &&
          i.slot === item.slot &&
          i.rarity === item.rarity &&
          i.name === item.name &&
          (i.enhancement ?? 0) === (item.enhancement ?? 0)
        )
        if (itemIdx === -1) return null

        const newStackable = { ...stackableInventory }
        const remaining = coreCount - 1
        if (remaining <= 0) delete newStackable[coreId]
        else newStackable[coreId] = remaining

        const newInventory = [...inventory]
        newInventory[itemIdx] = result.newItem
        set({ inventory: newInventory, stackableInventory: newStackable })
        return result
      },

      buyFromNpcStore: (itemId, quantity) => {
        const { hero } = get()
        if (!hero) return { ok: false, error: 'Sem herói ativo.' }

        const entry = NPC_STORE.find(e => e.itemId === itemId)
        if (!entry) return { ok: false, error: 'Item não encontrado na loja.' }

        const totalCost = entry.price * quantity
        if (hero.gold < totalCost) return { ok: false, error: 'Ouro insuficiente.' }

        const newStackable = { ...get().stackableInventory }
        newStackable[itemId] = (newStackable[itemId] ?? 0) + quantity

        set({
          hero: { ...hero, gold: hero.gold - totalCost },
          stackableInventory: newStackable,
        })
        return { ok: true }
      },

      spendSkillPoint: (stat) => {
        const { hero } = get()
        if (!hero) return
        const updated = allocateSkillPoint(hero, stat)
        if (updated) set({ hero: updated })
      },

      renameHero: (newName) => {
        const { hero } = get()
        if (!hero) return
        set({ hero: { ...hero, name: newName.trim() } })
      },

      setHeroMessage: (message) => {
        const normalized = message.slice(0, 180)
        set({ heroMessage: normalized })
      },

      setServerAuthoritativeRewards: (enabled) => {
        set({ serverAuthoritativeRewards: enabled, battleEncounterId: null })
      },

      startServerEncounter: ({ encounterId, enemyId }) => {
        const enemy = MONSTER_BY_ID[enemyId]
        if (!enemy) return
        const now = Date.now()
        set({
          battle: {
            active: true,
            enemy: { ...enemy },
            enemyCurrentHp: enemy.stats.maxHp,
            turn: 0,
            logs: [{ id: `start-${encounterId}`, turn: 0, actor: 'hero', message: `${enemy.isBoss ? 'CHEFE! ' : ''}Você enfrenta ${enemy.name}!` }],
            phase: 'fighting',
            lastTickAt: now,
          },
          battleEncounterId: encounterId,
        })
      },

      applyServerVictoryResolution: (payload) => {
        const { hero, inventory, stackableInventory, notifications } = get()
        if (!hero) return

        const now = Date.now()
        const newInventory = [...inventory]
        const newStackableInventory = { ...stackableInventory }
        const newNotifs: Notification[] = [
          { id: `xp-${now}`, message: `+${payload.rewards.xpEarned} XP`, type: 'xp' },
          { id: `gold-${now}`, message: `+${payload.rewards.goldEarned} ouro`, type: 'gold' },
        ]

        if (payload.rewards.leveledUp) {
          newNotifs.push({ id: `lvl-${now}`, message: `Nível ${payload.hero.level}!`, type: 'levelup' })
        }

        if (payload.rewards.itemDrop) {
          newInventory.push(payload.rewards.itemDrop)
          newNotifs.push({ id: `item-eq-${now}`, message: `Drop: ${payload.rewards.itemDrop.name}`, type: 'item' })
        }

        for (const stackDrop of payload.rewards.stackableDrops) {
          newStackableInventory[stackDrop.itemId] = (newStackableInventory[stackDrop.itemId] ?? 0) + stackDrop.quantity
          newNotifs.push({ id: `item-${now}-${stackDrop.itemId}`, message: `Drop: ${stackDrop.name} x${stackDrop.quantity}`, type: 'item' })
        }

        const alloc = hero.skillAllocations ?? { atk: 0, def: 0, maxHp: 0, spd: 0 }
        const allocatedPoints = alloc.atk + alloc.def + alloc.maxHp + alloc.spd
        const levelsGained = Math.max(0, payload.hero.level - hero.level)
        const maxSpendableAtLevel = Math.max(0, payload.hero.level - 1)
        const remainingAfterAlloc = Math.max(0, maxSpendableAtLevel - allocatedPoints)
        const nextSkillPoints = Math.min(hero.skillPoints + levelsGained, remainingAfterAlloc)

        set({
          hero: {
            ...hero,
            level: payload.hero.level,
            xp: payload.hero.xp,
            xpToNext: payload.hero.xpToNext,
            gold: payload.hero.gold,
            totalKills: payload.hero.totalKills,
            skillPoints: nextSkillPoints,
            stats: payload.hero.stats,
            baseStats: payload.hero.baseStats,
          },
          killsInZone: payload.serverState.killsInZone,
          battleEncounterId: null,
          inventory: newInventory,
          stackableInventory: newStackableInventory,
          notifications: [...notifications, ...newNotifs].slice(-5),
          battle: {
            ...IDLE_BATTLE_STATE,
            lastTickAt: now,
          },
        })
      },

      resetGame: () =>
        set({
          hero: null,
          heroMessage: '',
          battle: IDLE_BATTLE_STATE,
          currentZone: 1,
          inventory: [],
          stackableInventory: {},
          notifications: [],
          autoFight: true,
          serverAuthoritativeRewards: false,
          battleEncounterId: null,
          gameStarted: false,
          killsInZone: 0,
        }),
    }),
    {
      name: 'mayhero-save',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hero: state.hero,
        heroMessage: state.heroMessage,
        currentZone: state.currentZone,
        inventory: state.inventory,
        stackableInventory: state.stackableInventory,
        gameStarted: state.gameStarted,
        killsInZone: state.killsInZone,
        autoFight: state.autoFight,
        serverAuthoritativeRewards: state.serverAuthoritativeRewards,
      }),
    }
  )
)
