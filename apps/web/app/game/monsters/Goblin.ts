import type { MonsterDefinition } from '../types'

export const Goblin: MonsterDefinition = {
  id: 'goblin',
  name: 'Goblin',
  emoji: '👺',
  stats: { hp: 30, maxHp: 30, mp: 0, maxMp: 0, atk: 7, def: 2, spd: 4, crit: 3 },
  xpReward: 14,
  goldReward: [3, 7],
  isBoss: false,
  drops: [
    { itemId: 'iron_sword', chance: 0.04 },
    { itemId: 'leather_armor', chance: 0.04 },
    { itemId: 'healing_potion', chance: 0.12, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'gold_coin', chance: 0.7, minQuantity: 3, maxQuantity: 8 },
  ],
}
