import type { Dungeon } from '../../types'
import { Skeleton } from '../../monsters/Skeleton'
import { Spider } from '../../monsters/Spider'
import { Troll } from '../../monsters/Troll'
import { StoneGolemBoss } from '../../monsters/StoneGolemBoss'

export const CavernasDoRioPedroso: Dungeon = {
  id: 'cavernas_rio_pedroso',
  name: 'Cavernas do Rio Pedroso',
  description: 'Cavernas profundas escavadas pelo antigo leito do Rio Pedroso, habitadas por mortos-vivos e bestas de pedra.',
  lore: 'Quando o Rio Pedroso secou misteriosamente décadas atrás, revelou uma rede de cavernas que ninguém sabia existir. Expedições enviadas para explorar o interior nunca regressaram, e os que ficaram na entrada juraram ter ouvido passos de algo enorme nas profundezas.',
  minLevel: 5,
  recommendedLevel: 6,
  bossEvery: 10,
  zoneId: 2,
  monsters: [Skeleton, Spider, Troll, StoneGolemBoss],
}
