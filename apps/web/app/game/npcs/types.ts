export interface NpcSellEntry {
  itemId: string
  price: number
  quantity: number
}

export interface NpcBuyEntry {
  itemId: string
  price: number
}

export interface NpcDefinition {
  id: string
  name: string
  lore: string
  image: string
  sprite?: string
  phrases: string[]
  sells: NpcSellEntry[]
  buys: NpcBuyEntry[]
}
