import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { redis } from '../redis.js'

const HERO_CLASSES = ['warrior', 'archer', 'mage', 'knight', 'paladin', 'druid'] as const

const CreateHeroBody = z.object({
  name: z.string().min(1).max(20),
  class: z.enum(HERO_CLASSES),
  stats: z.record(z.unknown()),
  baseStats: z.record(z.unknown()),
})

const SyncHeroBody = z.object({
  name: z.string().min(1).max(20),
  class: z.enum(HERO_CLASSES),
  level: z.number().int().min(1),
  xp: z.number().int().min(0),
  xpToNext: z.number().int().min(1),
  gold: z.number().int().min(0),
  totalKills: z.number().int().min(0),
  skillPoints: z.number().int().min(0),
  currentZone: z.number().int().min(1),
  stats: z.record(z.unknown()),
  baseStats: z.record(z.unknown()),
  equipment: z.record(z.unknown()),
  inventory: z.array(z.record(z.unknown())),
})

export async function heroRoutes(app: FastifyInstance) {
  app.get('/hero/inventory', { onRequest: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string }
    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return []
    return prisma.inventoryItem.findMany({
      where: { heroId: hero.id },
      select: { id: true, itemData: true },
    })
  })

  app.get('/hero', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const hero = await prisma.hero.findUnique({
      where: { userId: sub },
      include: { inventory: true },
    })
    if (!hero) return reply.status(404).send({ error: 'Herói não encontrado.' })
    return hero
  })

  app.post('/hero', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const body = CreateHeroBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.issues[0].message })

    const existing = await prisma.hero.findUnique({ where: { userId: sub } })
    if (existing) return reply.status(409).send({ error: 'Herói já existe.' })

    const hero = await prisma.hero.create({
      data: {
        userId: sub,
        name: body.data.name,
        class: body.data.class,
        statsJson: body.data.stats as object,
        baseStatsJson: body.data.baseStats as object,
        equipJson: {},
      },
    })
    return hero
  })

  app.patch('/hero/sync', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const body = SyncHeroBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.issues[0].message })

    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return reply.status(404).send({ error: 'Herói não encontrado.' })

    // Basic anti-cheat: level can't jump more than 1 per sync
    if (body.data.level > hero.level + 5) {
      return reply.status(400).send({ error: 'Progressão inválida.' })
    }

    const { inventory: inventoryData, equipment, ...heroData } = body.data

    // Sync hero core state
    const updatedHero = await prisma.hero.update({
      where: { userId: sub },
      data: {
        name: heroData.name,
        class: heroData.class,
        level: heroData.level,
        xp: heroData.xp,
        xpToNext: heroData.xpToNext,
        gold: heroData.gold,
        totalKills: heroData.totalKills,
        skillPoints: heroData.skillPoints,
        currentZone: heroData.currentZone,
        statsJson: heroData.stats as object,
        baseStatsJson: heroData.baseStats as object,
        equipJson: equipment as object,
      },
    })

    // Sync inventory: replace all non-listed items
    const listedItemIds = (await prisma.shopListing.findMany({
      where: { sellerId: hero.id, soldAt: null },
      select: { inventoryItemId: true },
    })).map(l => l.inventoryItemId)

    // Delete unlisted inventory items
    await prisma.inventoryItem.deleteMany({
      where: { heroId: hero.id, id: { notIn: listedItemIds } },
    })

    // Re-insert current inventory
    if (inventoryData.length > 0) {
      await prisma.inventoryItem.createMany({
        data: inventoryData.map(item => ({
          heroId: hero.id,
          itemData: item as object,
        })),
      })
    }

    // Update Redis leaderboard
    await redis.zadd('leaderboard:level', updatedHero.level, hero.id)
    await redis.zadd('leaderboard:kills', updatedHero.totalKills, hero.id)

    return { ok: true }
  })

  // Rename hero
  app.patch('/hero/rename', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const body = z.object({ name: z.string().min(1).max(20) }).safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.issues[0].message })

    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return reply.status(404).send({ error: 'Herói não encontrado.' })

    await prisma.hero.update({ where: { id: hero.id }, data: { name: body.data.name } })
    return { ok: true, name: body.data.name }
  })
}
