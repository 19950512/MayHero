import type { City, Dungeon } from '../types'
import { Marau } from './Marau'
import { PassoFundo } from './PassoFundo'
import { PortoAlegre } from './PortoAlegre'

export const CITIES: City[] = [Marau, PassoFundo, PortoAlegre]

export const DUNGEONS: Dungeon[] = CITIES.flatMap(city => city.dungeons)

export const DUNGEON_BY_ID: Record<string, Dungeon> = Object.fromEntries(
  DUNGEONS.map(dungeon => [dungeon.id, dungeon])
)
