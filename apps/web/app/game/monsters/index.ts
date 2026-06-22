import type { Enemy, MonsterDefinition } from '../types'
import { Bat } from './Bat'
import { Demon } from './Demon'
import { Goblin } from './Goblin'
import { OrcBoss } from './OrcBoss'
import { ShadowBoss } from './ShadowBoss'
import { Skeleton } from './Skeleton'
import { Slime } from './Slime'
import { Spider } from './Spider'
import { StoneGolemBoss } from './StoneGolemBoss'
import { Troll } from './Troll'
import { Wolf } from './Wolf'
import { ZombieMage } from './ZombieMage'

export const MONSTERS: MonsterDefinition[] = [
  Slime,
  Bat,
  Goblin,
  Wolf,
  OrcBoss,
  Skeleton,
  Spider,
  Troll,
  StoneGolemBoss,
  ZombieMage,
  Demon,
  ShadowBoss,
]

export const MONSTER_BY_ID: Record<string, MonsterDefinition> = Object.fromEntries(
  MONSTERS.map(monster => [monster.id, monster])
)

export function toEnemy(monster: MonsterDefinition): Enemy {
  const { drops: _drops, ...enemy } = monster
  return enemy
}
