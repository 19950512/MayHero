import type { StackableItemDefinition } from '../types'

export const GoldCoin: StackableItemDefinition = {
  id: 'gold_coin',
  name: 'Gold Coin',
  icon: '🪙',
  sprite: '/assets/items/gold_coin.png',
  rarity: 'common',
  category: 'currency',
  stackable: true,
  maxStack: 999999,
}
