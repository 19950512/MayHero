import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../db.js';
import { redis } from '../redis.js';
import { BASE_STATS_BY_CLASS, BOSS_EVERY, MONSTERS, ZONE_MIN_LEVEL, baseStatsForLevel, getMonsterById, normalizeEquipmentItemData, resolveMonsterDrops, sanitizeEquipmentRecord, xpCurve, } from '../game-catalog.js';
const HERO_CLASS_ENUM = ['warrior', 'archer', 'mage', 'knight', 'paladin', 'druid'];
const CreateHeroBody = z.object({
    name: z.string().min(1).max(20),
    class: z.enum(HERO_CLASS_ENUM),
    stats: z.record(z.unknown()),
    baseStats: z.record(z.unknown()),
});
const SyncHeroBody = z.object({
    name: z.string().min(1).max(20),
    class: z.enum(HERO_CLASS_ENUM),
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
    heroMessage: z.string().max(180).optional(),
    autoFight: z.boolean().optional(),
    stackableInventory: z.record(z.number().int().min(0)).optional(),
});
const BattleVictoryBody = z.object({
    encounterId: z.string().min(1),
    enemyId: z.string().min(1),
    currentZone: z.number().int().min(1),
    heroHpAfterBattle: z.number().int().min(0).optional(),
});
const BattleStartBody = z.object({
    currentZone: z.number().int().min(1),
});
function asStatsJson(input) {
    if (!input || typeof input !== 'object')
        return null;
    const v = input;
    const keys = ['hp', 'maxHp', 'mp', 'maxMp', 'atk', 'def', 'spd', 'crit'];
    for (const key of keys) {
        if (typeof v[key] !== 'number' || !Number.isFinite(v[key]))
            return null;
    }
    return {
        hp: Number(v.hp),
        maxHp: Number(v.maxHp),
        mp: Number(v.mp),
        maxMp: Number(v.maxMp),
        atk: Number(v.atk),
        def: Number(v.def),
        spd: Number(v.spd),
        crit: Number(v.crit),
    };
}
export async function heroRoutes(app) {
    app.get('/hero/inventory', { onRequest: [app.authenticate] }, async (req) => {
        const { sub } = req.user;
        const hero = await prisma.hero.findUnique({ where: { userId: sub } });
        if (!hero)
            return [];
        return prisma.inventoryItem.findMany({
            where: { heroId: hero.id },
            select: { id: true, itemData: true },
        });
    });
    app.get('/hero', { onRequest: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const hero = await prisma.hero.findUnique({
            where: { userId: sub },
            include: { inventory: true },
        });
        if (!hero)
            return reply.status(404).send({ error: 'Herói não encontrado.' });
        return hero;
    });
    app.post('/hero', { onRequest: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const body = CreateHeroBody.safeParse(req.body);
        if (!body.success)
            return reply.status(400).send({ error: body.error.issues[0].message });
        const existing = await prisma.hero.findUnique({ where: { userId: sub } });
        if (existing)
            return reply.status(409).send({ error: 'Herói já existe.' });
        const hero = await prisma.hero.create({
            data: {
                userId: sub,
                name: body.data.name,
                class: body.data.class,
                statsJson: body.data.stats,
                baseStatsJson: body.data.baseStats,
                equipJson: {},
            },
        });
        await redis.set(`hero:killsInZone:${hero.id}:1`, '0', 'EX', 60 * 60 * 24 * 30);
        return hero;
    });
    app.patch('/hero/sync', { onRequest: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const body = SyncHeroBody.safeParse(req.body);
        if (!body.success)
            return reply.status(400).send({ error: body.error.issues[0].message });
        const hero = await prisma.hero.findUnique({ where: { userId: sub } });
        if (!hero)
            return reply.status(404).send({ error: 'Herói não encontrado.' });
        // Progressão sensível agora é autoritativa no servidor.
        if (body.data.level !== hero.level ||
            body.data.xp !== hero.xp ||
            body.data.xpToNext !== hero.xpToNext ||
            body.data.gold !== hero.gold ||
            body.data.totalKills !== hero.totalKills ||
            body.data.skillPoints !== hero.skillPoints ||
            body.data.class !== hero.class) {
            return reply.status(400).send({ error: 'Campos de progressão são autoritativos no servidor.' });
        }
        if (body.data.class !== hero.class) {
            return reply.status(400).send({ error: 'Classe não pode ser alterada via sync.' });
        }
        const canonicalBaseStats = BASE_STATS_BY_CLASS[body.data.class];
        if (JSON.stringify(body.data.baseStats) === JSON.stringify(canonicalBaseStats)) {
            // ok
        }
        else {
            // Accept evolved base stats, but ensure base stat fields are valid numeric values
            const bs = body.data.baseStats;
            const requiredKeys = ['hp', 'maxHp', 'mp', 'maxMp', 'atk', 'def', 'spd', 'crit'];
            for (const key of requiredKeys) {
                if (typeof bs[key] !== 'number' || !Number.isFinite(bs[key])) {
                    return reply.status(400).send({ error: 'Base stats inválidos.' });
                }
            }
        }
        const { equipment, ...heroData } = body.data;
        const sanitizedEquipment = sanitizeEquipmentRecord(equipment);
        if (!sanitizedEquipment) {
            return reply.status(400).send({ error: 'Equipamento inválido.' });
        }
        // Sync hero core state
        const updatedHero = await prisma.hero.update({
            where: { userId: sub },
            data: {
                name: heroData.name,
                class: heroData.class,
                level: hero.level,
                xp: hero.xp,
                xpToNext: hero.xpToNext,
                gold: hero.gold,
                totalKills: hero.totalKills,
                skillPoints: hero.skillPoints,
                currentZone: heroData.currentZone,
                statsJson: heroData.stats,
                baseStatsJson: heroData.baseStats,
                equipJson: sanitizedEquipment,
            },
        });
        if (heroData.currentZone !== hero.currentZone) {
            await redis.set(`hero:killsInZone:${hero.id}:${heroData.currentZone}`, '0', 'EX', 60 * 60 * 24 * 30);
        }
        // Inventory is server-authoritative and no longer overwritten by sync payload.
        // Update Redis leaderboard
        await redis.zadd('leaderboard:level', updatedHero.level, hero.id);
        await redis.zadd('leaderboard:kills', updatedHero.totalKills, hero.id);
        return { ok: true };
    });
    app.post('/hero/battle/victory', { onRequest: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const body = BattleVictoryBody.safeParse(req.body);
        if (!body.success)
            return reply.status(400).send({ error: body.error.issues[0].message });
        const hero = await prisma.hero.findUnique({ where: { userId: sub } });
        if (!hero)
            return reply.status(404).send({ error: 'Herói não encontrado.' });
        const encounterKey = `hero:encounter:${hero.id}`;
        const rawEncounter = await redis.get(encounterKey);
        if (!rawEncounter) {
            return reply.status(409).send({ error: 'Encontro expirado. Inicie uma nova batalha.' });
        }
        let encounter = null;
        try {
            const parsed = JSON.parse(rawEncounter);
            if (typeof parsed.encounterId === 'string' &&
                typeof parsed.enemyId === 'string' &&
                typeof parsed.currentZone === 'number' &&
                typeof parsed.isBoss === 'boolean') {
                encounter = {
                    encounterId: parsed.encounterId,
                    enemyId: parsed.enemyId,
                    currentZone: parsed.currentZone,
                    isBoss: parsed.isBoss,
                };
            }
        }
        catch {
            encounter = null;
        }
        if (!encounter) {
            await redis.del(encounterKey);
            return reply.status(409).send({ error: 'Encontro inválido. Inicie uma nova batalha.' });
        }
        if (encounter.encounterId !== body.data.encounterId ||
            encounter.enemyId !== body.data.enemyId ||
            encounter.currentZone !== body.data.currentZone) {
            return reply.status(400).send({ error: 'Payload de vitória não corresponde ao encontro ativo.' });
        }
        const monster = getMonsterById(body.data.enemyId);
        if (!monster)
            return reply.status(400).send({ error: 'Inimigo inválido.' });
        if (monster.zone !== body.data.currentZone || hero.currentZone !== body.data.currentZone) {
            return reply.status(400).send({ error: 'Zona inválida para batalha.' });
        }
        const minLevel = ZONE_MIN_LEVEL[body.data.currentZone];
        if (!minLevel || hero.level < minLevel) {
            return reply.status(400).send({ error: 'Nível insuficiente para a zona.' });
        }
        const zoneKillKey = `hero:killsInZone:${hero.id}:${body.data.currentZone}`;
        const killsInZoneRaw = await redis.get(zoneKillKey);
        const killsInZone = Number(killsInZoneRaw ?? '0');
        const expectedBoss = killsInZone > 0 && killsInZone % BOSS_EVERY === 0;
        if (monster.isBoss !== expectedBoss) {
            return reply.status(400).send({ error: 'Inimigo não condiz com o estado da zona.' });
        }
        if (encounter.isBoss !== expectedBoss) {
            return reply.status(400).send({ error: 'Estado do encontro inválido para a zona.' });
        }
        const rlKey = `battle:victory:${hero.id}`;
        const now = Date.now();
        const last = await redis.get(rlKey);
        if (last && now - Number(last) < 700) {
            return reply.status(429).send({ error: 'Vitórias enviadas muito rapidamente.' });
        }
        await redis.set(rlKey, String(now), 'EX', 30);
        await redis.del(encounterKey);
        const stats = asStatsJson(hero.statsJson);
        if (!stats)
            return reply.status(500).send({ error: 'Stats do herói inválidos no servidor.' });
        const baseGoldEarned = Math.floor(Math.random() * (monster.goldReward[1] - monster.goldReward[0] + 1)) + monster.goldReward[0];
        const xpEarned = monster.xpReward;
        let level = hero.level;
        let xp = hero.xp + xpEarned;
        let xpToNext = hero.xpToNext;
        let skillPoints = hero.skillPoints;
        let leveledUp = false;
        while (xp >= xpToNext) {
            xp -= xpToNext;
            level += 1;
            xpToNext = xpCurve(level);
            skillPoints += 1;
            leveledUp = true;
        }
        const resolvedDrops = resolveMonsterDrops(monster.id);
        let extraGold = 0;
        const stackableDrops = [];
        let itemDrop = null;
        const rarityPriority = { common: 1, rare: 2, epic: 3, legendary: 4 };
        const sortedDrops = [...resolvedDrops].sort((a, b) => {
            if (a.item.category !== 'equipment' && b.item.category === 'equipment')
                return 1;
            if (a.item.category === 'equipment' && b.item.category !== 'equipment')
                return -1;
            return (rarityPriority[b.item.rarity] ?? 0) - (rarityPriority[a.item.rarity] ?? 0);
        });
        for (const resolved of sortedDrops) {
            const item = resolved.item;
            if (item.category === 'currency' && item.id === 'gold_coin') {
                extraGold += resolved.quantity;
                continue;
            }
            if (item.category === 'equipment') {
                if (itemDrop || (item.requiredLevel ?? 1) > level)
                    continue;
                itemDrop = normalizeEquipmentItemData({ id: item.id });
                continue;
            }
            stackableDrops.push({ itemId: item.id, name: item.name, quantity: resolved.quantity });
        }
        const totalGoldEarned = baseGoldEarned + extraGold;
        const newGold = hero.gold + totalGoldEarned;
        const newTotalKills = hero.totalKills + 1;
        const nextBaseStats = baseStatsForLevel(hero.class, level);
        const nextStats = leveledUp
            ? { ...stats, hp: nextBaseStats.maxHp, maxHp: nextBaseStats.maxHp }
            : {
                ...stats,
                hp: Math.max(1, Math.min(stats.maxHp, body.data.heroHpAfterBattle ?? stats.hp)),
            };
        const updatedHero = await prisma.$transaction(async (tx) => {
            const savedHero = await tx.hero.update({
                where: { id: hero.id },
                data: {
                    level,
                    xp,
                    xpToNext,
                    gold: newGold,
                    totalKills: newTotalKills,
                    skillPoints,
                    statsJson: nextStats,
                    baseStatsJson: nextBaseStats,
                },
            });
            if (itemDrop) {
                await tx.inventoryItem.create({ data: { heroId: hero.id, itemData: itemDrop } });
            }
            return savedHero;
        });
        await redis.zadd('leaderboard:level', updatedHero.level, hero.id);
        await redis.zadd('leaderboard:kills', updatedHero.totalKills, hero.id);
        await redis.set(zoneKillKey, String(killsInZone + 1), 'EX', 60 * 60 * 24 * 30);
        return {
            hero: {
                level,
                xp,
                xpToNext,
                gold: newGold,
                totalKills: newTotalKills,
                skillPoints,
                stats: nextStats,
                baseStats: nextBaseStats,
            },
            rewards: {
                xpEarned,
                goldEarned: totalGoldEarned,
                leveledUp,
                itemDrop,
                stackableDrops,
            },
            serverState: {
                killsInZone: killsInZone + 1,
            },
        };
    });
    app.post('/hero/battle/start', { onRequest: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const body = BattleStartBody.safeParse(req.body);
        if (!body.success)
            return reply.status(400).send({ error: body.error.issues[0].message });
        const hero = await prisma.hero.findUnique({ where: { userId: sub } });
        if (!hero)
            return reply.status(404).send({ error: 'Herói não encontrado.' });
        if (hero.currentZone !== body.data.currentZone) {
            await prisma.hero.update({
                where: { id: hero.id },
                data: { currentZone: body.data.currentZone },
            });
            await redis.set(`hero:killsInZone:${hero.id}:${body.data.currentZone}`, '0', 'EX', 60 * 60 * 24 * 30);
        }
        const minLevel = ZONE_MIN_LEVEL[body.data.currentZone];
        if (!minLevel || hero.level < minLevel) {
            return reply.status(400).send({ error: 'Nível insuficiente para a zona.' });
        }
        const zoneKillKey = `hero:killsInZone:${hero.id}:${body.data.currentZone}`;
        const killsInZoneRaw = await redis.get(zoneKillKey);
        const killsInZone = Number(killsInZoneRaw ?? '0');
        const isBoss = killsInZone > 0 && killsInZone % BOSS_EVERY === 0;
        const pool = MONSTERS.filter(m => m.zone === body.data.currentZone && m.isBoss === isBoss);
        if (pool.length === 0) {
            return reply.status(500).send({ error: 'Catálogo de monstros inválido para a zona.' });
        }
        const selected = pool[Math.floor(Math.random() * pool.length)];
        const encounterId = randomUUID();
        const encounterKey = `hero:encounter:${hero.id}`;
        await redis.set(encounterKey, JSON.stringify({
            encounterId,
            enemyId: selected.id,
            currentZone: body.data.currentZone,
            isBoss,
        }), 'EX', 180);
        return {
            encounterId,
            enemyId: selected.id,
            isBoss,
            currentZone: body.data.currentZone,
        };
    });
    // Rename hero
    app.patch('/hero/rename', { onRequest: [app.authenticate] }, async (req, reply) => {
        const { sub } = req.user;
        const body = z.object({ name: z.string().min(1).max(20) }).safeParse(req.body);
        if (!body.success)
            return reply.status(400).send({ error: body.error.issues[0].message });
        const hero = await prisma.hero.findUnique({ where: { userId: sub } });
        if (!hero)
            return reply.status(404).send({ error: 'Herói não encontrado.' });
        await prisma.hero.update({ where: { id: hero.id }, data: { name: body.data.name } });
        return { ok: true, name: body.data.name };
    });
}
