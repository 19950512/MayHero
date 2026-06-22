import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'

const ListItemBody = z.object({
  inventoryItemId: z.string(),
  price: z.number().int().min(1).max(1_000_000),
})

export async function shopRoutes(app: FastifyInstance) {
  // Browse shop (public)
  app.get('/shop', async (req) => {
    const page = Number((req.query as Record<string, string>).page ?? 1)
    const limit = 20
    const skip = (page - 1) * limit

    const [listings, total] = await Promise.all([
      prisma.shopListing.findMany({
        where: { soldAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          itemData: true,
          price: true,
          createdAt: true,
          seller: { select: { name: true, level: true } },
        },
      }),
      prisma.shopListing.count({ where: { soldAt: null } }),
    ])

    return { listings, total, page, pages: Math.ceil(total / limit) }
  })

  // List an item for sale (auth required)
  app.post('/shop/list', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const body = ListItemBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.issues[0].message })

    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return reply.status(404).send({ error: 'Herói não encontrado.' })

    const item = await prisma.inventoryItem.findFirst({
      where: { id: body.data.inventoryItemId, heroId: hero.id },
    })
    if (!item) return reply.status(404).send({ error: 'Item não encontrado no inventário.' })

    // Ensure not already listed
    const existing = await prisma.shopListing.findFirst({
      where: { inventoryItemId: item.id, soldAt: null },
    })
    if (existing) return reply.status(409).send({ error: 'Item já está anunciado.' })

    const listing = await prisma.shopListing.create({
      data: {
        sellerId: hero.id,
        inventoryItemId: item.id,
        itemData: item.itemData as object,
        price: body.data.price,
      },
    })
    return listing
  })

  // Buy an item
  app.post('/shop/buy/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }

    const buyer = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!buyer) return reply.status(404).send({ error: 'Herói não encontrado.' })

    const listing = await prisma.shopListing.findUnique({
      where: { id },
      include: { seller: true },
    })

    if (!listing || listing.soldAt) return reply.status(404).send({ error: 'Anúncio não encontrado.' })
    if (listing.sellerId === buyer.id) return reply.status(400).send({ error: 'Você não pode comprar seu próprio item.' })
    if (buyer.gold < listing.price) return reply.status(400).send({ error: 'Ouro insuficiente.' })

    // Transaction: deduct gold from buyer, add to seller, transfer item
    await prisma.$transaction([
      // Deduct buyer gold
      prisma.hero.update({ where: { id: buyer.id }, data: { gold: { decrement: listing.price } } }),
      // Add gold to seller
      prisma.hero.update({ where: { id: listing.sellerId }, data: { gold: { increment: listing.price } } }),
      // Mark listing as sold
      prisma.shopListing.update({ where: { id }, data: { buyerId: buyer.id, soldAt: new Date() } }),
      // Transfer inventory item to buyer
      prisma.inventoryItem.update({ where: { id: listing.inventoryItemId }, data: { heroId: buyer.id } }),
    ])

    return { ok: true, item: listing.itemData }
  })

  // Remove own listing
  app.delete('/shop/listing/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }

    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return reply.status(404).send({ error: 'Herói não encontrado.' })

    const listing = await prisma.shopListing.findUnique({ where: { id } })
    if (!listing || listing.soldAt) return reply.status(404).send({ error: 'Anúncio não encontrado.' })
    if (listing.sellerId !== hero.id) return reply.status(403).send({ error: 'Sem permissão.' })

    await prisma.shopListing.delete({ where: { id } })
    return { ok: true }
  })

  // My listings
  app.get('/shop/my', { onRequest: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string }
    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return []

    return prisma.shopListing.findMany({
      where: { sellerId: hero.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  })
}
