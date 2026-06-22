import type { EquipmentItemDefinition } from './types'

export const CotaDeMalha: EquipmentItemDefinition = {
  id: 'chain_mail',
  name: 'Cota de Malha',
  icon: '🛡️',
  rarity: 'rare',
  category: 'equipment',
  stackable: false,
  slot: 'armor',
  type: 'armor',
  bonuses: { def: 10, maxHp: 25 },
  requiredLevel: 5,
}
