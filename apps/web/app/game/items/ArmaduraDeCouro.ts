import type { EquipmentItemDefinition } from './types'

export const ArmaduraDeCouro: EquipmentItemDefinition = {
  id: 'leather_armor',
  name: 'Armadura de Couro',
  icon: '🥋',
  rarity: 'common',
  category: 'equipment',
  stackable: false,
  slot: 'armor',
  type: 'armor',
  bonuses: { def: 5, maxHp: 10 },
  requiredLevel: 2,
}
