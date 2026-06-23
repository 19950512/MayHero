import type { StackableItemDefinition } from './types'

export const PocaoDeVida: StackableItemDefinition = {
  id: 'healing_potion',
  name: 'Poção de Vida',
  icon: '🧪',
  sprite: '/assets/items/healing_potion.png',
  rarity: 'common',
  category: 'consumable',
  stackable: true,
  maxStack: 99,
}
