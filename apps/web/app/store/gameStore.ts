'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Hero, BattleState, Equipment } from '../game/types'
import { DUNGEON_BY_ID, MONSTER_BY_ID } from '../game/data'
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
import { NPC_BY_ID } from '../game/npcs'
import { ITEM_BY_ID } from '../game/items'
import type { EquipmentItemDefinition } from '../game/types'

interface Notification {
  id: string
  message: string
  type: 'xp' | 'gold' | 'levelup' | 'item' | 'defeat' | 'info'
}

interface ServerInventoryItem {
  id: string
  itemData: Record<string, unknown>
  listing?: { soldAt: string | null } | null
}

interface ServerHeroPayload {
  name: string
  class: string
  level: number
  xp: number
  xpToNext: number
  gold: number
  totalKills: number
  skillPoints: number
  currentZone: number
  statsJson: Record<string, unknown>
  baseStatsJson: Record<string, unknown>
  equipJson: Record<string, unknown>
  inventory?: ServerInventoryItem[]
}

interface GameState {
  hero: Hero | null
  heroMessage: string
  battle: BattleState
  currentDungeon: string
  inventory: Equipment[]
  stackableInventory: Record<string, number>
  npcPurchased: Record<string, Record<string, number>>
  notifications: Notification[]
  autoFight: boolean
  serverAuthoritativeRewards: boolean
  battleEncounterId: string | null
  gameStarted: boolean
  killsInZone: number

  // Actions
  hydrateHeroFromServer: (data: ServerHeroPayload) => void
  startGame: (name: string, heroClass: Hero['class']) => void
  tick: () => void
  toggleAutoFight: () => void
  changeDungeon: (dungeonId: string) => void
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
  buyFromNpc: (npcId: string, itemId: string, quantity: number) => { ok: boolean; error?: string }
  sellToNpc: (npcId: string, itemId: string, quantity: number) => { ok: boolean; error?: string }
  applyNpcEquipmentSell: (inventoryItemIds: string[], newGold: number) => void
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
      currentDungeon: 'floresta_santa_rita',
      inventory: [],
      stackableInventory: {},
      npcPurchased: {},
      notifications: [],
      autoFight: true,
      serverAuthoritativeRewards: false,
      battleEncounterId: null,
      gameStarted: false,
      killsInZone: 0,

      hydrateHeroFromServer: (data) => {
        const DUNGEON_IDS_BY_ZONE: Record<number, string> = {
          1: 'floresta_santa_rita',
          2: 'cavernas_sombrias',
          3: 'planicie_esquecida',
          4: 'torre_magica',
          5: 'abismo_eterno',
        }
        const dungeonId = DUNGEON_IDS_BY_ZONE[data.currentZone] ?? 'floresta_santa_rita'
        const stats = data.statsJson as unknown as Hero['stats']
        const baseStats = data.baseStatsJson as unknown as Hero['baseStats']
        const equipRaw = data.equipJson as Record<string, unknown>
        const equipment: Hero['equipment'] = {
          weapon: equipRaw.weapon as Hero['equipment']['weapon'],
          armor: equipRaw.armor as Hero['equipment']['armor'],
          helm: equipRaw.helm as Hero['equipment']['helm'],
          ring: equipRaw.ring as Hero['equipment']['ring'],
        }
        const EMPTY_LOADOUT = {
          accessories: { amulet: undefined, ring1: undefined, ring2: undefined, ring3: undefined, ring4: undefined, cornalina1: undefined, cornalina2: undefined, talisma1: undefined, talisma2: undefined, belt: undefined, earring1: undefined, earring2: undefined },
          equipment: { head: undefined, body: undefined, legs: undefined, boots: undefined, offhand: undefined, mainhand: undefined },
          pets: { pet1: undefined, pet2: undefined },
        }

        const nextState: Partial<GameState> = {
          hero: {
            name: data.name,
            class: data.class as Hero['class'],
            level: data.level,
            xp: data.xp,
            xpToNext: data.xpToNext,
            gold: data.gold,
            totalKills: data.totalKills,
            skillPoints: data.skillPoints,
            stats,
            baseStats,
            equipment,
            loadout: EMPTY_LOADOUT,
            skillAllocations: { atk: 0, def: 0, maxHp: 0, spd: 0 },
          },
          gameStarted: true,
          currentDungeon: dungeonId,
          battle: IDLE_BATTLE_STATE,
          notifications: [],
          battleEncounterId: null,
        }

        if (data.inventory) {
          // Collect equipped inventoryItemIds (new-style) and equipped type counts (legacy fallback)
          const equippedIds = new Set<string>()
          const equippedTypeCounts: Record<string, number> = {}
          for (const slot of Object.values(equipRaw)) {
            if (slot && typeof slot === 'object') {
              const s = slot as Record<string, unknown>
              if (typeof s.inventoryItemId === 'string') {
                equippedIds.add(s.inventoryItemId)
              } else if (typeof s.id === 'string') {
                const key = `${s.id}:${s.enhancement ?? 0}`
                equippedTypeCounts[key] = (equippedTypeCounts[key] ?? 0) + 1
              }
            }
          }
          const remainingCounts = { ...equippedTypeCounts }

          const newInventory: Equipment[] = []
          for (const invItem of data.inventory) {
            const raw = invItem.itemData
            if (
              typeof raw.id !== 'string' || typeof raw.name !== 'string' ||
              typeof raw.slot !== 'string' || typeof raw.rarity !== 'string' ||
              typeof raw.icon !== 'string' || typeof raw.requiredLevel !== 'number' ||
              !raw.bonuses || typeof raw.bonuses !== 'object'
            ) continue
            if (!['weapon', 'armor', 'helm', 'ring'].includes(raw.slot as string)) continue

            // Skip items on active market listings
            if (invItem.listing && invItem.listing.soldAt === null) continue

            if (equippedIds.has(invItem.id)) continue

            const key = `${raw.id}:${raw.enhancement ?? 0}`
            if (remainingCounts[key] > 0) { remainingCounts[key]--; continue }

            newInventory.push({
              id: raw.id as string,
              inventoryItemId: invItem.id,
              name: raw.name as string,
              slot: raw.slot as Equipment['slot'],
              rarity: raw.rarity as Equipment['rarity'],
              bonuses: raw.bonuses as Equipment['bonuses'],
              icon: raw.icon as string,
              requiredLevel: raw.requiredLevel as number,
              enhancement: typeof raw.enhancement === 'number' ? raw.enhancement : undefined,
            })
          }
          nextState.inventory = newInventory
        }

        set(nextState as GameState)
      },

      startGame: (name, heroClass) => {
        const hero = createHero(name, heroClass)
        set({
          hero,
          heroMessage: '',
          gameStarted: true,
          battle: IDLE_BATTLE_STATE,
          currentDungeon: 'floresta_santa_rita',
          killsInZone: 0,
          inventory: [],
          stackableInventory: {},
          notifications: [],
          serverAuthoritativeRewards: false,
          battleEncounterId: null,
        })
      },

      tick: () => {
        const { hero, battle, currentDungeon, autoFight, killsInZone } = get()
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
            const enemy = pickEnemy(currentDungeon, killsInZone)
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

          const enemy = pickEnemy(currentDungeon, killsInZone)
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

      changeDungeon: (dungeonId) => {
        const { hero } = get()
        const dungeon = DUNGEON_BY_ID[dungeonId]
        if (!dungeon || !hero || hero.level < dungeon.minLevel) return
        set({ currentDungeon: dungeonId, killsInZone: 0, battle: IDLE_BATTLE_STATE, battleEncounterId: null })
      },

      equipItemFromInventory: (item) => {
        const { hero, inventory } = get()
        if (!hero) return
        const { hero: updatedHero, replacedItem } = equipItem(hero, item)
        // Prefer UUID match; fall back to type+slot+rarity+enhancement for legacy items
        const matchIdx = item.inventoryItemId
          ? inventory.findIndex(i => i.inventoryItemId === item.inventoryItemId)
          : inventory.findIndex(i =>
              i.id === item.id && i.slot === item.slot &&
              i.rarity === item.rarity && i.name === item.name &&
              (i.enhancement ?? 0) === (item.enhancement ?? 0)
            )
        const newInventory = matchIdx !== -1
          ? [...inventory.slice(0, matchIdx), ...inventory.slice(matchIdx + 1)]
          : [...inventory]
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

      buyFromNpc: (npcId, itemId, quantity) => {
        const { hero, stackableInventory, inventory, npcPurchased } = get()
        if (!hero) return { ok: false, error: 'Sem herói ativo.' }

        const npc = NPC_BY_ID[npcId]
        if (!npc) return { ok: false, error: 'NPC não encontrado.' }

        const entry = npc.sells.find(e => e.itemId === itemId)
        if (!entry) return { ok: false, error: 'Item não disponível.' }

        const alreadyBought = npcPurchased[npcId]?.[itemId] ?? 0
        const remaining = entry.quantity - alreadyBought
        if (quantity > remaining) return { ok: false, error: `Estoque insuficiente. Disponível: ${remaining}` }

        const totalCost = entry.price * quantity
        if (hero.gold < totalCost) return { ok: false, error: 'Ouro insuficiente.' }

        const itemDef = ITEM_BY_ID[itemId]
        if (!itemDef) return { ok: false, error: 'Item não encontrado no catálogo.' }

        const newNpcPurchased = {
          ...npcPurchased,
          [npcId]: { ...(npcPurchased[npcId] ?? {}), [itemId]: alreadyBought + quantity },
        }

        if (itemDef.stackable) {
          const newStackable = { ...stackableInventory }
          newStackable[itemId] = (newStackable[itemId] ?? 0) + quantity
          set({ hero: { ...hero, gold: hero.gold - totalCost }, stackableInventory: newStackable, npcPurchased: newNpcPurchased })
        } else {
          const eq = itemDef as EquipmentItemDefinition
          const newItems: Equipment[] = Array.from({ length: quantity }, () => ({
            id: eq.id, name: eq.name, slot: eq.slot, rarity: eq.rarity,
            bonuses: eq.bonuses, icon: eq.icon, requiredLevel: eq.requiredLevel,
          }))
          set({ hero: { ...hero, gold: hero.gold - totalCost }, inventory: [...inventory, ...newItems], npcPurchased: newNpcPurchased })
        }
        return { ok: true }
      },

      sellToNpc: (npcId, itemId, quantity) => {
        const { hero, stackableInventory, inventory } = get()
        if (!hero) return { ok: false, error: 'Sem herói ativo.' }

        const npc = NPC_BY_ID[npcId]
        if (!npc) return { ok: false, error: 'NPC não encontrado.' }

        const entry = npc.buys.find(e => e.itemId === itemId)
        if (!entry) return { ok: false, error: 'NPC não compra este item.' }

        const itemDef = ITEM_BY_ID[itemId]
        const totalEarned = entry.price * quantity

        if (itemDef?.stackable !== false) {
          const owned = stackableInventory[itemId] ?? 0
          if (owned < quantity) return { ok: false, error: `Você possui apenas ${owned}.` }
          const newStackable = { ...stackableInventory }
          const remaining = owned - quantity
          if (remaining <= 0) delete newStackable[itemId]
          else newStackable[itemId] = remaining
          set({ hero: { ...hero, gold: hero.gold + totalEarned }, stackableInventory: newStackable })
        } else {
          const owned = inventory.filter(i => i.id === itemId).length
          if (owned < quantity) return { ok: false, error: `Você possui apenas ${owned}.` }
          let removed = 0
          const newInventory = inventory.filter(i => {
            if (i.id === itemId && removed < quantity) { removed++; return false }
            return true
          })
          set({ hero: { ...hero, gold: hero.gold + totalEarned }, inventory: newInventory })
        }
        return { ok: true }
      },

      applyNpcEquipmentSell: (inventoryItemIds, newGold) => {
        const { hero, inventory } = get()
        if (!hero) return
        const toRemove = new Set(inventoryItemIds)
        const newInventory = inventory.filter(i => !i.inventoryItemId || !toRemove.has(i.inventoryItemId))
        set({ hero: { ...hero, gold: newGold }, inventory: newInventory })
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
          currentDungeon: 'floresta_santa_rita',
          inventory: [],
          stackableInventory: {},
          npcPurchased: {},
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
        currentDungeon: state.currentDungeon,
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
