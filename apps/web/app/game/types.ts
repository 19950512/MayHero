export type HeroClass = 'warrior' | 'archer' | 'mage' | 'paladin' | 'druid' | 'knight'

export interface Stats {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  atk: number
  def: number
  spd: number
  crit: number // crit chance 0-100
}

export interface Equipment {
  id: string
  name: string
  slot: 'weapon' | 'armor' | 'helm' | 'ring'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  bonuses: Partial<Omit<Stats, 'hp' | 'mp' | 'maxHp' | 'maxMp'>> & {
    maxHp?: number
    maxMp?: number
  }
  icon: string
  requiredLevel: number
}

export type EquipmentBonuses = Equipment['bonuses']
export type ItemRarity = Equipment['rarity']
export type ItemCategory = 'equipment' | 'consumable' | 'currency'

export interface BaseItemDefinition {
  id: string
  name: string
  icon: string
  rarity: ItemRarity
  category: ItemCategory
  stackable: boolean
  maxStack?: number
}

export interface EquipmentItemDefinition extends BaseItemDefinition {
  category: 'equipment'
  stackable: false
  slot: Equipment['slot']
  type: 'weapon' | 'armor' | 'helmet' | 'ring'
  bonuses: EquipmentBonuses
  requiredLevel: number
}

export interface StackableItemDefinition extends BaseItemDefinition {
  category: 'consumable' | 'currency'
  stackable: true
  maxStack: number
}

export type ItemDefinition = EquipmentItemDefinition | StackableItemDefinition

export interface MonsterDrop {
  itemId: string
  chance: number
  minQuantity?: number
  maxQuantity?: number
}

export interface MonsterDefinition extends Enemy {
  drops: MonsterDrop[]
}

export interface HeroClassDefinition {
  id: HeroClass
  name: string
  shortName: string
  description: string
  sigil: string
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

export interface Enemy {
  id: string
  name: string
  emoji: string
  stats: Stats
  xpReward: number
  goldReward: [number, number] // min, max
  zone: number
  isBoss: boolean
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

export interface Zone {
  id: number
  name: string
  description: string
  minLevel: number
  enemies: Enemy[]
  bossEvery: number // spawn boss every N kills
}
