import type { EquipmentItemDefinition } from './types'

export const CajadoDeCarvalho: EquipmentItemDefinition = {
  id: 'oak_staff',
  name: 'Cajado de Carvalho',
  icon: '🪄',
  rarity: 'common',
  category: 'equipment',
  stackable: false,
  slot: 'weapon',
  type: 'weapon',
  bonuses: { atk: 7, crit: 2 },
  requiredLevel: 2,
}
