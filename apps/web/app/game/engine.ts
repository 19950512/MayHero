import type { Hero, HeroLoadout, Enemy, BattleLog, BattleState, Equipment, ItemDefinition, SkillAllocStat } from './types'
import { DUNGEON_BY_ID, XP_CURVE, LEVEL_STAT_GROWTH, BASE_STATS, ITEM_BY_ID, MONSTER_BY_ID } from './data'
import { getEnhancedBonuses } from './enhancement'

const ZERO_ALLOC = { atk: 0, def: 0, maxHp: 0, spd: 0 }
const SKILL_ALLOC_ORDER: SkillAllocStat[] = ['atk', 'def', 'maxHp', 'spd']

function getSkillPointsEarnedByLevel(level: number): number {
  return Math.max(0, level - 1)
}

export function normalizeSkillAllocationsForLevel(hero: Hero): Hero['skillAllocations'] {
  const raw = hero.skillAllocations ?? ZERO_ALLOC
  const cap = getSkillPointsEarnedByLevel(hero.level)
  let remaining = cap

  const normalized: Hero['skillAllocations'] = { atk: 0, def: 0, maxHp: 0, spd: 0 }
  for (const stat of SKILL_ALLOC_ORDER) {
    const value = Math.max(0, Math.floor(raw[stat] ?? 0))
    const taken = Math.min(value, remaining)
    normalized[stat] = taken
    remaining -= taken
  }

  return normalized
}

const RARITY_PRIORITY: Record<Equipment['rarity'], number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
}

interface ResolvedMonsterDrop {
  item: ItemDefinition
  quantity: number
}

interface StackableDropResult {
  itemId: string
  name: string
  quantity: number
}

const EMPTY_LOADOUT: HeroLoadout = {
  accessories: {
    amulet: undefined,
    ring1: undefined,
    ring2: undefined,
    ring3: undefined,
    ring4: undefined,
    cornalina1: undefined,
    cornalina2: undefined,
    talisma1: undefined,
    talisma2: undefined,
    belt: undefined,
    earring1: undefined,
    earring2: undefined,
  },
  equipment: {
    head: undefined,
    body: undefined,
    legs: undefined,
    boots: undefined,
    offhand: undefined,
    mainhand: undefined,
  },
  pets: {
    pet1: undefined,
    pet2: undefined,
  },
}

function getLegacyLoadout(hero: Hero): HeroLoadout {
  return {
    ...EMPTY_LOADOUT,
    accessories: {
      ...EMPTY_LOADOUT.accessories,
      ring1: hero.equipment.ring,
    },
    equipment: {
      ...EMPTY_LOADOUT.equipment,
      head: hero.equipment.helm,
      body: hero.equipment.armor,
      mainhand: hero.equipment.weapon,
    },
    pets: { ...EMPTY_LOADOUT.pets },
  }
}

export function getHeroLoadout(hero: Hero): HeroLoadout {
  if (!hero.loadout) return getLegacyLoadout(hero)
  return {
    accessories: {
      ...EMPTY_LOADOUT.accessories,
      ...hero.loadout.accessories,
    },
    equipment: {
      ...EMPTY_LOADOUT.equipment,
      ...hero.loadout.equipment,
    },
    pets: {
      ...EMPTY_LOADOUT.pets,
      ...hero.loadout.pets,
    },
  }
}

export function buildLegacyEquipmentFromLoadout(loadout: HeroLoadout): Hero['equipment'] {
  return {
    weapon: loadout.equipment.mainhand,
    armor: loadout.equipment.body,
    helm: loadout.equipment.head,
    ring: loadout.accessories.ring1,
  }
}

export function unequipItem(hero: Hero, item: Equipment): { hero: Hero } | null {
  const loadout = getHeroLoadout(hero)

  const matches = (a?: Equipment) =>
    !!a && a.id === item.id && a.slot === item.slot && a.rarity === item.rarity &&
    a.name === item.name && (a.enhancement ?? 0) === (item.enhancement ?? 0)

  let found = false

  const eqKeys = ['head', 'body', 'legs', 'boots', 'offhand', 'mainhand'] as const
  for (const key of eqKeys) {
    if (matches(loadout.equipment[key])) {
      loadout.equipment[key] = undefined
      found = true
      break
    }
  }

  if (!found) {
    const accKeys = ['amulet', 'ring1', 'ring2', 'ring3', 'ring4', 'cornalina1', 'cornalina2', 'talisma1', 'talisma2', 'belt', 'earring1', 'earring2'] as const
    for (const key of accKeys) {
      if (matches(loadout.accessories[key])) {
        loadout.accessories[key] = undefined
        found = true
        break
      }
    }
  }

  if (!found) return null

  const newEquipment = buildLegacyEquipmentFromLoadout(loadout)
  const newBaseStats = getBaseStatsForLevel(hero)
  const newHero = { ...hero, equipment: newEquipment, loadout, baseStats: newBaseStats }
  const newStats = computeStats(newHero)
  return { hero: { ...newHero, stats: { ...newStats, hp: Math.min(newStats.maxHp, hero.stats.hp) } } }
}

function getEquippedItemsFromLoadout(loadout: HeroLoadout): Equipment[] {
  return [
    loadout.equipment.mainhand,
    loadout.equipment.offhand,
    loadout.equipment.head,
    loadout.equipment.body,
    loadout.equipment.legs,
    loadout.equipment.boots,
    loadout.accessories.amulet,
    loadout.accessories.ring1,
    loadout.accessories.ring2,
    loadout.accessories.ring3,
    loadout.accessories.ring4,
    loadout.accessories.cornalina1,
    loadout.accessories.cornalina2,
    loadout.accessories.talisma1,
    loadout.accessories.talisma2,
    loadout.accessories.belt,
    loadout.accessories.earring1,
    loadout.accessories.earring2,
    loadout.pets.pet1,
    loadout.pets.pet2,
  ].filter((item): item is Equipment => !!item)
}

function resolveMonsterDrops(enemy: Enemy): ResolvedMonsterDrop[] {
  const monster = MONSTER_BY_ID[enemy.id]
  if (!monster) return []

  const drops: ResolvedMonsterDrop[] = []
  for (const drop of monster.drops) {
    if (Math.random() > drop.chance) continue
    const item = ITEM_BY_ID[drop.itemId]
    if (!item) continue

    const minQ = drop.minQuantity ?? 1
    const maxQ = drop.maxQuantity ?? minQ
    const quantity = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ
    drops.push({ item, quantity })
  }

  return drops
}

export function computeStats(hero: Hero): Hero['stats'] {
  const base = { ...hero.baseStats }
  const loadout = getHeroLoadout(hero)
  const equippedItems = getEquippedItemsFromLoadout(loadout)

  for (const equip of equippedItems) {
    for (const [key, val] of Object.entries(getEnhancedBonuses(equip))) {
      const k = key as keyof typeof base
      if (k in base) (base[k] as number) += val as number
    }
  }

  const alloc = normalizeSkillAllocationsForLevel(hero)
  base.atk += alloc.atk * 2
  base.def += alloc.def
  base.maxHp += alloc.maxHp * 10
  base.spd += alloc.spd

  base.hp = Math.min(base.hp, base.maxHp)
  return base
}

export function getBaseStatsForLevel(hero: Hero): Hero['baseStats'] {
  const growth = LEVEL_STAT_GROWTH[hero.class]
  const base = { ...BASE_STATS[hero.class] }
  const lvl = hero.level - 1

  base.maxHp = Math.floor(base.maxHp + (growth.maxHp ?? 0) * lvl)
  base.atk = Math.floor(base.atk + (growth.atk ?? 0) * lvl)
  base.def = Math.floor(base.def + (growth.def ?? 0) * lvl)
  base.spd = Math.floor(base.spd + (growth.spd ?? 0) * lvl)
  base.crit = Math.min(75, Math.floor(base.crit + (growth.crit ?? 0) * lvl))
  base.hp = base.maxHp
  base.maxMp = base.maxMp
  base.mp = base.maxMp
  return base
}

export function pickEnemy(dungeonId: string, killCount: number): Enemy {
  const dungeon = DUNGEON_BY_ID[dungeonId] ?? Object.values(DUNGEON_BY_ID)[0]
  const isBoss = killCount > 0 && killCount % dungeon.bossEvery === 0
  const pool = dungeon.monsters.filter(m => m.isBoss === isBoss)
  const monster = pool[Math.floor(Math.random() * pool.length)]
  const { drops: _drops, ...enemy } = monster
  return { ...enemy }
}

function rollDamage(atk: number, def: number, critChance: number): { dmg: number; isCrit: boolean } {
  const isCrit = Math.random() * 100 < critChance
  const base = Math.max(1, atk - def + Math.floor(Math.random() * 4) - 2)
  const dmg = isCrit ? Math.floor(base * 1.8) : base
  return { dmg, isCrit }
}

export function simulateBattleTick(
  hero: Hero,
  battle: BattleState,
  currentHp: number,
): {
  heroHp: number
  enemyHp: number
  logs: BattleLog[]
  phase: BattleState['phase']
} {
  const logs: BattleLog[] = []
  let heroHp = currentHp
  let enemyHp = battle.enemyCurrentHp
  const enemy = battle.enemy!
  const stats = computeStats(hero)
  const phase: BattleState['phase'] = 'fighting'
  const turn = battle.turn + 1
  const mkId = () => `${turn}-${Math.random().toString(36).slice(2, 6)}`

  // Hero attacks
  const heroAtk = rollDamage(stats.atk, enemy.stats.def, stats.crit)
  enemyHp = Math.max(0, enemyHp - heroAtk.dmg)
  logs.push({
    id: mkId(),
    turn,
    actor: 'hero',
    message: heroAtk.isCrit
      ? `CRÍTICO! Você causa ${heroAtk.dmg} de dano em ${enemy.name}!`
      : `Você ataca ${enemy.name} causando ${heroAtk.dmg} de dano.`,
    damage: heroAtk.dmg,
    isCrit: heroAtk.isCrit,
  })

  if (enemyHp <= 0) {
    logs.push({ id: mkId(), turn, actor: 'hero', message: `${enemy.name} foi derrotado!` })
    return { heroHp, enemyHp: 0, logs, phase: 'victory' }
  }

  // Enemy attacks (faster enemies may attack twice)
  const attackTimes = enemy.stats.spd > stats.spd + 4 ? 2 : 1
  for (let i = 0; i < attackTimes; i++) {
    const enemyAtk = rollDamage(enemy.stats.atk, stats.def, enemy.stats.crit)
    heroHp = Math.max(0, heroHp - enemyAtk.dmg)
    logs.push({
      id: mkId(),
      turn,
      actor: 'enemy',
      message: enemyAtk.isCrit
        ? `CRÍTICO! ${enemy.name} causa ${enemyAtk.dmg} de dano em você!`
        : `${enemy.name} ataca causando ${enemyAtk.dmg} de dano.`,
      damage: enemyAtk.dmg,
      isCrit: enemyAtk.isCrit,
    })

    if (heroHp <= 0) {
      logs.push({ id: mkId(), turn, actor: 'enemy', message: `Você foi derrotado...` })
      return { heroHp: 0, enemyHp, logs, phase: 'defeat' }
    }
  }

  return { heroHp, enemyHp, logs, phase }
}

export function applyVictory(hero: Hero, enemy: Enemy): {
  hero: Hero
  goldEarned: number
  xpEarned: number
  leveledUp: boolean
  itemDrop?: Equipment
  stackableDrops: StackableDropResult[]
} {
  const baseGoldEarned = Math.floor(Math.random() * (enemy.goldReward[1] - enemy.goldReward[0] + 1)) + enemy.goldReward[0]
  const xpEarned = enemy.xpReward

  let newHero: Hero = {
    ...hero,
    gold: hero.gold + baseGoldEarned,
    xp: hero.xp + xpEarned,
    totalKills: hero.totalKills + 1,
  }

  let leveledUp = false
  while (newHero.xp >= newHero.xpToNext) {
    newHero.xp -= newHero.xpToNext
    newHero.level += 1
    newHero.xpToNext = XP_CURVE(newHero.level)
    newHero.skillPoints += 1
    newHero.baseStats = getBaseStatsForLevel(newHero)
    leveledUp = true
  }

  // Recompute full HP after level up
  const finalStats = computeStats(newHero)
  if (leveledUp) {
    newHero = {
      ...newHero,
      stats: { ...finalStats, hp: finalStats.maxHp, mp: finalStats.maxMp },
    }
  } else {
    newHero = { ...newHero, stats: finalStats }
  }

  const resolvedDrops = resolveMonsterDrops(enemy)
  let extraGoldFromDrops = 0
  const stackableDrops: StackableDropResult[] = []

  let itemDrop: Equipment | undefined

  const rarityScore = (rarity: Equipment['rarity']) => RARITY_PRIORITY[rarity]
  const sortedDrops = [...resolvedDrops].sort((a, b) => {
    if (a.item.category !== 'equipment' && b.item.category === 'equipment') return 1
    if (a.item.category === 'equipment' && b.item.category !== 'equipment') return -1
    if (a.item.rarity !== b.item.rarity) return rarityScore(b.item.rarity) - rarityScore(a.item.rarity)
    return 0
  })

  for (const resolved of sortedDrops) {
    const item = resolved.item
    if (item.category === 'currency' && item.id === 'gold_coin') {
      extraGoldFromDrops += resolved.quantity
      continue
    }

    if (item.category === 'equipment') {
      if (itemDrop || item.requiredLevel > newHero.level) continue
      itemDrop = {
        id: item.id,
        name: item.name,
        slot: item.slot,
        rarity: item.rarity,
        bonuses: item.bonuses,
        icon: item.icon,
        requiredLevel: item.requiredLevel,
      }
      continue
    }

    stackableDrops.push({
      itemId: item.id,
      name: item.name,
      quantity: resolved.quantity,
    })
  }

  if (extraGoldFromDrops > 0) {
    newHero = { ...newHero, gold: newHero.gold + extraGoldFromDrops }
  }

  return {
    hero: newHero,
    goldEarned: baseGoldEarned + extraGoldFromDrops,
    xpEarned,
    leveledUp,
    itemDrop,
    stackableDrops,
  }
}

export function applyDefeat(hero: Hero): Hero {
  // On defeat: lose 10% gold, heal to 50%
  const stats = computeStats(hero)
  return {
    ...hero,
    gold: Math.floor(hero.gold * 0.9),
    stats: { ...stats, hp: Math.floor(stats.maxHp * 0.5) },
  }
}

export function healHero(hero: Hero, amount: number): Hero {
  const stats = computeStats(hero)
  const newHp = Math.min(stats.maxHp, hero.stats.hp + amount)
  return { ...hero, stats: { ...hero.stats, hp: newHp } }
}

export function equipItem(hero: Hero, item: Equipment): { hero: Hero; replacedItem?: Equipment } {
  const loadout = getHeroLoadout(hero)
  let replacedItem: Equipment | undefined

  if (item.slot === 'weapon') {
    replacedItem = loadout.equipment.mainhand
    loadout.equipment.mainhand = item
  }

  if (item.slot === 'armor') {
    replacedItem = loadout.equipment.body
    loadout.equipment.body = item
  }

  if (item.slot === 'helm') {
    replacedItem = loadout.equipment.head
    loadout.equipment.head = item
  }

  if (item.slot === 'ring') {
    const ringSlots: Array<keyof HeroLoadout['accessories']> = ['ring1', 'ring2', 'ring3', 'ring4']
    const firstEmpty = ringSlots.find(slot => !loadout.accessories[slot])
    const targetSlot = firstEmpty ?? 'ring1'
    replacedItem = loadout.accessories[targetSlot]
    loadout.accessories[targetSlot] = item
  }

  const newEquipment = buildLegacyEquipmentFromLoadout(loadout)
  const newBaseStats = getBaseStatsForLevel(hero)
  const newHero = { ...hero, equipment: newEquipment, loadout, baseStats: newBaseStats }
  const newStats = computeStats(newHero)
  return {
    hero: { ...newHero, stats: { ...newStats, hp: Math.min(newStats.maxHp, hero.stats.hp) } },
    replacedItem,
  }
}

export function allocateSkillPoint(hero: Hero, stat: SkillAllocStat): Hero | null {
  const prev = normalizeSkillAllocationsForLevel(hero)
  const spent = prev.atk + prev.def + prev.maxHp + prev.spd
  const earned = getSkillPointsEarnedByLevel(hero.level)
  const available = Math.max(0, earned - spent)
  if (available <= 0) return null

  const newAllocations = { ...prev, [stat]: prev[stat] + 1 }
  const updated = { ...hero, skillPoints: available - 1, skillAllocations: newAllocations }
  const newStats = computeStats(updated)
  return { ...updated, stats: { ...newStats, hp: Math.min(newStats.maxHp, hero.stats.hp) } }
}

export function createHero(name: string, heroClass: Hero['class']): Hero {
  const base = { ...BASE_STATS[heroClass] }
  const hero: Hero = {
    name,
    class: heroClass,
    level: 1,
    xp: 0,
    xpToNext: XP_CURVE(1),
    baseStats: base,
    stats: { ...base },
    equipment: {},
    loadout: { ...EMPTY_LOADOUT, accessories: { ...EMPTY_LOADOUT.accessories }, equipment: { ...EMPTY_LOADOUT.equipment }, pets: { ...EMPTY_LOADOUT.pets } },
    gold: 0,
    totalKills: 0,
    skillPoints: 0,
    skillAllocations: { atk: 0, def: 0, maxHp: 0, spd: 0 },
  }
  return hero
}
