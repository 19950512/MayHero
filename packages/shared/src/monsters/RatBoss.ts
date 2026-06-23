import { GoldCoin, HealthPotion, RingOfHealing } from '../items'
import type { MonsterDefinition } from '../types'

export const RatBoss: MonsterDefinition = {
  id: 'rat_boss',
  name: 'Rato Chefe',
  emoji: '🐀',
  sprite: '/assets/monsters/rat_boss.png',
  stats: { hp: 50, maxHp: 50, mp: 0, maxMp: 0, atk: 10, def: 3, spd: 6, crit: 5 },
  xpReward: 20,
  goldReward: [5, 15],
  isBoss: true,
  drops: [
    { itemId: GoldCoin.id, chance: 0.8, minQuantity: 5, maxQuantity: 20 },
    { itemId: RingOfHealing.id, chance: 0.3, minQuantity: 1, maxQuantity: 1 },
    { itemId: HealthPotion.id, chance: 0.5, minQuantity: 1, maxQuantity: 1 }
  ],
}
