import type { Dungeon } from '../../types'
import { RatBoss } from '../../monsters/RatBoss'
import { Rat } from '../../monsters'

export const FlorestaDeSantaRita: Dungeon = {
  id: 'floresta_santa_rita',
  name: 'Floresta de Santa Rita',
  description: 'Uma floresta densa ao redor de Marau, repleta de criaturas menores.',
  lore: 'Dizem os moradores de Marau que a floresta ao sul da cidade nunca dorme. À noite, sons estranhos ecoam entre os pinheiros e os viajantes que se aventuram sozinhos raramente voltam para contar a história.',
  minLevel: 1,
  recommendedLevel: 1,
  bossEvery: 10,
  zoneId: 1,
  monsters: [Rat, RatBoss],
}
