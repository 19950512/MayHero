import type { City } from '../../types'
import { FlorestaDeSantaRita } from './FlorestaDeSantaRita'
import { CasuloDoCrime } from './CasuloDoCrime'

export { FlorestaDeSantaRita, CasuloDoCrime }

export const Marau: City = {
  id: 'marau',
  name: 'Marau',
  description: 'Uma cidade tranquila no coração do planalto gaúcho, ponto de partida de muitos aventureiros.',
  dungeons: [FlorestaDeSantaRita, CasuloDoCrime],
}
