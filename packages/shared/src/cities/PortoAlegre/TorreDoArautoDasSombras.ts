import type { Dungeon } from '../../types'
import { Rat } from '../../monsters/Rat'
import { RatBoss } from '../../monsters/RatBoss'

export const TorreDoArautoDasSombras: Dungeon = {
  id: 'torre_arauto_sombras',
  name: 'Torre do Arauto das Sombras',
  description: 'Uma torre negra que surgiu do nada às margens do Guaíba, lar de magos corrompidos e demônios conjurados.',
  lore: 'Na última lua cheia do inverno, uma torre de pedra negra emergiu das águas do Guaíba como se sempre tivesse estado lá. Magos do Conselho de Porto Alegre identificaram runas antigas em sua base — runas que, segundo os mais velhos, foram gravadas por um ser que não pertence a este mundo. O Arauto das Sombras acordou.',
  minLevel: 10,
  recommendedLevel: 12,
  bossEvery: 10,
  zoneId: 3,
  monsters: [Rat, RatBoss],
}
