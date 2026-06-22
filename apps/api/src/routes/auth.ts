import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../db.js'

const RegisterBody = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6).max(72),
})

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const body = RegisterBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.issues[0].message })

    const { username, email, password } = body.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing) return reply.status(409).send({ error: 'Email ou usuário já em uso.' })

    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { username, email, password: hash },
      select: { id: true, username: true, email: true },
    })

    const token = app.jwt.sign({ sub: user.id, username: user.username }, { expiresIn: '7d' })
    return { token, user }
  })

  app.post('/auth/login', async (req, reply) => {
    const body = LoginBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Dados inválidos.' })

    const { email, password } = body.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return reply.status(401).send({ error: 'Credenciais inválidas.' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return reply.status(401).send({ error: 'Credenciais inválidas.' })

    const token = app.jwt.sign({ sub: user.id, username: user.username }, { expiresIn: '7d' })
    return { token, user: { id: user.id, username: user.username, email: user.email } }
  })

  app.get('/auth/me', { onRequest: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string; username: string }
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, username: true, email: true, createdAt: true },
    })
    return user
  })
}
