'use client'

import { useGameStore } from '../store/gameStore'
import { computeStats } from '../game/engine'
import { RARITY_COLORS } from '../game/data'
import type { SkillAllocStat } from '../game/types'

const SKILL_OPTIONS: { stat: SkillAllocStat; label: string; icon: string; bonus: string }[] = [
  { stat: 'atk',   label: 'ATK',  icon: 'A', bonus: '+2 ATK' },
  { stat: 'def',   label: 'DEF',  icon: 'D', bonus: '+1 DEF' },
  { stat: 'maxHp', label: 'Vida', icon: 'V', bonus: '+10 HP' },
  { stat: 'spd',   label: 'VEL',  icon: 'S', bonus: '+1 VEL' },
]

export function HeroStats() {
  const { hero, spendSkillPoint } = useGameStore()
  if (!hero) return null

  const stats = computeStats(hero)
  const xpPct = (hero.xp / hero.xpToNext) * 100
  const alloc = hero.skillAllocations ?? { atk: 0, def: 0, maxHp: 0, spd: 0 }

  const statRows = [
    { label: 'ATK', value: stats.atk, icon: 'A', allocated: alloc.atk * 2 },
    { label: 'DEF', value: stats.def, icon: 'D', allocated: alloc.def },
    { label: 'VEL', value: stats.spd, icon: 'S', allocated: alloc.spd },
    { label: 'CRIT', value: `${stats.crit}%`, icon: 'C', allocated: 0 },
  ]

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Hero header */}
      <div className="bg-gradient-to-b from-[#22170f] to-[#130f0a] rounded-xl p-3 border border-amber-700/40">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-amber-100 font-bold text-sm tracking-wide">{hero.name}</h2>
            <p className="text-amber-100/50 text-xs capitalize">{hero.class} • Nível {hero.level}</p>
          </div>
          <div className="text-right">
            <p className="text-amber-300 text-sm font-bold">Ouro {hero.gold}</p>
            <p className="text-amber-100/35 text-xs">{hero.totalKills} abates</p>
          </div>
        </div>

        {/* XP bar */}
        <div className="flex items-center gap-2">
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

      {/* Stats grid */}
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

      {/* Equipment */}
      <div className="bg-[#1a130d]/70 rounded-xl p-3 border border-amber-700/30">
        <h3 className="text-amber-100/65 text-xs font-bold uppercase mb-2 tracking-wide">Equipamento</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(['weapon', 'armor', 'helm', 'ring'] as const).map(slot => {
            const equip = hero.equipment[slot]
            return (
              <div key={slot} className="bg-black/30 rounded-lg p-2 border border-amber-100/10">
                {equip ? (
                  <>
                    <p className="text-base leading-none mb-0.5">{slot.toUpperCase().slice(0, 2)}</p>
                    <p className={`text-xs font-medium leading-tight ${RARITY_COLORS[equip.rarity]}`}>{equip.name}</p>
                  </>
                ) : (
                  <>
                    <p className="text-base leading-none mb-0.5 text-amber-100/20">{slot.toUpperCase().slice(0, 2)}</p>
                    <p className="text-xs text-amber-100/30 capitalize">{slot === 'weapon' ? 'Arma' : slot === 'armor' ? 'Armadura' : slot === 'helm' ? 'Elmo' : 'Anel'}</p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
