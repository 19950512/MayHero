'use client'

import { useGameStore } from '../store/gameStore'
import { computeStats, getHeroLoadout } from '../game/engine'
import { RARITY_COLORS } from '../game/data'
import { HERO_CLASS_BY_ID } from '../game/classes'
import type { Equipment, SkillAllocStat } from '../game/types'

const SKILL_OPTIONS: { stat: SkillAllocStat; label: string; icon: string; bonus: string }[] = [
  { stat: 'atk',   label: 'ATK',  icon: 'A', bonus: '+2 ATK' },
  { stat: 'def',   label: 'DEF',  icon: 'D', bonus: '+1 DEF' },
  { stat: 'maxHp', label: 'Vida', icon: 'V', bonus: '+10 HP' },
  { stat: 'spd',   label: 'VEL',  icon: 'S', bonus: '+1 VEL' },
]

export function HeroStats() {
  const { hero, heroMessage, setHeroMessage, spendSkillPoint } = useGameStore()
  if (!hero) return null

  const stats = computeStats(hero)
  const xpPct = (hero.xp / hero.xpToNext) * 100
  const alloc = hero.skillAllocations ?? { atk: 0, def: 0, maxHp: 0, spd: 0 }
  const classData = HERO_CLASS_BY_ID[hero.class]
  const loadout = getHeroLoadout(hero)

  const classArt: Record<typeof hero.class, string> = {
    warrior: '⚔️',
    archer: '🏹',
    mage: '🔮',
    knight: '🛡️',
    paladin: '✨',
    druid: '🌿',
  }

  const accessorySlots: Array<{ key: string; label: string; item?: Equipment; emptyIcon: string }> = [
    { key: 'amulet', label: 'Amuleto', item: loadout.accessories.amulet, emptyIcon: '🧿' },
    { key: 'ring_1', label: 'Anel I', item: loadout.accessories.ring1, emptyIcon: '💍' },
    { key: 'ring_2', label: 'Anel II', item: loadout.accessories.ring2, emptyIcon: '💍' },
    { key: 'ring_3', label: 'Anel III', item: loadout.accessories.ring3, emptyIcon: '💍' },
    { key: 'ring_4', label: 'Anel IV', item: loadout.accessories.ring4, emptyIcon: '💍' },
    { key: 'cornalina_1', label: 'Cornalina I', item: loadout.accessories.cornalina1, emptyIcon: '🪨' },
    { key: 'cornalina_2', label: 'Cornalina II', item: loadout.accessories.cornalina2, emptyIcon: '🪨' },
    { key: 'talisma_1', label: 'Talismã I', item: loadout.accessories.talisma1, emptyIcon: '📿' },
    { key: 'talisma_2', label: 'Talismã II', item: loadout.accessories.talisma2, emptyIcon: '📿' },
    { key: 'belt', label: 'Cinto', item: loadout.accessories.belt, emptyIcon: '🧷' },
    { key: 'earring_1', label: 'Brinco I', item: loadout.accessories.earring1, emptyIcon: '🔘' },
    { key: 'earring_2', label: 'Brinco II', item: loadout.accessories.earring2, emptyIcon: '🔘' },
  ]

  const equipmentSlots: Array<{ key: string; label: string; item?: Equipment; emptyIcon: string }> = [
    { key: 'head', label: 'Helmet / Máscara / Visor', item: loadout.equipment.head, emptyIcon: '⛑️' },
    { key: 'body', label: 'Armadura / Quimono / Traje', item: loadout.equipment.body, emptyIcon: '🥋' },
    { key: 'legs', label: 'Legs', item: loadout.equipment.legs, emptyIcon: '🦵' },
    { key: 'boots', label: 'Boots', item: loadout.equipment.boots, emptyIcon: '🥾' },
    { key: 'offhand', label: 'Shield | SpellBook', item: loadout.equipment.offhand, emptyIcon: '📘' },
    { key: 'mainhand', label: 'Sword | Axe | Club | Rod | Wand | Cajado', item: loadout.equipment.mainhand, emptyIcon: '🗡️' },
  ]

  const petSlots = [
    { key: 'pet_1', label: 'Pet I', icon: '🐾', item: loadout.pets.pet1 },
    { key: 'pet_2', label: 'Pet II', icon: '🐉', item: loadout.pets.pet2 },
  ]

  const statRows = [
    { label: 'ATK', value: stats.atk, icon: 'A', allocated: alloc.atk * 2 },
    { label: 'DEF', value: stats.def, icon: 'D', allocated: alloc.def },
    { label: 'VEL', value: stats.spd, icon: 'S', allocated: alloc.spd },
    { label: 'CRIT', value: `${stats.crit}%`, icon: 'C', allocated: 0 },
  ]

  const renderSlot = (slot: { key: string; label: string; item?: Equipment; emptyIcon: string }) => {
    const item = slot.item
    return (
      <div key={slot.key} className="bg-black/25 rounded-lg p-2 border border-amber-100/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-6 rounded-md bg-amber-900/25 border border-amber-100/15 flex items-center justify-center text-sm">
            {item?.icon ?? slot.emptyIcon}
          </span>
          <p className="text-[10px] uppercase tracking-wide text-amber-100/40 leading-tight">{slot.label}</p>
        </div>
        {item ? (
          <p className={`text-xs font-bold leading-tight ${RARITY_COLORS[item.rarity]}`}>{item.name}</p>
        ) : (
          <p className="text-xs text-amber-100/25">Vazio</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      <div className="bg-gradient-to-b from-[#23180f] to-[#130f0a] rounded-xl p-3 border border-amber-700/40">
        <div className="flex gap-3">
          <div className="w-24 h-24 rounded-xl border border-amber-200/25 bg-[radial-gradient(circle_at_30%_20%,#5d3f1e_0%,#1b140f_70%)] flex flex-col items-center justify-center shrink-0">
            <span className="text-3xl leading-none">{classArt[hero.class]}</span>
            <span className="text-[10px] text-amber-100/80 tracking-widest font-bold mt-1">{classData.sigil}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-amber-100 font-bold text-sm tracking-wide truncate">{hero.name}</h2>
              <p className="text-amber-300 text-xs font-bold shrink-0">Ouro {hero.gold}</p>
            </div>
            <p className="text-amber-100/65 text-xs">{classData.name} • Nível {hero.level}</p>
            <p className="text-amber-100/45 text-xs mt-1 leading-relaxed">{classData.description}</p>
            <p className="text-amber-100/30 text-xs mt-1">{hero.totalKills} abates totais</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-amber-100/55">XP</span>
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <span className="text-xs text-amber-100/55">{hero.xp}/{hero.xpToNext}</span>
        </div>
      </div>

      <div className="bg-[#1a130d]/70 rounded-xl p-3 border border-amber-700/30">
        <h3 className="text-amber-100/70 text-xs font-bold uppercase mb-2 tracking-wide">Mensagem do Herói</h3>
        <textarea
          value={heroMessage}
          onChange={e => setHeroMessage(e.target.value)}
          maxLength={180}
          placeholder="Escreva sua mensagem, lema, status ou qualquer recado..."
          className="w-full h-20 resize-none rounded-lg border border-amber-100/15 bg-black/25 px-2.5 py-2 text-xs text-amber-50 placeholder-amber-100/25 outline-none focus:border-amber-400/50"
        />
        <p className="text-right text-[11px] text-amber-100/30 mt-1">{heroMessage.length}/180</p>
      </div>

      {/* Skill Points allocation */}
      {hero.skillPoints > 0 && (
        <div className="bg-[#22160f]/80 rounded-xl p-3 border border-amber-500/40">
          <h3 className="text-amber-200 text-xs font-bold uppercase mb-2 tracking-wide">
            {hero.skillPoints} Ponto{hero.skillPoints !== 1 ? 's' : ''} de Habilidade
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {SKILL_OPTIONS.map(opt => (
              <button
                key={opt.stat}
                onClick={() => spendSkillPoint(opt.stat)}
                className="flex items-center gap-2 bg-amber-900/20 hover:bg-amber-900/35 rounded-lg p-2 text-left transition-colors border border-amber-500/20 hover:border-amber-400/40"
              >
                <span className="w-6 h-6 rounded-full border border-amber-200/30 bg-amber-800/40 flex items-center justify-center text-xs font-bold shrink-0">{opt.icon}</span>
                <div className="min-w-0">
                  <p className="text-amber-50 text-xs font-bold leading-none">{opt.label}</p>
                  <p className="text-amber-200/80 text-xs">{opt.bonus}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#1a130d]/70 rounded-xl p-3 border border-amber-700/30">
        <h3 className="text-amber-100/70 text-xs font-bold uppercase mb-2 tracking-wide">Skills (Statics)</h3>
        <div className="grid grid-cols-2 gap-1.5">
        {statRows.map(row => (
          <div key={row.label} className="bg-[#19120d]/70 rounded-lg p-2 border border-amber-100/10 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full border border-amber-100/25 bg-amber-900/30 flex items-center justify-center text-xs font-bold">{row.icon}</span>
            <div>
              <p className="text-amber-100 font-bold text-sm leading-none">{row.value}</p>
              <p className="text-amber-100/40 text-xs">
                {row.label}
                {row.allocated > 0 && <span className="text-amber-300 ml-1">(+{row.allocated})</span>}
              </p>
            </div>
          </div>
        ))}
        {/* HP row full-width */}
        <div className="col-span-2 bg-[#19120d]/70 rounded-lg p-2 border border-amber-100/10 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full border border-amber-100/25 bg-amber-900/30 flex items-center justify-center text-xs font-bold">V</span>
          <div>
            <p className="text-amber-100 font-bold text-sm leading-none">{stats.hp}/{stats.maxHp}</p>
            <p className="text-amber-100/40 text-xs">
              HP
              {alloc.maxHp > 0 && <span className="text-amber-300 ml-1">(+{alloc.maxHp * 10})</span>}
            </p>
          </div>
        </div>
        </div>
      </div>

      <div className="bg-[#1a130d]/70 rounded-xl p-3 border border-amber-700/30">
        <h3 className="text-amber-100/70 text-xs font-bold uppercase mb-2 tracking-wide">Set - Acessórios</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {accessorySlots.map(renderSlot)}
        </div>
      </div>

      <div className="bg-[#1a130d]/70 rounded-xl p-3 border border-amber-700/30">
        <h3 className="text-amber-100/70 text-xs font-bold uppercase mb-2 tracking-wide">Set - Equipamentos</h3>
        <div className="grid grid-cols-1 gap-1.5">
          {equipmentSlots.map(renderSlot)}
        </div>
      </div>

      <div className="bg-[#1a130d]/70 rounded-xl p-3 border border-amber-700/30">
        <h3 className="text-amber-100/70 text-xs font-bold uppercase mb-2 tracking-wide">Pets</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {petSlots.map(pet => (
            <div key={pet.key} className="bg-black/25 rounded-lg p-2 border border-amber-100/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-md bg-amber-900/25 border border-amber-100/15 flex items-center justify-center text-sm">{pet.item?.icon ?? pet.icon}</span>
                <p className="text-[10px] uppercase tracking-wide text-amber-100/40">{pet.label}</p>
              </div>
              {pet.item ? (
                <p className={`text-xs font-bold ${RARITY_COLORS[pet.item.rarity]}`}>{pet.item.name}</p>
              ) : (
                <p className="text-xs text-amber-100/25">Sem pet equipado</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
