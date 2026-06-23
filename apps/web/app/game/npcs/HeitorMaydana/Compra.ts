import { RingOfHealing } from '@mayhero/shared'
import type { NpcBuyEntry } from '../types'
import { HealthPotion, NucleoBaixo, NucleoMedio } from '../../../../../../packages/shared/src/items'

export const HeitorCompra: NpcBuyEntry[] = [
  { itemId: HealthPotion.id, price: 15  },
  { itemId: NucleoBaixo.id,   price: 45  },
  { itemId: NucleoMedio.id,   price: 110 },
  { itemId: RingOfHealing.id, price: 300,},

]
