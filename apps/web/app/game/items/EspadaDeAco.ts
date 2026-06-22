import type { EquipmentItemDefinition } from './types'

export const EspadaDeAco: EquipmentItemDefinition = {
  id: 'steel_sword',
  name: 'Espada de Aço',
  icon: '🗡️',
  rarity: 'rare',
  category: 'equipment',
  stackable: false,
  slot: 'weapon',
  type: 'weapon',
  bonuses: { atk: 12, def: 2 },
  requiredLevel: 5,
}
