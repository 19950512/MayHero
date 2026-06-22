import type { EquipmentItemDefinition } from './types'

export const CoroaDoRei: EquipmentItemDefinition = {
  id: 'crown',
  name: 'Coroa do Rei',
  icon: '👑',
  rarity: 'epic',
  category: 'equipment',
  stackable: false,
  slot: 'helm',
  type: 'helmet',
  bonuses: { def: 8, maxHp: 30, crit: 5 },
  requiredLevel: 10,
}
