import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import { prisma } from './db.js'
import { redis } from './redis.js'
import { authRoutes } from './routes/auth.js'
import { heroRoutes } from './routes/hero.js'
import { mailRoutes } from './routes/mail.js'
import { rankingRoutes } from './routes/rankings.js'
import { shopRoutes } from './routes/shop.js'

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } })
const isProd = process.env.NODE_ENV === 'production'
const jwtSecret = process.env.JWT_SECRET
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'mayhero_token'

if (isProd && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET inválido: em produção defina um segredo forte com no mínimo 32 caracteres.')
}

const effectiveJwtSecret = jwtSecret ?? 'mayhero-dev-secret-local-only'

// Plugins
const allowedOrigins = new Set([
  'http://localhost:3069',
  'http://localhost:3070',
  process.env.WEB_URL ?? 'http://localhost:3069',
])

await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.has(origin)) return callback(null, true)
    // Electron serves static files from http://127.0.0.1:<random-port>
    if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'), false)
  },
  credentials: true,
})

await app.register(cookie)

await app.register(jwt, {
  secret: effectiveJwtSecret,
})

await app.register(websocket)

let redisLimiterEnabled = false
const _rlMap = new Map<string, { count: number; resetAt: number }>()

function bucketForPath(pathname: string): { bucket: string; limit: number } {
  if (pathname === '/auth/login' || pathname === '/auth/register') return { bucket: 'auth', limit: 20 }
  if (pathname === '/auth/me' || pathname === '/auth/logout') return { bucket: 'auth_session', limit: 60 }
  if (pathname === '/hero/sync') return { bucket: 'sync', limit: 50 }
  if (pathname.startsWith('/shop/buy')) return { bucket: 'buy', limit: 30 }
  return { bucket: 'default', limit: 120 }
}

function fallbackRateLimit(key: string, limit: number): boolean {
  const now = Date.now()
  let entry = _rlMap.get(key)
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + 60_000 }
    _rlMap.set(key, entry)
  }
  entry.count++
  return entry.count <= limit
}

app.addHook('onRequest', async (req, reply) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  const { bucket, limit } = bucketForPath(pathname)
  const ua = (req.headers['user-agent'] ?? 'unknown').toString().slice(0, 120)
  const identity = `${req.ip}:${ua}`
  const minuteBucket = Math.floor(Date.now() / 60_000)
  const key = `rl:v2:${bucket}:${minuteBucket}:${identity}`

  let allowed = true
  if (redisLimiterEnabled) {
    try {
      const hits = await redis.incr(key)
      if (hits === 1) await redis.expire(key, 120)
      allowed = hits <= limit
    } catch {
      allowed = fallbackRateLimit(`${bucket}:${identity}`, limit)
    }
  } else {
    allowed = fallbackRateLimit(`${bucket}:${identity}`, limit)
  }

  if (!allowed) {
    reply.header('Retry-After', '60')
    return reply.status(429).send({ error: 'Muitas requisições. Tente novamente em breve.' })
  }
})

// Auth decorator
app.decorate('authenticate', async (req: any, reply: any) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length)
      req.user = app.jwt.verify(token) as { sub: string; username: string }
      return
    }

    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME]
    if (cookieToken) {
      req.user = app.jwt.verify(cookieToken) as { sub: string; username: string }
      return
    }

    return reply.status(401).send({ error: 'Não autorizado.' })
  } catch {
    reply.status(401).send({ error: 'Não autorizado.' })
  }
})

// Routes
await app.register(authRoutes)
await app.register(heroRoutes)
await app.register(mailRoutes)
await app.register(rankingRoutes)
await app.register(shopRoutes)

// WebSocket: real-time leaderboard push
app.get('/ws', { websocket: true }, (socket) => {
  const send = (data: object) => {
    if (socket.readyState === 1) socket.send(JSON.stringify(data))
  }

  socket.on('message', async (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString()) as { type: string; token?: string; payload?: unknown }

      if (msg.type === 'ping') {
        send({ type: 'pong' })
        return
      }

      if (msg.type === 'leaderboard:subscribe') {
        const top = await prisma.hero.findMany({
          orderBy: [{ level: 'desc' }, { totalKills: 'desc' }],
          take: 10,
          select: { name: true, class: true, level: true, totalKills: true, user: { select: { username: true } } },
        })
        send({ type: 'leaderboard:update', data: top })
      }
    } catch {}
  })

  socket.on('error', () => {})
})

// Health check
app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }))

// Start
const port = Number(process.env.PORT ?? 3070)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await redis.connect()
  redisLimiterEnabled = true
  console.log('[Redis] connected')
} catch {
  console.warn('[Redis] unavailable — rankings will use DB fallback')
}

await app.listen({ port, host })
console.log(`[API] running on http://${host}:${port}`)

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
    process.exit(0)
  })
}
