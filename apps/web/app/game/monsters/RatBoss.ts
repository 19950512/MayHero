import type { MonsterDefinition } from '../types'

export const RatBoss: MonsterDefinition = {
  id: 'rat_boss',
  name: 'Rato Chefe',
  emoji: '🐀',
  stats: { hp: 50, maxHp: 50, mp: 0, maxMp: 0, atk: 10, def: 5, spd: 7, crit: 10 },
  xpReward: 50,
  goldReward: [20, 50],
  isBoss: true,
  drops: [
    { itemId: 'gold_coin', chance: 0.6, minQuantity: 10, maxQuantity: 50 },
    { itemId: 'gold_coin', chance: 0.7, minQuantity: 30, maxQuantity: 47 },
  ],
}
