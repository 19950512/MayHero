import type { EquipmentItemDefinition } from './types'

export const Galho: EquipmentItemDefinition = {
  id: 'stick',
  name: 'Galho',
  icon: '🪵',
  rarity: 'common',
  category: 'equipment',
  stackable: false,
  slot: 'weapon',
  type: 'weapon',
  bonuses: { atk: 2 },
  requiredLevel: 1,
}
