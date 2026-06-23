import type { MonsterDefinition } from '../types'
import { Bat } from './Bat'
import { Rat } from './Rat'
import { RatBoss } from './RatBoss'

export { Bat, Rat, RatBoss }

export const MONSTERS: MonsterDefinition[] = [Bat, Rat, RatBoss]

export const MONSTER_BY_ID: Record<string, MonsterDefinition> = Object.fromEntries(
  MONSTERS.map(m => [m.id, m])
)
