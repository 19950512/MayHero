import type { City } from '../../types'
import { TorreDoArautoDasSombras } from './TorreDoArautoDasSombras'

export const PortoAlegre: City = {
  id: 'porto_alegre',
  name: 'Porto Alegre',
  description: 'A capital, onde o poder e a corrupção coexistem. Uma força sombria ameaça engolir a cidade pelas bordas do Guaíba.',
  dungeons: [TorreDoArautoDasSombras],
}
