import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'

const TRANSFER_GOLD_COST = 500

const SendMailBody = z.object({
  targetHeroName: z.string().min(1).max(20),
  subject: z.string().min(1).max(60),
  message: z.string().max(500).default(''),
  gold: z.number().int().min(0).default(0),
  inventoryItemIds: z.array(z.string()).max(10).default([]),
})

export async function mailRoutes(app: FastifyInstance) {
  // GET /mail — inbox
  app.get('/mail', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return reply.status(404).send({ error: 'Herói não encontrado.' })

    const mails = await prisma.mail.findMany({
      where: { toHeroId: hero.id },
      include: {
        fromHero: { select: { name: true } },
        attachments: { select: { id: true, itemData: true, claimed: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return mails
  })

  // GET /mail/unread-count
  app.get('/mail/unread-count', { onRequest: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string }
    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return { count: 0 }

    const count = await prisma.mail.count({
      where: { toHeroId: hero.id, read: false },
    })
    return { count }
  })

  // PATCH /mail/:id/read — mark as read
  app.patch('/mail/:id/read', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return reply.status(404).send({ error: 'Herói não encontrado.' })

    const mail = await prisma.mail.findFirst({ where: { id, toHeroId: hero.id } })
    if (!mail) return reply.status(404).send({ error: 'Mensagem não encontrada.' })

    await prisma.mail.update({ where: { id }, data: { read: true } })
    return { ok: true }
  })

  // POST /mail/:id/claim — claim gold + items from mail
  app.post('/mail/:id/claim', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return reply.status(404).send({ error: 'Herói não encontrado.' })

    const mail = await prisma.mail.findFirst({
      where: { id, toHeroId: hero.id },
      include: { attachments: true },
    })
    if (!mail) return reply.status(404).send({ error: 'Mensagem não encontrada.' })

    if (mail.claimed && mail.attachments.every((a: { claimed: boolean }) => a.claimed)) {
      return reply.status(400).send({ error: 'Recompensas já recebidas.' })
    }

    const unclaimedAttachments = mail.attachments.filter((a: { claimed: boolean }) => !a.claimed)
    const unclaimedGold = mail.claimed ? 0 : mail.gold

    await prisma.$transaction(async tx => {
      // Give gold
      if (unclaimedGold > 0) {
        await tx.hero.update({
          where: { id: hero.id },
          data: { gold: { increment: unclaimedGold } },
        })
      }

      // Give items
      for (const att of unclaimedAttachments) {
        await tx.inventoryItem.create({
          data: { heroId: hero.id, itemData: att.itemData as object },
        })
        await tx.mailAttachment.update({ where: { id: att.id }, data: { claimed: true } })
      }

      // Mark mail claimed
      await tx.mail.update({ where: { id }, data: { claimed: true, read: true } })
    })

    return { ok: true, goldClaimed: unclaimedGold, itemsClaimed: unclaimedAttachments.length }
  })

  // DELETE /mail/:id — delete mail
  app.delete('/mail/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const hero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!hero) return reply.status(404).send({ error: 'Herói não encontrado.' })

    const mail = await prisma.mail.findFirst({
      where: { id, toHeroId: hero.id },
      include: { attachments: { where: { claimed: false } } },
    })
    if (!mail) return reply.status(404).send({ error: 'Mensagem não encontrada.' })

    const hasUnclaimedGold = !mail.claimed && mail.gold > 0
    if (hasUnclaimedGold || mail.attachments.length > 0) {
      return reply.status(400).send({ error: 'Colete os itens e ouro antes de deletar a mensagem.' })
    }

    await prisma.mail.delete({ where: { id } })
    return { ok: true }
  })

  // POST /mail/send — send mail to another hero (player-to-player)
  app.post('/mail/send', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const body = SendMailBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.issues[0].message })

    const senderHero = await prisma.hero.findUnique({ where: { userId: sub } })
    if (!senderHero) return reply.status(404).send({ error: 'Herói não encontrado.' })

    const targetHero = await prisma.hero.findFirst({
      where: { name: { equals: body.data.targetHeroName, mode: 'insensitive' } },
    })
    if (!targetHero) return reply.status(404).send({ error: 'Herói destinatário não encontrado.' })
    if (targetHero.id === senderHero.id) return reply.status(400).send({ error: 'Não é possível enviar para si mesmo.' })

    const { gold, inventoryItemIds } = body.data
    const totalCost = gold + (inventoryItemIds.length > 0 ? TRANSFER_GOLD_COST : 0)

    if (senderHero.gold < totalCost) {
      return reply.status(400).send({ error: `Ouro insuficiente. Custo: ${totalCost} (${gold} enviado + ${TRANSFER_GOLD_COST} taxa).` })
    }

    // Validate items belong to sender
    const items = inventoryItemIds.length > 0
      ? await prisma.inventoryItem.findMany({
          where: { id: { in: inventoryItemIds }, heroId: senderHero.id },
        })
      : []

    if (items.length !== inventoryItemIds.length) {
      return reply.status(400).send({ error: 'Um ou mais itens não encontrados no seu inventário.' })
    }

    // Check items are not listed in shop
    const listedIds = items.filter(i => i).map(i => i.id)
    const listedCheck = await prisma.shopListing.findMany({
      where: { inventoryItemId: { in: listedIds }, soldAt: null },
    })
    if (listedCheck.length > 0) {
      return reply.status(400).send({ error: 'Remova os itens do mercado antes de transferir.' })
    }

    await prisma.$transaction(async tx => {
      // Deduct gold from sender
      await tx.hero.update({
        where: { id: senderHero.id },
        data: { gold: { decrement: totalCost } },
      })

      // Create mail
      const mail = await tx.mail.create({
        data: {
          fromHeroId: senderHero.id,
          toHeroId: targetHero.id,
          subject: body.data.subject,
          message: body.data.message,
          gold,
        },
      })

      // Move items to mail attachments, remove from sender inventory
      for (const item of items) {
        await tx.mailAttachment.create({
          data: { mailId: mail.id, itemData: item.itemData as object },
        })
        await tx.inventoryItem.delete({ where: { id: item.id } })
      }
    })

    return { ok: true }
  })

  // GET /hero/search?q=name — search heroes by name
  app.get('/hero/search', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const query = (req.query as { q?: string }).q?.trim()
    if (!query || query.length < 2) return reply.status(400).send({ error: 'Busca deve ter ao menos 2 caracteres.' })

    const senderHero = await prisma.hero.findUnique({ where: { userId: sub } })

    const heroes = await prisma.hero.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        ...(senderHero ? { id: { not: senderHero.id } } : {}),
      },
      select: { id: true, name: true, class: true, level: true },
      take: 10,
    })

    return heroes
  })
}
