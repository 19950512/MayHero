import { z } from 'zod';
import { prisma } from '../db.js';
const ListItemBody = z.object({
    inventoryItemId: z.string(),
    price: z.number().int().min(1).max(1_000_000),
});
export async function shopRoutes(app) {
    // Browse shop (public)
    app.get('/shop', async (req) => {
        const page = Number(req.query.page ?? 1);
        const limit = 20;
        const skip = (page - 1) * limit;
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
        ]);
        return { listings, total, page, pages: Math.ceil(total / limit) };
    });
    // List an item for sale (auth required)
    app.post('/shop/list', { onRequest: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const body = ListItemBody.safeParse(req.body);
        if (!body.success)
            return reply.status(400).send({ error: body.error.issues[0].message });
        const hero = await prisma.hero.findUnique({ where: { userId: sub } });
        if (!hero)
            return reply.status(404).send({ error: 'Herói não encontrado.' });
        const item = await prisma.inventoryItem.findFirst({
            where: { id: body.data.inventoryItemId, heroId: hero.id },
        });
        if (!item)
            return reply.status(404).send({ error: 'Item não encontrado no inventário.' });
        // Ensure not already listed
        const existing = await prisma.shopListing.findFirst({
            where: { inventoryItemId: item.id, soldAt: null },
        });
        if (existing)
            return reply.status(409).send({ error: 'Item já está anunciado.' });
        const listing = await prisma.shopListing.create({
            data: {
                sellerId: hero.id,
                inventoryItemId: item.id,
                itemData: item.itemData,
                price: body.data.price,
            },
        });
        return listing;
    });
    // Buy an item
    app.post('/shop/buy/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const { id } = req.params;
        const buyer = await prisma.hero.findUnique({ where: { userId: sub } });
        if (!buyer)
            return reply.status(404).send({ error: 'Herói não encontrado.' });
        const listingPreview = await prisma.shopListing.findUnique({
            where: { id },
            select: { id: true, soldAt: true },
        });
        if (!listingPreview || listingPreview.soldAt) {
            return reply.status(404).send({ error: 'Anúncio não encontrado.' });
        }
        try {
            const boughtItem = await prisma.$transaction(async (tx) => {
                const freshListing = await tx.shopListing.findUnique({
                    where: { id },
                    include: { seller: true, inventoryItem: true },
                });
                if (!freshListing || freshListing.soldAt) {
                    throw new Error('Anúncio não encontrado.');
                }
                if (freshListing.sellerId === buyer.id) {
                    throw new Error('Você não pode comprar seu próprio item.');
                }
                const buyerPaid = await tx.hero.updateMany({
                    where: { id: buyer.id, gold: { gte: freshListing.price } },
                    data: { gold: { decrement: freshListing.price } },
                });
                if (buyerPaid.count === 0)
                    throw new Error('Ouro insuficiente.');
                await tx.hero.update({
                    where: { id: freshListing.sellerId },
                    data: { gold: { increment: freshListing.price } },
                });
                const sold = await tx.shopListing.updateMany({
                    where: { id: freshListing.id, soldAt: null },
                    data: { buyerId: buyer.id, soldAt: new Date() },
                });
                if (sold.count === 0) {
                    throw new Error('Este anúncio acabou de ser vendido.');
                }
                const transferred = await tx.inventoryItem.updateMany({
                    where: {
                        id: freshListing.inventoryItemId,
                        heroId: freshListing.sellerId,
                    },
                    data: { heroId: buyer.id },
                });
                if (transferred.count === 0) {
                    throw new Error('Item indisponível para transferência.');
                }
                return freshListing.itemData;
            });
            return { ok: true, item: boughtItem };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao comprar item.';
            const status = message === 'Anúncio não encontrado.' ? 404
                : message === 'Você não pode comprar seu próprio item.' ? 400
                    : message === 'Ouro insuficiente.' ? 400
                        : message === 'Este anúncio acabou de ser vendido.' ? 409
                            : 400;
            return reply.status(status).send({ error: message });
        }
    });
    // Remove own listing
    app.delete('/shop/listing/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const { id } = req.params;
        const hero = await prisma.hero.findUnique({ where: { userId: sub } });
        if (!hero)
            return reply.status(404).send({ error: 'Herói não encontrado.' });
        const listing = await prisma.shopListing.findUnique({ where: { id } });
        if (!listing || listing.soldAt)
            return reply.status(404).send({ error: 'Anúncio não encontrado.' });
        if (listing.sellerId !== hero.id)
            return reply.status(403).send({ error: 'Sem permissão.' });
        await prisma.shopListing.delete({ where: { id } });
        return { ok: true };
    });
    // My listings
    app.get('/shop/my', { onRequest: [app.authenticate] }, async (req) => {
        const { sub } = req.user;
        const hero = await prisma.hero.findUnique({ where: { userId: sub } });
        if (!hero)
            return [];
        return prisma.shopListing.findMany({
            where: { sellerId: hero.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    });
}
