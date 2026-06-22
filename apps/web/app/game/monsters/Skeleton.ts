import type { MonsterDefinition } from '../types'

export const Skeleton: MonsterDefinition = {
  id: 'skeleton',
  name: 'Esqueleto',
  emoji: '💀',
  stats: { hp: 55, maxHp: 55, mp: 0, maxMp: 0, atk: 14, def: 4, spd: 4, crit: 5 },
  xpReward: 28,
  goldReward: [6, 12],
  isBoss: false,
  drops: [
    { itemId: 'steel_sword', chance: 0.05 },
    { itemId: 'chain_mail', chance: 0.04 },
    { itemId: 'healing_potion', chance: 0.16, minQuantity: 1, maxQuantity: 3 },
    { itemId: 'gold_coin', chance: 0.72, minQuantity: 7, maxQuantity: 15 },
  ],
}
