import type { MonsterDefinition } from '../types'

export const Spider: MonsterDefinition = {
  id: 'spider',
  name: 'Aranha Gigante',
  emoji: '🕷️',
  stats: { hp: 48, maxHp: 48, mp: 0, maxMp: 0, atk: 16, def: 3, spd: 8, crit: 8 },
  xpReward: 32,
  goldReward: [8, 14],
  isBoss: false,
  drops: [
    { itemId: 'speed_ring', chance: 0.05 },
    { itemId: 'fire_staff', chance: 0.03 },
    { itemId: 'healing_potion', chance: 0.2, minQuantity: 1, maxQuantity: 3 },
    { itemId: 'gold_coin', chance: 0.75, minQuantity: 8, maxQuantity: 16 },
  ],
}
