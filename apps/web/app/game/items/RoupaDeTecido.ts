import type { EquipmentItemDefinition } from './types'

export const RoupaDeTecido: EquipmentItemDefinition = {
  id: 'cloth',
  name: 'Roupa de Tecido',
  icon: '👕',
  rarity: 'common',
  category: 'equipment',
  stackable: false,
  slot: 'armor',
  type: 'armor',
  bonuses: { def: 2 },
  requiredLevel: 1,
}
