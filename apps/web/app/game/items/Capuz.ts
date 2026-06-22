import type { EquipmentItemDefinition } from './types'

export const Capuz: EquipmentItemDefinition = {
  id: 'hood',
  name: 'Capuz',
  icon: '🪖',
  rarity: 'common',
  category: 'equipment',
  stackable: false,
  slot: 'helm',
  type: 'helmet',
  bonuses: { def: 1 },
  requiredLevel: 1,
}
