import type { MonsterDefinition } from '../types'

export const Demon: MonsterDefinition = {
  id: 'demon',
  name: 'Demônio',
  emoji: '😈',
  stats: { hp: 110, maxHp: 110, mp: 40, maxMp: 40, atk: 28, def: 8, spd: 7, crit: 12 },
  xpReward: 65,
  goldReward: [18, 32],
  isBoss: false,
  drops: [
    { itemId: 'dark_blade', chance: 0.07 },
    { itemId: 'dragon_armor', chance: 0.04 },
    { itemId: 'healing_potion', chance: 0.28, minQuantity: 2, maxQuantity: 5 },
    { itemId: 'gold_coin', chance: 0.88, minQuantity: 20, maxQuantity: 35 },
  ],
}
