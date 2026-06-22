import type { EquipmentItemDefinition } from './types'

export const AnelDoPoder: EquipmentItemDefinition = {
  id: 'power_ring',
  name: 'Anel do Poder',
  icon: '🔮',
  rarity: 'epic',
  category: 'equipment',
  stackable: false,
  slot: 'ring',
  type: 'ring',
  bonuses: { atk: 15, crit: 6 },
  requiredLevel: 10,
}
