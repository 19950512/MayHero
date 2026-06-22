import type { MonsterDefinition } from '../types'

export const Troll: MonsterDefinition = {
  id: 'troll',
  name: 'Troll',
  emoji: '🧌',
  stats: { hp: 80, maxHp: 80, mp: 0, maxMp: 0, atk: 18, def: 7, spd: 2, crit: 2 },
  xpReward: 40,
  goldReward: [10, 18],
  zone: 2,
  isBoss: false,
  drops: [
    { itemId: 'plate_armor', chance: 0.04 },
    { itemId: 'power_ring', chance: 0.03 },
    { itemId: 'healing_potion', chance: 0.22, minQuantity: 2, maxQuantity: 4 },
    { itemId: 'gold_coin', chance: 0.8, minQuantity: 12, maxQuantity: 22 },
  ],
}
