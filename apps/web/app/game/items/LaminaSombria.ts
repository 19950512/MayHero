import type { EquipmentItemDefinition } from './types'

export const LaminaSombria: EquipmentItemDefinition = {
  id: 'dark_blade',
  name: 'Lâmina Sombria',
  icon: '🌑',
  rarity: 'epic',
  category: 'equipment',
  stackable: false,
  slot: 'weapon',
  type: 'weapon',
  bonuses: { atk: 28, crit: 8, spd: 2 },
  requiredLevel: 10,
}
