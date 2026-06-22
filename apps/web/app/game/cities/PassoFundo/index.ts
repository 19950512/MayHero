import type { City } from '../../types'
import { CavernasDoRioPedroso } from './CavernasDoRioPedroso'

export const PassoFundo: City = {
  id: 'passo_fundo',
  name: 'Passo Fundo',
  description: 'A maior cidade da região, onde mercadores e aventureiros se cruzam nos mercados barulhentos da praça central.',
  dungeons: [CavernasDoRioPedroso],
}
