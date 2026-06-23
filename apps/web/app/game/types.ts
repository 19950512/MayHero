export type {
  Stats, Enemy, MonsterDrop, MonsterDefinition, Dungeon, City,
  ItemRarity, ItemCategory, EquipmentSlot, EquipmentBonuses,
  BaseItemDefinition, EquipmentItemDefinition, StackableItemDefinition, ItemDefinition,
} from '@mayhero/shared'
import type { Stats, Enemy, EquipmentBonuses } from '@mayhero/shared'

export type HeroClass = 'warrior' | 'archer' | 'mage' | 'paladin' | 'druid' | 'knight'

export interface Equipment {
  id: string
  name: string
  slot: 'weapon' | 'armor' | 'helm' | 'ring'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  bonuses: EquipmentBonuses
  icon: string
  requiredLevel: number
  enhancement?: number
}

export interface HeroClassDefinition {
  id: HeroClass
  name: string
  shortName: string
  description: string
  sigil: string
  sprite?: string
  themeColor: string
  baseStats: Stats
  statGrowth: Partial<Stats>
}

export type SkillAllocStat = 'atk' | 'def' | 'maxHp' | 'spd'

export interface SkillAllocations {
  atk: number
  def: number
  maxHp: number
  spd: number
}

export interface HeroAccessoriesLoadout {
  amulet?: Equipment
  ring1?: Equipment
  ring2?: Equipment
  ring3?: Equipment
  ring4?: Equipment
  cornalina1?: Equipment
  cornalina2?: Equipment
  talisma1?: Equipment
  talisma2?: Equipment
  belt?: Equipment
  earring1?: Equipment
  earring2?: Equipment
}

export interface HeroEquipmentLoadout {
  head?: Equipment
  body?: Equipment
  legs?: Equipment
  boots?: Equipment
  offhand?: Equipment
  mainhand?: Equipment
}

export interface HeroPetLoadout {
  pet1?: Equipment
  pet2?: Equipment
}

export interface HeroLoadout {
  accessories: HeroAccessoriesLoadout
  equipment: HeroEquipmentLoadout
  pets: HeroPetLoadout
}

export interface Hero {
  name: string
  class: HeroClass
  level: number
  xp: number
  xpToNext: number
  stats: Stats
  baseStats: Stats
  equipment: {
    weapon?: Equipment
    armor?: Equipment
    helm?: Equipment
    ring?: Equipment
  }
  loadout: HeroLoadout
  gold: number
  totalKills: number
  skillPoints: number
  skillAllocations: SkillAllocations
}

export interface BattleLog {
  id: string
  turn: number
  actor: 'hero' | 'enemy'
  message: string
  damage?: number
  isCrit?: boolean
  isHeal?: boolean
}

export interface BattleState {
  active: boolean
  enemy: Enemy | null
  enemyCurrentHp: number
  turn: number
  logs: BattleLog[]
  phase: 'fighting' | 'victory' | 'defeat' | 'idle'
  lastTickAt: number
}
