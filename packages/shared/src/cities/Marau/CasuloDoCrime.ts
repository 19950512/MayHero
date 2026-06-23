import type { Dungeon } from '../../types'
import { Rat } from '../../monsters/Rat'
import { RatBoss } from '../../monsters/RatBoss'

export const CasuloDoCrime: Dungeon = {
  id: 'casulo_do_crime',
  name: 'Casulo do Crime',
  description: 'Uma antiga empresa de reciclagem abandonada na periferia de Marau, agora infestada por criminosos e suas criaturas de estimação.',
  lore: 'O Casulo do Crime era um local de trabalho movimentado até que uma série de acidentes misteriosos levou à sua falência. Desde então, tornou-se um refúgio para criminosos locais, que trouxeram suas criaturas para proteger o território. Os moradores evitam a área, e os poucos que se aventuram lá dentro raramente saem para contar a história.',
  minLevel: 1,
  recommendedLevel: 1,
  bossEvery: 30,
  zoneId: 1,
  monsters: [Rat, RatBoss],
}
