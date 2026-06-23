import { MONSTERS as SHARED_MONSTERS, DUNGEONS, ITEMS } from '@mayhero/shared'
import type { MonsterDrop, EquipmentItemDefinition } from '@mayhero/shared'

type HeroClass = 'warrior' | 'archer' | 'mage' | 'knight' | 'paladin' | 'druid'

type Stats = {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  atk: number
  def: number
  spd: number
  crit: number
}

type EquipmentSlot = 'weapon' | 'armor' | 'helm' | 'ring'
type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

type EquipmentBonuses = Partial<{
  maxHp: number
  maxMp: number
  atk: number
  def: number
  spd: number
  crit: number
}>

export interface EquipmentItemData {
  id: string
  inventoryItemId?: string
  name: string
  slot: EquipmentSlot
  rarity: Rarity
  bonuses: EquipmentBonuses
  icon: string
  requiredLevel: number
  enhancement?: number
}

export const HERO_CLASSES: readonly HeroClass[] = ['warrior', 'archer', 'mage', 'knight', 'paladin', 'druid'] as const

export const BASE_STATS_BY_CLASS: Record<HeroClass, Stats> = {
  warrior: { hp: 120, maxHp: 120, mp: 30, maxMp: 30, atk: 12, def: 8, spd: 5, crit: 8 },
  archer: { hp: 90, maxHp: 90, mp: 50, maxMp: 50, atk: 15, def: 5, spd: 9, crit: 15 },
  mage: { hp: 70, maxHp: 70, mp: 100, maxMp: 100, atk: 18, def: 3, spd: 6, crit: 10 },
  knight: { hp: 145, maxHp: 145, mp: 20, maxMp: 20, atk: 10, def: 12, spd: 4, crit: 6 },
  paladin: { hp: 105, maxHp: 105, mp: 70, maxMp: 70, atk: 13, def: 9, spd: 6, crit: 9 },
  druid: { hp: 80, maxHp: 80, mp: 120, maxMp: 120, atk: 14, def: 5, spd: 7, crit: 12 },
}

export const LEVEL_STAT_GROWTH: Record<HeroClass, Partial<Stats>> = {
  warrior: { maxHp: 18, atk: 2.5, def: 1.5, spd: 0.3, crit: 0.2 },
  archer: { maxHp: 12, atk: 3.2, def: 1.0, spd: 0.5, crit: 0.4 },
  mage: { maxHp: 8, atk: 4.0, def: 0.8, spd: 0.3, crit: 0.3 },
  knight: { maxHp: 22, atk: 2.0, def: 2.0, spd: 0.2, crit: 0.1 },
  paladin: { maxHp: 16, atk: 2.8, def: 1.4, spd: 0.3, crit: 0.2 },
  druid: { maxHp: 10, atk: 3.5, def: 0.9, spd: 0.4, crit: 0.35 },
}

export const ZONE_MIN_LEVEL: Record<number, number> = {
  1: 1,
  2: 5,
  3: 10,
}

export const BOSS_EVERY = 10

export const EQUIPMENT_CATALOG: EquipmentItemData[] = (
  ITEMS.filter((item): item is EquipmentItemDefinition => item.category === 'equipment')
    .map(item => ({
      id: item.id,
      name: item.name,
      slot: item.slot as EquipmentSlot,
      rarity: item.rarity as Rarity,
      bonuses: item.bonuses as EquipmentBonuses,
      icon: item.icon,
      requiredLevel: item.requiredLevel,
    }))
)

const EQUIPMENT_BY_ID = new Map(EQUIPMENT_CATALOG.map(item => [item.id, item]))

export function xpCurve(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export function baseStatsForLevel(heroClass: HeroClass, level: number): Stats {
  const base = { ...BASE_STATS_BY_CLASS[heroClass] }
  const growth = LEVEL_STAT_GROWTH[heroClass]
  const lvl = Math.max(0, level - 1)

  base.maxHp = Math.floor(base.maxHp + (growth.maxHp ?? 0) * lvl)
  base.atk = Math.floor(base.atk + (growth.atk ?? 0) * lvl)
  base.def = Math.floor(base.def + (growth.def ?? 0) * lvl)
  base.spd = Math.floor(base.spd + (growth.spd ?? 0) * lvl)
  base.crit = Math.min(75, Math.floor(base.crit + (growth.crit ?? 0) * lvl))
  base.hp = base.maxHp
  base.mp = base.maxMp
  return base
}

type ItemCategory = 'equipment' | 'consumable' | 'currency' | 'material'

type CatalogItem = {
  id: string
  name: string
  icon: string
  rarity: Rarity
  category: ItemCategory
  stackable: boolean
  slot?: EquipmentSlot
  bonuses?: EquipmentBonuses
  requiredLevel?: number
}

// Server-side monster type: shared fields + zones derived from dungeon definitions
export type MonsterDefinition = {
  id: string
  zones: number[]
  isBoss: boolean
  xpReward: number
  goldReward: [number, number]
  drops: MonsterDrop[]
}

// Build zone assignments automatically from dungeon definitions — single source of truth
function buildZoneMap(): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>()
  for (const dungeon of DUNGEONS) {
    for (const monster of dungeon.monsters) {
      if (!map.has(monster.id)) map.set(monster.id, new Set())
      map.get(monster.id)!.add(dungeon.zoneId)
    }
  }
  return map
}

const ZONE_MAP = buildZoneMap()

export const MONSTERS: MonsterDefinition[] = SHARED_MONSTERS
  .filter(m => ZONE_MAP.has(m.id))
  .map(m => ({
    id: m.id,
    zones: Array.from(ZONE_MAP.get(m.id)!),
    isBoss: m.isBoss,
    xpReward: m.xpReward,
    goldReward: m.goldReward,
    drops: m.drops,
  }))

const MONSTER_BY_ID = new Map(MONSTERS.map(m => [m.id, m]))

export function getMonsterById(enemyId: string): MonsterDefinition | null {
  return MONSTER_BY_ID.get(enemyId) ?? null
}

const CATALOG_ITEMS: CatalogItem[] = ITEMS.map(item =>
  item.category === 'equipment'
    ? {
        id: item.id,
        name: item.name,
        icon: item.icon,
        rarity: item.rarity as Rarity,
        category: 'equipment' as const,
        stackable: false,
        slot: item.slot as EquipmentSlot,
        bonuses: item.bonuses as EquipmentBonuses,
        requiredLevel: item.requiredLevel,
      }
    : {
        id: item.id,
        name: item.name,
        icon: item.icon,
        rarity: item.rarity as Rarity,
        category: item.category as ItemCategory,
        stackable: true,
      }
)

const CATALOG_ITEM_BY_ID = new Map(CATALOG_ITEMS.map(item => [item.id, item]))

export function resolveMonsterDrops(enemyId: string): Array<{ item: CatalogItem; quantity: number }> {
  const monster = getMonsterById(enemyId)
  if (!monster) return []

  const drops: Array<{ item: CatalogItem; quantity: number }> = []
  for (const drop of monster.drops) {
    if (Math.random() > drop.chance) continue
    const item = CATALOG_ITEM_BY_ID.get(drop.itemId)
    if (!item) continue
    const minQ = drop.minQuantity ?? 1
    const maxQ = drop.maxQuantity ?? minQ
    const quantity = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ
    drops.push({ item, quantity })
  }

  return drops
}


export function normalizeEquipmentItemData(input: unknown): EquipmentItemData | null {
  if (!input || typeof input !== 'object') return null

  const data = input as Record<string, unknown>
  if (typeof data.id !== 'string') return null

  const canonical = EQUIPMENT_BY_ID.get(data.id)
  if (!canonical) return null

  // Only validate id (already done above) and enhancement level.
  // Cosmetic fields (name, icon, bonuses, slot, rarity) are always overwritten
  // by canonical values, so checking them would break syncs when the catalog
  // is updated (e.g. icons changed, sprites added).

  const enhancementRaw = data.enhancement
  const enhancement = enhancementRaw === undefined || enhancementRaw === null
    ? undefined
    : typeof enhancementRaw === 'number' && Number.isInteger(enhancementRaw) && enhancementRaw >= 0 && enhancementRaw <= 20
      ? enhancementRaw
      : null
  if (enhancement === null) return null

  const inventoryItemId = typeof data.inventoryItemId === 'string' ? data.inventoryItemId : undefined

  return {
    id: canonical.id,
    ...(inventoryItemId !== undefined ? { inventoryItemId } : {}),
    name: canonical.name,
    slot: canonical.slot,
    rarity: canonical.rarity,
    bonuses: { ...canonical.bonuses },
    icon: canonical.icon,
    requiredLevel: canonical.requiredLevel,
    ...(enhancement !== undefined ? { enhancement } : {}),
  }
}

export function sanitizeEquipmentRecord(input: unknown): {
  weapon?: EquipmentItemData
  armor?: EquipmentItemData
  helm?: EquipmentItemData
  ring?: EquipmentItemData
} | null {
  if (!input || typeof input !== 'object') return {}

  const raw = input as Record<string, unknown>
  const result: {
    weapon?: EquipmentItemData
    armor?: EquipmentItemData
    helm?: EquipmentItemData
    ring?: EquipmentItemData
  } = {}

  if (raw.weapon != null) {
    const parsed = normalizeEquipmentItemData(raw.weapon)
    if (!parsed || parsed.slot !== 'weapon') return null
    result.weapon = parsed
  }

  if (raw.armor != null) {
    const parsed = normalizeEquipmentItemData(raw.armor)
    if (!parsed || parsed.slot !== 'armor') return null
    result.armor = parsed
  }

  if (raw.helm != null) {
    const parsed = normalizeEquipmentItemData(raw.helm)
    if (!parsed || parsed.slot !== 'helm') return null
    result.helm = parsed
  }

  if (raw.ring != null) {
    const parsed = normalizeEquipmentItemData(raw.ring)
    if (!parsed || parsed.slot !== 'ring') return null
    result.ring = parsed
  }

  return result
}

export function sanitizeInventoryItems(input: unknown[]): EquipmentItemData[] | null {
  const sanitized: EquipmentItemData[] = []
  for (const item of input) {
    const parsed = normalizeEquipmentItemData(item)
    if (!parsed) return null
    sanitized.push(parsed)
  }
  return sanitized
}
