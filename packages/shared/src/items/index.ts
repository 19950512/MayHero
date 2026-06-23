import type { ItemDefinition, EquipmentItemDefinition } from '../types'
import { RingOfHealing } from './RingOfHealing'
import { GoldCoin } from './GoldCoin'
import { HealthPotion } from './HealthPotion'
import { NucleoBaixo } from './NucleoBaixo'
import { NucleoMedio } from './NucleoMedio'
import { NucleoAlto } from './NucleoAlto'
import { NucleoAltissimo } from './NucleoAltissimo'
import { NucleoBaixoPerfeito } from './NucleoBaixoPerfeito'
import { NucleoMedioPerfeito } from './NucleoMedioPerfeito'
import { NucleoAltoPerfeito } from './NucleoAltoPerfeito'
import { NucleoAltissimoPerfeito } from './NucleoAltissimoPerfeito'

export {
  RingOfHealing,
  GoldCoin,
  HealthPotion,
  NucleoBaixo, NucleoMedio, NucleoAlto, NucleoAltissimo,
  NucleoBaixoPerfeito, NucleoMedioPerfeito, NucleoAltoPerfeito, NucleoAltissimoPerfeito,
}

export const ITEMS: ItemDefinition[] = [
  RingOfHealing,
  GoldCoin,
  HealthPotion,
  NucleoBaixo, NucleoMedio, NucleoAlto, NucleoAltissimo,
  NucleoBaixoPerfeito, NucleoMedioPerfeito, NucleoAltoPerfeito, NucleoAltissimoPerfeito,
]

export const ITEM_BY_ID: Record<string, ItemDefinition> = Object.fromEntries(
  ITEMS.map(item => [item.id, item])
)

export const EQUIPMENT_ITEMS: EquipmentItemDefinition[] = ITEMS.filter(
  (item): item is EquipmentItemDefinition => item.category === 'equipment'
)
