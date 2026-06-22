import type { MonsterDefinition } from '../types'

export const Slime: MonsterDefinition = {
  id: 'slime',
  name: 'Slime',
  emoji: '🟢',
  stats: { hp: 20, maxHp: 20, mp: 0, maxMp: 0, atk: 4, def: 1, spd: 2, crit: 2 },
  xpReward: 8,
  goldReward: [1, 4],
  isBoss: false,
  drops: [
    { itemId: 'hood', chance: 0.03 },
    { itemId: 'stick', chance: 0.03 },
    { itemId: 'healing_potion', chance: 0.12, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'gold_coin', chance: 0.55, minQuantity: 1, maxQuantity: 5 },
  ],
}
