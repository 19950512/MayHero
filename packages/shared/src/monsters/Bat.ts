import { GoldCoin } from '../items'
import type { MonsterDefinition } from '../types'

export const Bat: MonsterDefinition = {
  id: 'bat',
  name: 'Morcego',
  emoji: '🦇',
  sprite: '/assets/monsters/bat.png',
  stats: { hp: 15, maxHp: 15, mp: 0, maxMp: 0, atk: 6, def: 0, spd: 7, crit: 5 },
  xpReward: 10,
  goldReward: [2, 5],
  isBoss: false,
  drops: [
    { itemId: GoldCoin.id, chance: 0.6, minQuantity: 2, maxQuantity: 6 },
  ],
}
