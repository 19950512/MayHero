import type { EquipmentItemDefinition } from './types'

export const ArcoDoCacador: EquipmentItemDefinition = {
  id: 'hunters_bow',
  name: 'Arco do Caçador',
  icon: '🏹',
  rarity: 'common',
  category: 'equipment',
  stackable: false,
  slot: 'weapon',
  type: 'weapon',
  bonuses: { atk: 6, spd: 1 },
  requiredLevel: 2,
}
