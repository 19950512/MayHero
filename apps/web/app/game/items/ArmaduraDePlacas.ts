import type { EquipmentItemDefinition } from './types'

export const ArmaduraDePlacas: EquipmentItemDefinition = {
  id: 'plate_armor',
  name: 'Armadura de Placas',
  icon: '⚜️',
  rarity: 'epic',
  category: 'equipment',
  stackable: false,
  slot: 'armor',
  type: 'armor',
  bonuses: { def: 18, maxHp: 60 },
  requiredLevel: 10,
}
