import { BASE_STATS, CLASS_ICONS, LEVEL_STAT_GROWTH } from './classes'
import { EQUIPMENT_POOL, ITEM_BY_ID, ITEM_CATALOG } from './items'
import { MONSTER_BY_ID, MONSTERS, ZONES } from './monsters'
import type { Equipment } from './types'

export const XP_CURVE = (level: number) => Math.floor(100 * Math.pow(level, 1.5))

export { BASE_STATS, LEVEL_STAT_GROWTH, CLASS_ICONS, ZONES, MONSTERS, MONSTER_BY_ID, ITEM_CATALOG, ITEM_BY_ID, EQUIPMENT_POOL }

export const RARITY_COLORS: Record<Equipment['rarity'], string> = {
  common: 'text-gray-300',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
}
