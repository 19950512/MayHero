import type { EquipmentItemDefinition } from '@mayhero/shared'
import type { Equipment } from '../types'

export {
  RingOfHealing,
  GoldCoin,
  HealthPotion,
  NucleoBaixo, NucleoMedio, NucleoAlto, NucleoAltissimo,
  NucleoBaixoPerfeito, NucleoMedioPerfeito, NucleoAltoPerfeito, NucleoAltissimoPerfeito,
  ITEMS as ITEM_CATALOG,
  ITEM_BY_ID,
} from '@mayhero/shared'

export type { ItemDefinition, EquipmentItemDefinition, StackableItemDefinition } from '@mayhero/shared'

import { ITEMS } from '@mayhero/shared'

export const EQUIPMENT_POOL: Equipment[] = ITEMS
  .filter((item): item is EquipmentItemDefinition => item.category === 'equipment')
  .map(item => ({
    id: item.id,
    name: item.name,
    slot: item.slot,
    rarity: item.rarity,
    bonuses: item.bonuses,
    icon: item.icon,
    requiredLevel: item.requiredLevel,
  }))
