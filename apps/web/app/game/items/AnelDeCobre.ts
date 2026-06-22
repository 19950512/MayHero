import type { EquipmentItemDefinition } from './types'

export const AnelDeCobre: EquipmentItemDefinition = {
  id: 'copper_ring',
  name: 'Anel de Cobre',
  icon: '💍',
  rarity: 'common',
  category: 'equipment',
  stackable: false,
  slot: 'ring',
  type: 'ring',
  bonuses: { atk: 1 },
  requiredLevel: 1,
}
