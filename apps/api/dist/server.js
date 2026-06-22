import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { prisma } from './db.js';
import { redis } from './redis.js';
import { authRoutes } from './routes/auth.js';
import { heroRoutes } from './routes/hero.js';
import { rankingRoutes } from './routes/rankings.js';
import { shopRoutes } from './routes/shop.js';
const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });
// Plugins
await app.register(cors, {
    origin: [
        'http://localhost:3069',
        'http://localhost:3070',
        process.env.WEB_URL ?? 'http://localhost:3069',
    ],
    credentials: true,
});
await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'mayhero-dev-secret-change-in-prod',
});
await app.register(websocket);
// In-memory rate limiter: 100 req/min per IP
const _rlMap = new Map();
app.addHook('onRequest', async (req, reply) => {
    const ip = req.ip;
    const now = Date.now();
    let entry = _rlMap.get(ip);
    if (!entry || entry.resetAt < now) {
        entry = { count: 0, resetAt: now + 60_000 };
        _rlMap.set(ip, entry);
    }
    entry.count++;
    if (entry.count > 100) {
        reply.header('Retry-After', '60');
        return reply.status(429).send({ error: 'Muitas requisições. Tente novamente em breve.' });
    }
});
// Auth decorator
app.decorate('authenticate', async (req, reply) => {
    try {
        await req.jwtVerify();
    }
    catch {
        reply.status(401).send({ error: 'Não autorizado.' });
    }
});
// Routes
await app.register(authRoutes);
await app.register(heroRoutes);
await app.register(rankingRoutes);
await app.register(shopRoutes);
// WebSocket: real-time leaderboard push
app.get('/ws', { websocket: true }, (socket) => {
    const send = (data) => {
        if (socket.readyState === 1)
            socket.send(JSON.stringify(data));
    };
    socket.on('message', async (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === 'ping') {
                send({ type: 'pong' });
                return;
            }
            if (msg.type === 'leaderboard:subscribe') {
                const top = await prisma.hero.findMany({
                    orderBy: [{ level: 'desc' }, { totalKills: 'desc' }],
                    take: 10,
                    select: { name: true, class: true, level: true, totalKills: true, user: { select: { username: true } } },
                });
                send({ type: 'leaderboard:update', data: top });
            }
        }
        catch { }
    });
    socket.on('error', () => { });
});
// Health check
app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }));
// Start
const port = Number(process.env.PORT ?? 3070);
const host = process.env.HOST ?? '0.0.0.0';
try {
    await redis.connect();
    console.log('[Redis] connected');
}
catch {
    console.warn('[Redis] unavailable — rankings will use DB fallback');
}
await app.listen({ port, host });
console.log(`[API] running on http://${host}:${port}`);
// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, async () => {
        await app.close();
        await prisma.$disconnect();
        await redis.quit();
        process.exit(0);
    });
}
