import type { EquipmentItemDefinition } from './types'

export const AnelDaVelocidade: EquipmentItemDefinition = {
  id: 'speed_ring',
  name: 'Anel da Velocidade',
  icon: '💨',
  rarity: 'rare',
  category: 'equipment',
  stackable: false,
  slot: 'ring',
  type: 'ring',
  bonuses: { spd: 3, crit: 4 },
  requiredLevel: 5,
}
