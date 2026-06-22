import type { Enemy, MonsterDefinition, Zone } from '../types'
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

const ZONE_META: Record<number, Omit<Zone, 'enemies'>> = {
  1: {
    id: 1,
    name: 'Floresta Sombria',
    description: 'Uma floresta densa repleta de criaturas menores.',
    minLevel: 1,
    bossEvery: 10,
  },
  2: {
    id: 2,
    name: 'Cavernas de Pedra',
    description: 'Cavernas escuras com monstros cada vez mais perigosos.',
    minLevel: 5,
    bossEvery: 10,
  },
  3: {
    id: 3,
    name: 'Torre do Mago Sombrio',
    description: 'O lar de magos corrompidos e demônios conjurados.',
    minLevel: 10,
    bossEvery: 10,
  },
}

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

function toEnemy(monster: MonsterDefinition): Enemy {
  const { drops: _drops, ...enemy } = monster
  return enemy
}

export const ZONES: Zone[] = Object.values(ZONE_META)
  .sort((a, b) => a.id - b.id)
  .map(zone => ({
    ...zone,
    enemies: MONSTERS.filter(monster => monster.zone === zone.id).map(toEnemy),
  }))
