import type { EquipmentItemDefinition } from './types'

export const ElmoDeFerro: EquipmentItemDefinition = {
  id: 'iron_helm',
  name: 'Elmo de Ferro',
  icon: '⛑️',
  rarity: 'common',
  category: 'equipment',
  stackable: false,
  slot: 'helm',
  type: 'helmet',
  bonuses: { def: 3, maxHp: 8 },
  requiredLevel: 3,
}
