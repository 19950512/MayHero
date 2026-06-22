import type { Equipment } from './types'

export type EnhancementCoreId =
  | 'nucleo_baixo'
  | 'nucleo_medio'
  | 'nucleo_alto'
  | 'nucleo_altissimo'
  | 'nucleo_baixo_perfeito'
  | 'nucleo_medio_perfeito'
  | 'nucleo_alto_perfeito'
  | 'nucleo_altissimo_perfeito'

export const ENHANCEMENT_MAX = 20
export const SAFE_ENHANCEMENT_MAX = 7  // up to +7: failure keeps current level

interface CoreInfo {
  tier: 1 | 2 | 3 | 4
  perfect: boolean
  minLevel: number  // minimum current enhancement to use this core
  maxLevel: number  // maximum current enhancement to use this core
}

export const CORE_INFO: Record<string, CoreInfo> = {
  nucleo_baixo:              { tier: 1, perfect: false, minLevel: 0,  maxLevel: 4  },
  nucleo_medio:              { tier: 2, perfect: false, minLevel: 5,  maxLevel: 9  },
  nucleo_alto:               { tier: 3, perfect: false, minLevel: 10, maxLevel: 14 },
  nucleo_altissimo:          { tier: 4, perfect: false, minLevel: 15, maxLevel: 19 },
  nucleo_baixo_perfeito:     { tier: 1, perfect: true,  minLevel: 0,  maxLevel: 4  },
  nucleo_medio_perfeito:     { tier: 2, perfect: true,  minLevel: 5,  maxLevel: 9  },
  nucleo_alto_perfeito:      { tier: 3, perfect: true,  minLevel: 10, maxLevel: 14 },
  nucleo_altissimo_perfeito: { tier: 4, perfect: true,  minLevel: 15, maxLevel: 19 },
}

// Success rate for each current enhancement level (attempting current → current+1)
const SUCCESS_RATES: number[] = [
  0.95, // +0 → +1
  0.90, // +1 → +2
  0.80, // +2 → +3
  0.70, // +3 → +4
  0.60, // +4 → +5
  0.50, // +5 → +6
  0.45, // +6 → +7
  0.35, // +7 → +8
  0.28, // +8 → +9
  0.22, // +9 → +10
  0.18, // +10 → +11
  0.14, // +11 → +12
  0.11, // +12 → +13
  0.09, // +13 → +14
  0.07, // +14 → +15
  0.05, // +15 → +16
  0.04, // +16 → +17
  0.03, // +17 → +18
  0.02, // +18 → +19
  0.01, // +19 → +20
]

export function getSuccessRate(currentEnhancement: number, perfect: boolean): number {
  if (perfect) return 1.0
  return SUCCESS_RATES[currentEnhancement] ?? 0
}

export function canUseCoreForLevel(coreId: string, currentLevel: number): boolean {
  const info = CORE_INFO[coreId]
  if (!info) return false
  return currentLevel >= info.minLevel && currentLevel <= info.maxLevel
}

export type EnhancementResult = {
  success: boolean
  newItem: Equipment
  prevLevel: number
  newLevel: number
  message: string
}

export function attemptEnhancement(item: Equipment, coreId: string): EnhancementResult {
  const current = item.enhancement ?? 0

  if (current >= ENHANCEMENT_MAX) {
    return { success: false, newItem: item, prevLevel: current, newLevel: current, message: 'Item já está no aprimoramento máximo (+20)!' }
  }

  const info = CORE_INFO[coreId]
  if (!info) {
    return { success: false, newItem: item, prevLevel: current, newLevel: current, message: 'Núcleo inválido.' }
  }

  if (!canUseCoreForLevel(coreId, current)) {
    const tierNames = ['Baixo (+1~+5)', 'Médio (+6~+10)', 'Alto (+11~+15)', 'Altíssimo (+16~+20)']
    return {
      success: false, newItem: item, prevLevel: current, newLevel: current,
      message: `Este núcleo é usado para ${tierNames[info.tier - 1]}. O item está em +${current}.`,
    }
  }

  const rate = getSuccessRate(current, info.perfect)
  const success = Math.random() < rate
  let newLevel: number
  let message: string

  if (success) {
    newLevel = current + 1
    message = `✅ Sucesso! ${item.name} ficou +${newLevel}!`
  } else if (current > SAFE_ENHANCEMENT_MAX) {
    newLevel = current - 1
    message = `❌ Falhou! ${item.name} voltou para +${newLevel}.`
  } else {
    newLevel = current
    message = `❌ Falhou! ${item.name} permanece em +${current}.`
  }

  return {
    success,
    newItem: { ...item, enhancement: newLevel },
    prevLevel: current,
    newLevel,
    message,
  }
}

export function getItemDisplayName(item: Equipment): string {
  const level = item.enhancement ?? 0
  return level > 0 ? `${item.name} +${level}` : item.name
}

// Bonus added per enhancement level for a stat with given base value
export function enhanceBonusPerLevel(baseValue: number): number {
  return Math.max(1, Math.round(baseValue * 0.10))
}

// Effective bonuses considering enhancement level
export function getEnhancedBonuses(item: Equipment): Equipment['bonuses'] {
  const level = item.enhancement ?? 0
  if (level === 0) return item.bonuses

  const result: Equipment['bonuses'] = {}
  for (const [key, rawVal] of Object.entries(item.bonuses)) {
    const base = rawVal as number
    ;(result as Record<string, number>)[key] = base + enhanceBonusPerLevel(base) * level
  }
  return result
}

// NPC Store stock — cores sold for gold
export interface NpcStoreEntry {
  itemId: string
  name: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  price: number
  description: string
  perfect: boolean
  tier: 1 | 2 | 3 | 4
}

export const NPC_STORE: NpcStoreEntry[] = [
  {
    itemId: 'nucleo_baixo',
    name: 'Núcleo de Aprimoramento Baixo',
    icon: '🔸',
    rarity: 'common',
    price: 100,
    description: 'Usado para aprimorar itens de +1 a +5. Pode falhar sem punição.',
    perfect: false,
    tier: 1,
  },
  {
    itemId: 'nucleo_medio',
    name: 'Núcleo de Aprimoramento Médio',
    icon: '🔶',
    rarity: 'rare',
    price: 500,
    description: 'Usado para aprimorar itens de +6 a +10.',
    perfect: false,
    tier: 2,
  },
  {
    itemId: 'nucleo_alto',
    name: 'Núcleo de Aprimoramento Alto',
    icon: '💠',
    rarity: 'epic',
    price: 2500,
    description: 'Usado para aprimorar itens de +11 a +15.',
    perfect: false,
    tier: 3,
  },
  {
    itemId: 'nucleo_altissimo',
    name: 'Núcleo de Aprimoramento Altíssimo',
    icon: '💎',
    rarity: 'legendary',
    price: 10000,
    description: 'Usado para aprimorar itens de +16 a +20. Extremamente difícil.',
    perfect: false,
    tier: 4,
  },
  {
    itemId: 'nucleo_baixo_perfeito',
    name: 'Núcleo Baixo Perfeito',
    icon: '✨',
    rarity: 'common',
    price: 400,
    description: 'Garante 100% de sucesso para +1 a +5.',
    perfect: true,
    tier: 1,
  },
  {
    itemId: 'nucleo_medio_perfeito',
    name: 'Núcleo Médio Perfeito',
    icon: '🌟',
    rarity: 'rare',
    price: 2000,
    description: 'Garante 100% de sucesso para +6 a +10.',
    perfect: true,
    tier: 2,
  },
  {
    itemId: 'nucleo_alto_perfeito',
    name: 'Núcleo Alto Perfeito',
    icon: '⭐',
    rarity: 'epic',
    price: 10000,
    description: 'Garante 100% de sucesso para +11 a +15.',
    perfect: true,
    tier: 3,
  },
  {
    itemId: 'nucleo_altissimo_perfeito',
    name: 'Núcleo Altíssimo Perfeito',
    icon: '🏆',
    rarity: 'legendary',
    price: 40000,
    description: 'Garante 100% de sucesso para +16 a +20.',
    perfect: true,
    tier: 4,
  },
]
