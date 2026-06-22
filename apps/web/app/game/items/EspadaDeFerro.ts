import type { EquipmentItemDefinition } from './types'

export const EspadaDeFerro: EquipmentItemDefinition = {
  id: 'iron_sword',
  name: 'Espada de Ferro',
  icon: '⚔️',
  rarity: 'common',
  category: 'equipment',
  stackable: false,
  slot: 'weapon',
  type: 'weapon',
  bonuses: { atk: 5, def: 1 },
  requiredLevel: 2,
}
