export type HeroClass = 'warrior' | 'archer' | 'mage'

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

export type SkillAllocStat = 'atk' | 'def' | 'maxHp' | 'spd'

export interface SkillAllocations {
  atk: number
  def: number
  maxHp: number
  spd: number
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
