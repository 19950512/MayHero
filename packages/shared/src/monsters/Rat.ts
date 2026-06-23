import { GoldCoin } from '../items'
import type { MonsterDefinition } from '../types'

export const Rat: MonsterDefinition = {
  id: 'rat',
  name: 'Rato',
  emoji: '🐀',
  sprite: '/assets/monsters/rat.png',
  stats: { hp: 10, maxHp: 10, mp: 0, maxMp: 0, atk: 4, def: 1, spd: 5, crit: 3 },
  xpReward: 5,
  goldReward: [2, 5],
  isBoss: false,
  drops: [
    { itemId: GoldCoin.id, chance: 0.6, minQuantity: 1, maxQuantity: 5 },
  ],
}
