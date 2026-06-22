import type { City } from '../../types'
import { CasuloDoCrime } from './CasuloDoCrime'
import { FlorestaDeSantaRita } from './FlorestaDeSantaRita'

export const Marau: City = {
  id: 'marau',
  name: 'Marau',
  description: 'Uma cidade tranquila no coração do planalto gaúcho, ponto de partida de muitos aventureiros.',
  dungeons: [FlorestaDeSantaRita, CasuloDoCrime],
}
