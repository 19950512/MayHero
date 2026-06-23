import { HeitorMaydana } from './HeitorMaydana'
import type { NpcDefinition } from './types'

export { HeitorMaydana }
export type { NpcDefinition }
export type { NpcSellEntry, NpcBuyEntry } from './types'

export const NPC_CATALOG: NpcDefinition[] = [
  HeitorMaydana,
]

export const NPC_BY_ID: Record<string, NpcDefinition> = Object.fromEntries(
  NPC_CATALOG.map(npc => [npc.id, npc])
)
