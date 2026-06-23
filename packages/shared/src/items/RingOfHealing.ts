import type { EquipmentItemDefinition } from '../types'

export const RingOfHealing: EquipmentItemDefinition = {
  id: 'ring_of_healing',
  name: 'Anel da Cura',
  icon: '💍',
  sprite: '/assets/items/ring_of_healing.png',
  rarity: 'rare',
  category: 'equipment',
  stackable: false,
  slot: 'ring',
  bonuses: { spd: 3, crit: 4 },
  requiredLevel: 5,
}
