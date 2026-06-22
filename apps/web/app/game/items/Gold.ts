import type { StackableItemDefinition } from './types'

export const Gold: StackableItemDefinition = {
  id: 'gold_coin',
  name: 'Gold',
  icon: '🪙',
  rarity: 'common',
  category: 'currency',
  stackable: true,
  maxStack: 999999,
}
