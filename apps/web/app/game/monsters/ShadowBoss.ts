import type { MonsterDefinition } from '../types'

export const ShadowBoss: MonsterDefinition = {
  id: 'shadow_boss',
  name: 'Lorde das Sombras',
  emoji: '🌑',
  stats: { hp: 500, maxHp: 500, mp: 200, maxMp: 200, atk: 45, def: 18, spd: 6, crit: 15 },
  xpReward: 350,
  goldReward: [100, 200],
  isBoss: true,
  drops: [
    { itemId: 'excalibur', chance: 0.12 },
    { itemId: 'dragon_armor', chance: 0.22 },
    { itemId: 'crown', chance: 0.2 },
    { itemId: 'healing_potion', chance: 0.7, minQuantity: 4, maxQuantity: 8 },
    { itemId: 'gold_coin', chance: 1, minQuantity: 150, maxQuantity: 280 },
  ],
}
