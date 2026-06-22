import type { MonsterDefinition } from '../types'

export const StoneGolemBoss: MonsterDefinition = {
  id: 'stone_golem_boss',
  name: 'Golem de Pedra',
  emoji: '🗿',
  stats: { hp: 250, maxHp: 250, mp: 0, maxMp: 0, atk: 28, def: 12, spd: 2, crit: 3 },
  xpReward: 150,
  goldReward: [40, 80],
  zone: 2,
  isBoss: true,
  drops: [
    { itemId: 'plate_armor', chance: 0.2 },
    { itemId: 'crown', chance: 0.16 },
    { itemId: 'dark_blade', chance: 0.1 },
    { itemId: 'healing_potion', chance: 0.5, minQuantity: 3, maxQuantity: 6 },
    { itemId: 'gold_coin', chance: 1, minQuantity: 55, maxQuantity: 110 },
  ],
}
