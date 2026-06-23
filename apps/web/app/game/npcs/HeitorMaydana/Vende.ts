import {  } from '@mayhero/shared'
import type { NpcSellEntry } from '../types'
import { HealthPotion } from '../../../../../../packages/shared/src/items'

export const HeitorVende: NpcSellEntry[] = [
  { itemId: HealthPotion.id, price: 60,  quantity: 99 },
]
