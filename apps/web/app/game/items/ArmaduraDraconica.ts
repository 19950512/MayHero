import type { EquipmentItemDefinition } from './types'

export const ArmaduraDraconica: EquipmentItemDefinition = {
  id: 'dragon_armor',
  name: 'Armadura Dracônica',
  icon: '🐉',
  rarity: 'legendary',
  category: 'equipment',
  stackable: false,
  slot: 'armor',
  type: 'armor',
  bonuses: { def: 35, maxHp: 120 },
  requiredLevel: 15,
}
