export const HERO_CLASSES = ['warrior', 'archer', 'mage', 'knight', 'paladin', 'druid'];
export const BASE_STATS_BY_CLASS = {
    warrior: { hp: 120, maxHp: 120, mp: 30, maxMp: 30, atk: 12, def: 8, spd: 5, crit: 8 },
    archer: { hp: 90, maxHp: 90, mp: 50, maxMp: 50, atk: 15, def: 5, spd: 9, crit: 15 },
    mage: { hp: 70, maxHp: 70, mp: 100, maxMp: 100, atk: 18, def: 3, spd: 6, crit: 10 },
    knight: { hp: 145, maxHp: 145, mp: 20, maxMp: 20, atk: 10, def: 12, spd: 4, crit: 6 },
    paladin: { hp: 105, maxHp: 105, mp: 70, maxMp: 70, atk: 13, def: 9, spd: 6, crit: 9 },
    druid: { hp: 80, maxHp: 80, mp: 120, maxMp: 120, atk: 14, def: 5, spd: 7, crit: 12 },
};
export const LEVEL_STAT_GROWTH = {
    warrior: { maxHp: 18, atk: 2.5, def: 1.5, spd: 0.3, crit: 0.2 },
    archer: { maxHp: 12, atk: 3.2, def: 1.0, spd: 0.5, crit: 0.4 },
    mage: { maxHp: 8, atk: 4.0, def: 0.8, spd: 0.3, crit: 0.3 },
    knight: { maxHp: 22, atk: 2.0, def: 2.0, spd: 0.2, crit: 0.1 },
    paladin: { maxHp: 16, atk: 2.8, def: 1.4, spd: 0.3, crit: 0.2 },
    druid: { maxHp: 10, atk: 3.5, def: 0.9, spd: 0.4, crit: 0.35 },
};
export const ZONE_MIN_LEVEL = {
    1: 1,
    2: 5,
    3: 10,
};
export const BOSS_EVERY = 10;
export const EQUIPMENT_CATALOG = [
    { id: 'stick', name: 'Galho', slot: 'weapon', rarity: 'common', bonuses: { atk: 2 }, icon: '🪵', requiredLevel: 1 },
    { id: 'iron_sword', name: 'Espada de Ferro', slot: 'weapon', rarity: 'common', bonuses: { atk: 5, def: 1 }, icon: '⚔️', requiredLevel: 2 },
    { id: 'hunters_bow', name: 'Arco do Caçador', slot: 'weapon', rarity: 'common', bonuses: { atk: 6, spd: 1 }, icon: '🏹', requiredLevel: 2 },
    { id: 'oak_staff', name: 'Cajado de Carvalho', slot: 'weapon', rarity: 'common', bonuses: { atk: 7, crit: 2 }, icon: '🪄', requiredLevel: 2 },
    { id: 'steel_sword', name: 'Espada de Aço', slot: 'weapon', rarity: 'rare', bonuses: { atk: 12, def: 2 }, icon: '🗡️', requiredLevel: 5 },
    { id: 'fire_staff', name: 'Cajado de Fogo', slot: 'weapon', rarity: 'rare', bonuses: { atk: 18, crit: 5 }, icon: '🔥', requiredLevel: 7 },
    { id: 'dark_blade', name: 'Lâmina Sombria', slot: 'weapon', rarity: 'epic', bonuses: { atk: 28, crit: 8, spd: 2 }, icon: '🌑', requiredLevel: 10 },
    { id: 'excalibur', name: 'Excalibur', slot: 'weapon', rarity: 'legendary', bonuses: { atk: 50, def: 10, crit: 12 }, icon: '✨', requiredLevel: 15 },
    { id: 'cloth', name: 'Roupa de Tecido', slot: 'armor', rarity: 'common', bonuses: { def: 2 }, icon: '👕', requiredLevel: 1 },
    { id: 'leather_armor', name: 'Armadura de Couro', slot: 'armor', rarity: 'common', bonuses: { def: 5, maxHp: 10 }, icon: '🥋', requiredLevel: 2 },
    { id: 'chain_mail', name: 'Cota de Malha', slot: 'armor', rarity: 'rare', bonuses: { def: 10, maxHp: 25 }, icon: '🛡️', requiredLevel: 5 },
    { id: 'plate_armor', name: 'Armadura de Placas', slot: 'armor', rarity: 'epic', bonuses: { def: 18, maxHp: 60 }, icon: '⚜️', requiredLevel: 10 },
    { id: 'dragon_armor', name: 'Armadura Dracônica', slot: 'armor', rarity: 'legendary', bonuses: { def: 35, maxHp: 120 }, icon: '🐉', requiredLevel: 15 },
    { id: 'hood', name: 'Capuz', slot: 'helm', rarity: 'common', bonuses: { def: 1 }, icon: '🪖', requiredLevel: 1 },
    { id: 'iron_helm', name: 'Elmo de Ferro', slot: 'helm', rarity: 'common', bonuses: { def: 3, maxHp: 8 }, icon: '⛑️', requiredLevel: 3 },
    { id: 'crown', name: 'Coroa do Rei', slot: 'helm', rarity: 'epic', bonuses: { def: 8, maxHp: 30, crit: 5 }, icon: '👑', requiredLevel: 10 },
    { id: 'copper_ring', name: 'Anel de Cobre', slot: 'ring', rarity: 'common', bonuses: { atk: 1 }, icon: '💍', requiredLevel: 1 },
    { id: 'speed_ring', name: 'Anel da Velocidade', slot: 'ring', rarity: 'rare', bonuses: { spd: 3, crit: 4 }, icon: '💨', requiredLevel: 5 },
    { id: 'power_ring', name: 'Anel do Poder', slot: 'ring', rarity: 'epic', bonuses: { atk: 15, crit: 6 }, icon: '🔮', requiredLevel: 10 },
];
const EQUIPMENT_BY_ID = new Map(EQUIPMENT_CATALOG.map(item => [item.id, item]));
export function xpCurve(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}
export function baseStatsForLevel(heroClass, level) {
    const base = { ...BASE_STATS_BY_CLASS[heroClass] };
    const growth = LEVEL_STAT_GROWTH[heroClass];
    const lvl = Math.max(0, level - 1);
    base.maxHp = Math.floor(base.maxHp + (growth.maxHp ?? 0) * lvl);
    base.atk = Math.floor(base.atk + (growth.atk ?? 0) * lvl);
    base.def = Math.floor(base.def + (growth.def ?? 0) * lvl);
    base.spd = Math.floor(base.spd + (growth.spd ?? 0) * lvl);
    base.crit = Math.min(75, Math.floor(base.crit + (growth.crit ?? 0) * lvl));
    base.hp = base.maxHp;
    base.mp = base.maxMp;
    return base;
}
const CATALOG_ITEMS = [
    ...EQUIPMENT_CATALOG.map(item => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        rarity: item.rarity,
        category: 'equipment',
        stackable: false,
        slot: item.slot,
        bonuses: item.bonuses,
        requiredLevel: item.requiredLevel,
    })),
    { id: 'healing_potion', name: 'Poção de Vida', icon: '🧪', rarity: 'common', category: 'consumable', stackable: true },
    { id: 'gold_coin', name: 'Gold', icon: '🪙', rarity: 'common', category: 'currency', stackable: true },
];
const CATALOG_ITEM_BY_ID = new Map(CATALOG_ITEMS.map(item => [item.id, item]));
export const MONSTERS = [
    { id: 'slime', zone: 1, isBoss: false, xpReward: 8, goldReward: [1, 4], drops: [
            { itemId: 'hood', chance: 0.03 }, { itemId: 'stick', chance: 0.03 },
            { itemId: 'healing_potion', chance: 0.12, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'gold_coin', chance: 0.55, minQuantity: 1, maxQuantity: 5 },
        ] },
    { id: 'bat', zone: 1, isBoss: false, xpReward: 10, goldReward: [2, 5], drops: [
            { itemId: 'copper_ring', chance: 0.05 }, { itemId: 'hunters_bow', chance: 0.03 },
            { itemId: 'healing_potion', chance: 0.1, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'gold_coin', chance: 0.6, minQuantity: 2, maxQuantity: 6 },
        ] },
    { id: 'goblin', zone: 1, isBoss: false, xpReward: 14, goldReward: [3, 7], drops: [
            { itemId: 'iron_sword', chance: 0.04 }, { itemId: 'leather_armor', chance: 0.04 },
            { itemId: 'healing_potion', chance: 0.12, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'gold_coin', chance: 0.7, minQuantity: 3, maxQuantity: 8 },
        ] },
    { id: 'wolf', zone: 1, isBoss: false, xpReward: 18, goldReward: [2, 6], drops: [
            { itemId: 'speed_ring', chance: 0.03 }, { itemId: 'oak_staff', chance: 0.03 },
            { itemId: 'healing_potion', chance: 0.14, minQuantity: 1, maxQuantity: 3 },
            { itemId: 'gold_coin', chance: 0.65, minQuantity: 2, maxQuantity: 7 },
        ] },
    { id: 'orc_boss', zone: 1, isBoss: true, xpReward: 60, goldReward: [15, 30], drops: [
            { itemId: 'chain_mail', chance: 0.15 }, { itemId: 'iron_helm', chance: 0.14 },
            { itemId: 'healing_potion', chance: 0.4, minQuantity: 2, maxQuantity: 4 },
            { itemId: 'gold_coin', chance: 1, minQuantity: 20, maxQuantity: 45 },
        ] },
    { id: 'skeleton', zone: 2, isBoss: false, xpReward: 28, goldReward: [6, 12], drops: [
            { itemId: 'steel_sword', chance: 0.05 }, { itemId: 'chain_mail', chance: 0.04 },
            { itemId: 'healing_potion', chance: 0.16, minQuantity: 1, maxQuantity: 3 },
            { itemId: 'gold_coin', chance: 0.72, minQuantity: 7, maxQuantity: 15 },
        ] },
    { id: 'spider', zone: 2, isBoss: false, xpReward: 32, goldReward: [8, 14], drops: [
            { itemId: 'speed_ring', chance: 0.05 }, { itemId: 'fire_staff', chance: 0.03 },
            { itemId: 'healing_potion', chance: 0.2, minQuantity: 1, maxQuantity: 3 },
            { itemId: 'gold_coin', chance: 0.75, minQuantity: 8, maxQuantity: 16 },
        ] },
    { id: 'troll', zone: 2, isBoss: false, xpReward: 40, goldReward: [10, 18], drops: [
            { itemId: 'plate_armor', chance: 0.04 }, { itemId: 'power_ring', chance: 0.03 },
            { itemId: 'healing_potion', chance: 0.22, minQuantity: 2, maxQuantity: 4 },
            { itemId: 'gold_coin', chance: 0.8, minQuantity: 12, maxQuantity: 22 },
        ] },
    { id: 'stone_golem_boss', zone: 2, isBoss: true, xpReward: 150, goldReward: [40, 80], drops: [
            { itemId: 'plate_armor', chance: 0.2 }, { itemId: 'crown', chance: 0.16 }, { itemId: 'dark_blade', chance: 0.1 },
            { itemId: 'healing_potion', chance: 0.5, minQuantity: 3, maxQuantity: 6 },
            { itemId: 'gold_coin', chance: 1, minQuantity: 55, maxQuantity: 110 },
        ] },
    { id: 'zombie_mage', zone: 3, isBoss: false, xpReward: 55, goldReward: [15, 25], drops: [
            { itemId: 'fire_staff', chance: 0.08 }, { itemId: 'power_ring', chance: 0.06 },
            { itemId: 'healing_potion', chance: 0.24, minQuantity: 2, maxQuantity: 5 },
            { itemId: 'gold_coin', chance: 0.85, minQuantity: 18, maxQuantity: 32 },
        ] },
    { id: 'demon', zone: 3, isBoss: false, xpReward: 65, goldReward: [18, 32], drops: [
            { itemId: 'dark_blade', chance: 0.07 }, { itemId: 'dragon_armor', chance: 0.04 },
            { itemId: 'healing_potion', chance: 0.28, minQuantity: 2, maxQuantity: 5 },
            { itemId: 'gold_coin', chance: 0.88, minQuantity: 20, maxQuantity: 35 },
        ] },
    { id: 'shadow_boss', zone: 3, isBoss: true, xpReward: 350, goldReward: [100, 200], drops: [
            { itemId: 'excalibur', chance: 0.12 }, { itemId: 'dragon_armor', chance: 0.22 }, { itemId: 'crown', chance: 0.2 },
            { itemId: 'healing_potion', chance: 0.7, minQuantity: 4, maxQuantity: 8 },
            { itemId: 'gold_coin', chance: 1, minQuantity: 150, maxQuantity: 280 },
        ] },
];
const MONSTER_BY_ID = new Map(MONSTERS.map(monster => [monster.id, monster]));
export function getMonsterById(enemyId) {
    return MONSTER_BY_ID.get(enemyId) ?? null;
}
export function resolveMonsterDrops(enemyId) {
    const monster = getMonsterById(enemyId);
    if (!monster)
        return [];
    const drops = [];
    for (const drop of monster.drops) {
        if (Math.random() > drop.chance)
            continue;
        const item = CATALOG_ITEM_BY_ID.get(drop.itemId);
        if (!item)
            continue;
        const minQ = drop.minQuantity ?? 1;
        const maxQ = drop.maxQuantity ?? minQ;
        const quantity = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
        drops.push({ item, quantity });
    }
    return drops;
}
function sameBonuses(input, expected) {
    if (input === undefined || input === null)
        return false;
    if (typeof input !== 'object')
        return false;
    const inObj = input;
    const expectedKeys = Object.keys(expected);
    const inputKeys = Object.keys(inObj);
    if (inputKeys.length !== expectedKeys.length)
        return false;
    for (const key of expectedKeys) {
        if (typeof inObj[key] !== 'number')
            return false;
        if (Number(inObj[key]) !== Number(expected[key]))
            return false;
    }
    return true;
}
export function normalizeEquipmentItemData(input) {
    if (!input || typeof input !== 'object')
        return null;
    const data = input;
    if (typeof data.id !== 'string')
        return null;
    const canonical = EQUIPMENT_BY_ID.get(data.id);
    if (!canonical)
        return null;
    if (data.slot !== undefined && data.slot !== canonical.slot)
        return null;
    if (data.rarity !== undefined && data.rarity !== canonical.rarity)
        return null;
    if (data.requiredLevel !== undefined && Number(data.requiredLevel) !== canonical.requiredLevel)
        return null;
    if (data.name !== undefined && data.name !== canonical.name)
        return null;
    if (data.icon !== undefined && data.icon !== canonical.icon)
        return null;
    if (data.bonuses !== undefined && !sameBonuses(data.bonuses, canonical.bonuses))
        return null;
    return {
        id: canonical.id,
        name: canonical.name,
        slot: canonical.slot,
        rarity: canonical.rarity,
        bonuses: { ...canonical.bonuses },
        icon: canonical.icon,
        requiredLevel: canonical.requiredLevel,
    };
}
export function sanitizeEquipmentRecord(input) {
    if (!input || typeof input !== 'object')
        return {};
    const raw = input;
    const result = {};
    if (raw.weapon !== undefined) {
        const parsed = normalizeEquipmentItemData(raw.weapon);
        if (!parsed || parsed.slot !== 'weapon')
            return null;
        result.weapon = parsed;
    }
    if (raw.armor !== undefined) {
        const parsed = normalizeEquipmentItemData(raw.armor);
        if (!parsed || parsed.slot !== 'armor')
            return null;
        result.armor = parsed;
    }
    if (raw.helm !== undefined) {
        const parsed = normalizeEquipmentItemData(raw.helm);
        if (!parsed || parsed.slot !== 'helm')
            return null;
        result.helm = parsed;
    }
    if (raw.ring !== undefined) {
        const parsed = normalizeEquipmentItemData(raw.ring);
        if (!parsed || parsed.slot !== 'ring')
            return null;
        result.ring = parsed;
    }
    return result;
}
export function sanitizeInventoryItems(input) {
    const sanitized = [];
    for (const item of input) {
        const parsed = normalizeEquipmentItemData(item);
        if (!parsed)
            return null;
        sanitized.push(parsed);
    }
    return sanitized;
}
