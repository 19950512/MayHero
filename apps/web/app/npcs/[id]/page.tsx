import { NPC_CATALOG } from '../../game/npcs'
import NpcPageClient from './NpcPageClient'

export function generateStaticParams() {
  return NPC_CATALOG.map(npc => ({ id: npc.id }))
}

export default async function NpcPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <NpcPageClient id={id} />
}
