import type { EquipmentItemDefinition } from './types'

export const CajadoDeFogo: EquipmentItemDefinition = {
  id: 'fire_staff',
  name: 'Cajado de Fogo',
  icon: '🔥',
  rarity: 'rare',
  category: 'equipment',
  stackable: false,
  slot: 'weapon',
  type: 'weapon',
  bonuses: { atk: 18, crit: 5 },
  requiredLevel: 7,
}
