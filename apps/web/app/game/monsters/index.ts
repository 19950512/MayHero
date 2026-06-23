export { Bat, Rat, RatBoss, MONSTERS, MONSTER_BY_ID } from '@mayhero/shared'
export type { MonsterDefinition, Enemy } from '@mayhero/shared'

import type { Enemy } from '@mayhero/shared'

export function toEnemy(monster: { drops: unknown } & Enemy): Enemy {
  const { drops: _drops, ...enemy } = monster as { drops: unknown } & Enemy
  return enemy
}
