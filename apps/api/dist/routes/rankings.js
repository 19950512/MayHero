import { prisma } from '../db.js';
import { redis } from '../redis.js';
export async function rankingRoutes(app) {
    app.get('/rankings', async () => {
        // Fetch top 50 from Redis sorted set, fallback to DB
        try {
            const ids = await redis.zrevrange('leaderboard:level', 0, 49, 'WITHSCORES');
            if (ids.length > 0) {
                const heroIds = [];
                for (let i = 0; i < ids.length; i += 2)
                    heroIds.push(ids[i]);
                const heroes = await prisma.hero.findMany({
                    where: { id: { in: heroIds } },
                    select: {
                        id: true, name: true, class: true, level: true,
                        totalKills: true, gold: true, currentZone: true,
                        user: { select: { username: true } },
                    },
                });
                // Sort by leaderboard position
                const sorted = heroIds
                    .map(id => heroes.find(h => h.id === id))
                    .filter(Boolean);
                return { rankings: sorted, source: 'cache' };
            }
        }
        catch {
            // Redis unavailable — fall through to DB
        }
        const heroes = await prisma.hero.findMany({
            orderBy: [{ level: 'desc' }, { totalKills: 'desc' }],
            take: 50,
            select: {
                id: true, name: true, class: true, level: true,
                totalKills: true, gold: true, currentZone: true,
                user: { select: { username: true } },
            },
        });
        return { rankings: heroes, source: 'db' };
    });
    app.get('/rankings/kills', async () => {
        const heroes = await prisma.hero.findMany({
            orderBy: { totalKills: 'desc' },
            take: 50,
            select: {
                id: true, name: true, class: true, level: true,
                totalKills: true, gold: true, currentZone: true,
                user: { select: { username: true } },
            },
        });
        return { rankings: heroes };
    });
}
