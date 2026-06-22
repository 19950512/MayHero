import type { MonsterDefinition } from '../types'

export const Bat: MonsterDefinition = {
  id: 'bat',
  name: 'Morcego',
  emoji: '🦇',
  stats: { hp: 15, maxHp: 15, mp: 0, maxMp: 0, atk: 6, def: 0, spd: 7, crit: 5 },
  xpReward: 10,
  goldReward: [2, 5],
  isBoss: false,
  drops: [
    { itemId: 'copper_ring', chance: 0.05 },
    { itemId: 'hunters_bow', chance: 0.03 },
    { itemId: 'healing_potion', chance: 0.1, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'gold_coin', chance: 0.6, minQuantity: 2, maxQuantity: 6 },
  ],
}
