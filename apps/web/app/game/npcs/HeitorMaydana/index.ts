import type { NpcDefinition } from '../types'
import { HeitorVende } from './Vende'
import { HeitorCompra } from './Compra'

export const HeitorMaydana: NpcDefinition = {
  id: 'heitor_maydana',
  name: 'Heitor Maydana',
  lore: 'Comerciante experiente de Marau que percorreu as terras do sul vendendo itens a aventureiros necessitados. Seu olhar perspicaz avalia qualquer produto com precisão.',
  image: '🧙',
  sprite: '/assets/npcs/heitor_maydana.png',
  phrases: [
    'Bem-vindo, aventureiro! O que posso fazer por você hoje?',
    'Tenho as melhores mercadorias desta região, pode confiar!',
    'Cuidado por aí — as estradas estão cheias de monstros ultimamente.',
    'Compro e vendo o que um herói de verdade precisa.',
    'Se você sobreviveu até aqui, merece bons equipamentos!',
    'Meus preços são justos, peça para qualquer um.',
    'Venho de Marau, a terra dos guerreiros. Sei o que você precisa.',
  ],
  sells: HeitorVende,
  buys: HeitorCompra,
}
