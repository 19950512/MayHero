export interface Stats {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  atk: number
  def: number
  spd: number
  crit: number
}

export interface MonsterDrop {
  itemId: string
  chance: number
  minQuantity?: number
  maxQuantity?: number
}

export interface Enemy {
  id: string
  name: string
  emoji: string
  sprite?: string
  stats: Stats
  xpReward: number
  goldReward: [number, number]
  isBoss: boolean
}

export interface MonsterDefinition extends Enemy {
  drops: MonsterDrop[]
}

export interface Dungeon {
  id: string
  name: string
  description: string
  lore?: string
  minLevel: number
  recommendedLevel: number
  bossEvery: number
  zoneId: number
  monsters: MonsterDefinition[]
}

export interface City {
  id: string
  name: string
  description: string
  dungeons: Dungeon[]
}

// ── Item types ────────────────────────────────────────────────────────────────

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type ItemCategory = 'equipment' | 'consumable' | 'currency' | 'material'
export type EquipmentSlot = 'weapon' | 'armor' | 'helm' | 'ring'

export type EquipmentBonuses = Partial<{
  maxHp: number
  maxMp: number
  atk: number
  def: number
  spd: number
  crit: number
}>

export interface BaseItemDefinition {
  id: string
  name: string
  icon: string
  sprite?: string
  rarity: ItemRarity
  category: ItemCategory
  stackable: boolean
  maxStack?: number
}

export interface EquipmentItemDefinition extends BaseItemDefinition {
  category: 'equipment'
  stackable: false
  slot: EquipmentSlot
  bonuses: EquipmentBonuses
  requiredLevel: number
}

export interface StackableItemDefinition extends BaseItemDefinition {
  category: 'consumable' | 'currency' | 'material'
  stackable: true
  maxStack: number
}

export type ItemDefinition = EquipmentItemDefinition | StackableItemDefinition
