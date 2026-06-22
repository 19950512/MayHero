import type { EquipmentItemDefinition } from './types'

export const Excalibur: EquipmentItemDefinition = {
  id: 'excalibur',
  name: 'Excalibur',
  icon: '✨',
  rarity: 'legendary',
  category: 'equipment',
  stackable: false,
  slot: 'weapon',
  type: 'weapon',
  bonuses: { atk: 50, def: 10, crit: 12 },
  requiredLevel: 15,
}
