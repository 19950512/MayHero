import type { Equipment, Zone, HeroClass, Stats } from './types'

export const XP_CURVE = (level: number) => Math.floor(100 * Math.pow(level, 1.5))

export const BASE_STATS: Record<HeroClass, Stats> = {
  // Classic trio
  warrior: { hp: 120, maxHp: 120, mp: 30,  maxMp: 30,  atk: 12, def: 8,  spd: 5, crit: 8  },
  archer:  { hp: 90,  maxHp: 90,  mp: 50,  maxMp: 50,  atk: 15, def: 5,  spd: 9, crit: 15 },
  mage:    { hp: 70,  maxHp: 70,  mp: 100, maxMp: 100, atk: 18, def: 3,  spd: 6, crit: 10 },
  // Medieval orders
  knight:  { hp: 145, maxHp: 145, mp: 20,  maxMp: 20,  atk: 10, def: 12, spd: 4, crit: 6  },
  paladin: { hp: 105, maxHp: 105, mp: 70,  maxMp: 70,  atk: 13, def: 9,  spd: 6, crit: 9  },
  druid:   { hp: 80,  maxHp: 80,  mp: 120, maxMp: 120, atk: 14, def: 5,  spd: 7, crit: 12 },
}

export const LEVEL_STAT_GROWTH: Record<HeroClass, Partial<Stats>> = {
  warrior: { maxHp: 18, atk: 2.5, def: 1.5, spd: 0.3, crit: 0.2 },
  archer:  { maxHp: 12, atk: 3.2, def: 1.0, spd: 0.5, crit: 0.4 },
  mage:    { maxHp: 8,  atk: 4.0, def: 0.8, spd: 0.3, crit: 0.3 },
  knight:  { maxHp: 22, atk: 2.0, def: 2.0, spd: 0.2, crit: 0.1 },
  paladin: { maxHp: 16, atk: 2.8, def: 1.4, spd: 0.3, crit: 0.2 },
  druid:   { maxHp: 10, atk: 3.5, def: 0.9, spd: 0.4, crit: 0.35 },
}

export const ZONES: Zone[] = [
  {
    id: 1,
    name: 'Floresta Sombria',
    description: 'Uma floresta densa repleta de criaturas menores.',
    minLevel: 1,
    bossEvery: 10,
    enemies: [
      { id: 'slime', name: 'Slime', emoji: '🟢', stats: { hp: 20, maxHp: 20, mp: 0, maxMp: 0, atk: 4, def: 1, spd: 2, crit: 2 }, xpReward: 8, goldReward: [1, 4], zone: 1, isBoss: false },
      { id: 'bat', name: 'Morcego', emoji: '🦇', stats: { hp: 15, maxHp: 15, mp: 0, maxMp: 0, atk: 6, def: 0, spd: 7, crit: 5 }, xpReward: 10, goldReward: [2, 5], zone: 1, isBoss: false },
      { id: 'goblin', name: 'Goblin', emoji: '👺', stats: { hp: 30, maxHp: 30, mp: 0, maxMp: 0, atk: 7, def: 2, spd: 4, crit: 3 }, xpReward: 14, goldReward: [3, 7], zone: 1, isBoss: false },
      { id: 'wolf', name: 'Lobo', emoji: '🐺', stats: { hp: 35, maxHp: 35, mp: 0, maxMp: 0, atk: 9, def: 2, spd: 6, crit: 6 }, xpReward: 18, goldReward: [2, 6], zone: 1, isBoss: false },
      { id: 'orc_boss', name: 'Orc Chefe', emoji: '👹', stats: { hp: 100, maxHp: 100, mp: 0, maxMp: 0, atk: 14, def: 5, spd: 3, crit: 4 }, xpReward: 60, goldReward: [15, 30], zone: 1, isBoss: true },
    ],
  },
  {
    id: 2,
    name: 'Cavernas de Pedra',
    description: 'Cavernas escuras com monstros cada vez mais perigosos.',
    minLevel: 5,
    bossEvery: 10,
    enemies: [
      { id: 'skeleton', name: 'Esqueleto', emoji: '💀', stats: { hp: 55, maxHp: 55, mp: 0, maxMp: 0, atk: 14, def: 4, spd: 4, crit: 5 }, xpReward: 28, goldReward: [6, 12], zone: 2, isBoss: false },
      { id: 'spider', name: 'Aranha Gigante', emoji: '🕷️', stats: { hp: 48, maxHp: 48, mp: 0, maxMp: 0, atk: 16, def: 3, spd: 8, crit: 8 }, xpReward: 32, goldReward: [8, 14], zone: 2, isBoss: false },
      { id: 'troll', name: 'Troll', emoji: '🧌', stats: { hp: 80, maxHp: 80, mp: 0, maxMp: 0, atk: 18, def: 7, spd: 2, crit: 2 }, xpReward: 40, goldReward: [10, 18], zone: 2, isBoss: false },
      { id: 'stone_golem_boss', name: 'Golem de Pedra', emoji: '🗿', stats: { hp: 250, maxHp: 250, mp: 0, maxMp: 0, atk: 28, def: 12, spd: 2, crit: 3 }, xpReward: 150, goldReward: [40, 80], zone: 2, isBoss: true },
    ],
  },
  {
    id: 3,
    name: 'Torre do Mago Sombrio',
    description: 'O lar de magos corrompidos e demônios conjurados.',
    minLevel: 10,
    bossEvery: 10,
    enemies: [
      { id: 'zombie_mage', name: 'Mago Zumbi', emoji: '🧟', stats: { hp: 90, maxHp: 90, mp: 60, maxMp: 60, atk: 24, def: 6, spd: 5, crit: 10 }, xpReward: 55, goldReward: [15, 25], zone: 3, isBoss: false },
      { id: 'demon', name: 'Demônio', emoji: '😈', stats: { hp: 110, maxHp: 110, mp: 40, maxMp: 40, atk: 28, def: 8, spd: 7, crit: 12 }, xpReward: 65, goldReward: [18, 32], zone: 3, isBoss: false },
      { id: 'shadow_boss', name: 'Lorde das Sombras', emoji: '🌑', stats: { hp: 500, maxHp: 500, mp: 200, maxMp: 200, atk: 45, def: 18, spd: 6, crit: 15 }, xpReward: 350, goldReward: [100, 200], zone: 3, isBoss: true },
    ],
  },
]

export const EQUIPMENT_POOL: Equipment[] = [
  // Weapons
  { id: 'stick', name: 'Galho', slot: 'weapon', rarity: 'common', bonuses: { atk: 2 }, icon: '🪵', requiredLevel: 1 },
  { id: 'iron_sword', name: 'Espada de Ferro', slot: 'weapon', rarity: 'common', bonuses: { atk: 5, def: 1 }, icon: '⚔️', requiredLevel: 2 },
  { id: 'hunters_bow', name: 'Arco do Caçador', slot: 'weapon', rarity: 'common', bonuses: { atk: 6, spd: 1 }, icon: '🏹', requiredLevel: 2 },
  { id: 'oak_staff', name: 'Cajado de Carvalho', slot: 'weapon', rarity: 'common', bonuses: { atk: 7, crit: 2 }, icon: '🪄', requiredLevel: 2 },
  { id: 'steel_sword', name: 'Espada de Aço', slot: 'weapon', rarity: 'rare', bonuses: { atk: 12, def: 2 }, icon: '🗡️', requiredLevel: 5 },
  { id: 'fire_staff', name: 'Cajado de Fogo', slot: 'weapon', rarity: 'rare', bonuses: { atk: 18, crit: 5 }, icon: '🔥', requiredLevel: 7 },
  { id: 'dark_blade', name: 'Lâmina Sombria', slot: 'weapon', rarity: 'epic', bonuses: { atk: 28, crit: 8, spd: 2 }, icon: '🌑', requiredLevel: 10 },
  { id: 'excalibur', name: 'Excalibur', slot: 'weapon', rarity: 'legendary', bonuses: { atk: 50, def: 10, crit: 12 }, icon: '✨', requiredLevel: 15 },

  // Armor
  { id: 'cloth', name: 'Roupa de Tecido', slot: 'armor', rarity: 'common', bonuses: { def: 2 }, icon: '👕', requiredLevel: 1 },
  { id: 'leather_armor', name: 'Armadura de Couro', slot: 'armor', rarity: 'common', bonuses: { def: 5, maxHp: 10 }, icon: '🥋', requiredLevel: 2 },
  { id: 'chain_mail', name: 'Cota de Malha', slot: 'armor', rarity: 'rare', bonuses: { def: 10, maxHp: 25 }, icon: '🛡️', requiredLevel: 5 },
  { id: 'plate_armor', name: 'Armadura de Placas', slot: 'armor', rarity: 'epic', bonuses: { def: 18, maxHp: 60 }, icon: '⚜️', requiredLevel: 10 },
  { id: 'dragon_armor', name: 'Armadura Dracônica', slot: 'armor', rarity: 'legendary', bonuses: { def: 35, maxHp: 120 }, icon: '🐉', requiredLevel: 15 },

  // Helms
  { id: 'hood', name: 'Capuz', slot: 'helm', rarity: 'common', bonuses: { def: 1 }, icon: '🪖', requiredLevel: 1 },
  { id: 'iron_helm', name: 'Elmo de Ferro', slot: 'helm', rarity: 'common', bonuses: { def: 3, maxHp: 8 }, icon: '⛑️', requiredLevel: 3 },
  { id: 'crown', name: 'Coroa do Rei', slot: 'helm', rarity: 'epic', bonuses: { def: 8, maxHp: 30, crit: 5 }, icon: '👑', requiredLevel: 10 },

  // Rings
  { id: 'copper_ring', name: 'Anel de Cobre', slot: 'ring', rarity: 'common', bonuses: { atk: 1 }, icon: '💍', requiredLevel: 1 },
  { id: 'speed_ring', name: 'Anel da Velocidade', slot: 'ring', rarity: 'rare', bonuses: { spd: 3, crit: 4 }, icon: '💨', requiredLevel: 5 },
  { id: 'power_ring', name: 'Anel do Poder', slot: 'ring', rarity: 'epic', bonuses: { atk: 15, crit: 6 }, icon: '🔮', requiredLevel: 10 },
]

export const RARITY_COLORS: Record<Equipment['rarity'], string> = {
  common: 'text-gray-300',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
}

export const CLASS_ICONS: Record<string, string> = {
  warrior: 'GU',
  archer:  'AR',
  mage:    'MA',
  knight:  'KN',
  paladin: 'PA',
  druid:   'DR',
}
