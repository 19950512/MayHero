import type { Hero, Enemy, BattleLog, BattleState, Equipment, SkillAllocStat } from './types'
import { ZONES, XP_CURVE, LEVEL_STAT_GROWTH, BASE_STATS, EQUIPMENT_POOL } from './data'

const ZERO_ALLOC = { atk: 0, def: 0, maxHp: 0, spd: 0 }

const RARITY_WEIGHTS: Record<Equipment['rarity'], number> = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3,
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
  let phase: BattleState['phase'] = 'fighting'
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
    logs.push({ id: mkId(), turn, actor: 'hero', message: `${enemy.name} foi derrotado! ⚔️` })
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
      logs.push({ id: mkId(), turn, actor: 'enemy', message: `Você foi derrotado... 💀` })
      return { heroHp: 0, enemyHp, logs, phase: 'defeat' }
    }
  }

  return { heroHp, enemyHp, logs, phase }
}

export function applyVictory(hero: Hero, enemy: Enemy): { hero: Hero; goldEarned: number; xpEarned: number; leveledUp: boolean; itemDrop?: Equipment } {
  const goldEarned = Math.floor(Math.random() * (enemy.goldReward[1] - enemy.goldReward[0] + 1)) + enemy.goldReward[0]
  const xpEarned = enemy.xpReward

  let newHero: Hero = {
    ...hero,
    gold: hero.gold + goldEarned,
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

  // 15% chance for item drop, rarity-weighted
  let itemDrop: Equipment | undefined
  if (Math.random() < 0.15) {
    const eligible = EQUIPMENT_POOL.filter(e => e.requiredLevel <= newHero.level)
    if (eligible.length > 0) {
      const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0)
      let roll = Math.random() * totalWeight
      let pickedRarity: Equipment['rarity'] = 'common'
      for (const [r, w] of Object.entries(RARITY_WEIGHTS) as [Equipment['rarity'], number][]) {
        roll -= w
        if (roll <= 0) { pickedRarity = r; break }
      }
      const rarityPool = eligible.filter(e => e.rarity === pickedRarity)
      const finalPool = rarityPool.length > 0 ? rarityPool : eligible.filter(e => e.rarity === 'common')
      itemDrop = finalPool[Math.floor(Math.random() * finalPool.length)]
    }
  }

  return { hero: newHero, goldEarned, xpEarned, leveledUp, itemDrop }
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
