import type { StackableItemDefinition } from '../types'

export const HealthPotion: StackableItemDefinition = {
  id: 'health_potion',
  name: 'Poção de Vida',
  icon: '🧪',
  sprite: '/assets/items/health_potion.png',
  rarity: 'common',
  category: 'consumable',
  stackable: true,
  maxStack: 99,
}
