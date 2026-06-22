import type { MonsterDefinition } from '../types'

export const ZombieMage: MonsterDefinition = {
  id: 'zombie_mage',
  name: 'Mago Zumbi',
  emoji: '🧟',
  stats: { hp: 90, maxHp: 90, mp: 60, maxMp: 60, atk: 24, def: 6, spd: 5, crit: 10 },
  xpReward: 55,
  goldReward: [15, 25],
  zone: 3,
  isBoss: false,
  drops: [
    { itemId: 'fire_staff', chance: 0.08 },
    { itemId: 'power_ring', chance: 0.06 },
    { itemId: 'healing_potion', chance: 0.24, minQuantity: 2, maxQuantity: 5 },
    { itemId: 'gold_coin', chance: 0.85, minQuantity: 18, maxQuantity: 32 },
  ],
}
