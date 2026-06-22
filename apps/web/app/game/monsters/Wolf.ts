import type { MonsterDefinition } from '../types'

export const Wolf: MonsterDefinition = {
  id: 'wolf',
  name: 'Lobo',
  emoji: '🐺',
  stats: { hp: 35, maxHp: 35, mp: 0, maxMp: 0, atk: 9, def: 2, spd: 6, crit: 6 },
  xpReward: 18,
  goldReward: [2, 6],
  zone: 1,
  isBoss: false,
  drops: [
    { itemId: 'speed_ring', chance: 0.03 },
    { itemId: 'oak_staff', chance: 0.03 },
    { itemId: 'healing_potion', chance: 0.14, minQuantity: 1, maxQuantity: 3 },
    { itemId: 'gold_coin', chance: 0.65, minQuantity: 2, maxQuantity: 7 },
  ],
}
