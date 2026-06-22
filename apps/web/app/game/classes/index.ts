import type { HeroClass, HeroClassDefinition, Stats } from '../types'
import { archerClass } from './Archer.js'
import { druidClass } from './Druid.js'
import { knightClass } from './Knight.js'
import { mageClass } from './Mage.js'
import { paladinClass } from './Paladin.js'
import { warriorClass } from './Warrior.js'

export const HERO_CLASSES: HeroClassDefinition[] = [
  warriorClass,
  archerClass,
  mageClass,
  knightClass,
  paladinClass,
  druidClass,
] as HeroClassDefinition[]

export const HERO_CLASS_BY_ID: Record<HeroClass, HeroClassDefinition> = Object.fromEntries(
  HERO_CLASSES.map(heroClass => [heroClass.id, heroClass])
) as Record<HeroClass, HeroClassDefinition>

export const BASE_STATS: Record<HeroClass, Stats> = Object.fromEntries(
  HERO_CLASSES.map(heroClass => [heroClass.id, heroClass.baseStats])
) as Record<HeroClass, Stats>

export const LEVEL_STAT_GROWTH: Record<HeroClass, Partial<Stats>> = Object.fromEntries(
  HERO_CLASSES.map(heroClass => [heroClass.id, heroClass.statGrowth])
) as Record<HeroClass, Partial<Stats>>

export const CLASS_ICONS: Record<string, string> = Object.fromEntries(
  HERO_CLASSES.map(heroClass => [heroClass.id, heroClass.sigil])
) as Record<string, string>
