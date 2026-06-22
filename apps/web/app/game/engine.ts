import type { Hero, Enemy, BattleLog, BattleState, Equipment, ItemDefinition, SkillAllocStat } from './types'
import { ZONES, XP_CURVE, LEVEL_STAT_GROWTH, BASE_STATS, ITEM_BY_ID, MONSTER_BY_ID } from './data'

const ZERO_ALLOC = { atk: 0, def: 0, maxHp: 0, spd: 0 }

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

  for (const equip of Object.values(hero.equipment)) {
    if (!equip) continue
    for (const [key, val] of Object.entries(equip.bonuses)) {
      const k = key as keyof typeof base
      if (k in base) (base[k] as number) += val as number
    }
  }

  const alloc = hero.skillAllocations ?? ZERO_ALLOC
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

export function pickEnemy(zone: number, killCount: number): Enemy {
  const zoneData = ZONES.find(z => z.id === zone) ?? ZONES[0]
  const isBoss = killCount > 0 && killCount % zoneData.bossEvery === 0
  const enemies = zoneData.enemies.filter(e => e.isBoss === isBoss)
  return { ...enemies[Math.floor(Math.random() * enemies.length)] }
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

export function equipItem(hero: Hero, item: Equipment): Hero {
  const newEquipment = { ...hero.equipment, [item.slot]: item }
  const newBaseStats = getBaseStatsForLevel(hero)
  const newHero = { ...hero, equipment: newEquipment, baseStats: newBaseStats }
  const newStats = computeStats(newHero)
  return { ...newHero, stats: { ...newStats, hp: Math.min(newStats.maxHp, hero.stats.hp) } }
}

export function allocateSkillPoint(hero: Hero, stat: SkillAllocStat): Hero | null {
  if (hero.skillPoints <= 0) return null
  const prev = hero.skillAllocations ?? ZERO_ALLOC
  const newAllocations = { ...prev, [stat]: prev[stat] + 1 }
  const updated = { ...hero, skillPoints: hero.skillPoints - 1, skillAllocations: newAllocations }
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
    gold: 0,
    totalKills: 0,
    skillPoints: 0,
    skillAllocations: { atk: 0, def: 0, maxHp: 0, spd: 0 },
  }
  return hero
}
