import type { MonsterDefinition } from '../types'

export const OrcBoss: MonsterDefinition = {
  id: 'orc_boss',
  name: 'Orc Chefe',
  emoji: '👹',
  stats: { hp: 100, maxHp: 100, mp: 0, maxMp: 0, atk: 14, def: 5, spd: 3, crit: 4 },
  xpReward: 60,
  goldReward: [15, 30],
  isBoss: true,
  drops: [
    { itemId: 'chain_mail', chance: 0.15 },
    { itemId: 'iron_helm', chance: 0.14 },
    { itemId: 'healing_potion', chance: 0.4, minQuantity: 2, maxQuantity: 4 },
    { itemId: 'gold_coin', chance: 1, minQuantity: 20, maxQuantity: 45 },
  ],
}
