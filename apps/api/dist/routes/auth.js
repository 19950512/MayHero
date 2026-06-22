import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { redis } from '../redis.js';
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'mayhero_token';
const isProd = process.env.NODE_ENV === 'production';
function setAuthCookie(reply, token) {
    reply.setCookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    });
}
function clearAuthCookie(reply) {
    reply.clearCookie(AUTH_COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
    });
}
const LOGIN_FAIL_WINDOW_SEC = 15 * 60;
const LOGIN_LOCK_WINDOW_SEC = 15 * 60;
const LOGIN_FAIL_THRESHOLD = 8;
async function isAccountLocked(email) {
    try {
        const locked = await redis.get(`auth:lock:${email}`);
        return locked === '1';
    }
    catch {
        return false;
    }
}
async function registerFailedLogin(email) {
    try {
        const failKey = `auth:fail:${email}`;
        const fails = await redis.incr(failKey);
        if (fails === 1)
            await redis.expire(failKey, LOGIN_FAIL_WINDOW_SEC);
        if (fails >= LOGIN_FAIL_THRESHOLD) {
            await redis.set(`auth:lock:${email}`, '1', 'EX', LOGIN_LOCK_WINDOW_SEC);
        }
    }
    catch {
        // If Redis is unavailable, keep auth flow functional.
    }
}
async function clearFailedLogin(email) {
    try {
        await redis.del(`auth:fail:${email}`, `auth:lock:${email}`);
    }
    catch {
        // no-op
    }
}
const RegisterBody = z.object({
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    password: z.string().min(6).max(72),
});
const LoginBody = z.object({
    email: z.string().email(),
    password: z.string(),
});
export async function authRoutes(app) {
    app.post('/auth/register', async (req, reply) => {
        const body = RegisterBody.safeParse(req.body);
        if (!body.success)
            return reply.status(400).send({ error: body.error.issues[0].message });
        const { username, password } = body.data;
        const email = body.data.email.toLowerCase();
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existing)
            return reply.status(409).send({ error: 'Email ou usuário já em uso.' });
        const hash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { username, email, password: hash },
            select: { id: true, username: true, email: true },
        });
        const token = app.jwt.sign({ sub: user.id, username: user.username }, { expiresIn: '7d' });
        setAuthCookie(reply, token);
        return { token, user };
    });
    app.post('/auth/login', async (req, reply) => {
        const body = LoginBody.safeParse(req.body);
        if (!body.success)
            return reply.status(400).send({ error: 'Dados inválidos.' });
        const { email, password } = body.data;
        const normalizedEmail = email.toLowerCase();
        if (await isAccountLocked(normalizedEmail)) {
            return reply.status(429).send({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' });
        }
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            await registerFailedLogin(normalizedEmail);
            return reply.status(401).send({ error: 'Credenciais inválidas.' });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            await registerFailedLogin(normalizedEmail);
            return reply.status(401).send({ error: 'Credenciais inválidas.' });
        }
        await clearFailedLogin(normalizedEmail);
        const token = app.jwt.sign({ sub: user.id, username: user.username }, { expiresIn: '7d' });
        setAuthCookie(reply, token);
        return { token, user: { id: user.id, username: user.username, email: user.email } };
    });
    app.post('/auth/logout', async (_req, reply) => {
        clearAuthCookie(reply);
        return { ok: true };
    });
    app.get('/auth/me', { onRequest: [app.authenticate] }, async (req) => {
        const { sub } = req.user;
        const user = await prisma.user.findUnique({
            where: { id: sub },
            select: { id: true, username: true, email: true, createdAt: true },
        });
        return user;
    });
}
