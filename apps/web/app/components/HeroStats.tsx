'use client'

import { useGameStore } from '../store/gameStore'
import { computeStats } from '../game/engine'
import { RARITY_COLORS } from '../game/data'
import type { SkillAllocStat } from '../game/types'

const SKILL_OPTIONS: { stat: SkillAllocStat; label: string; icon: string; bonus: string }[] = [
  { stat: 'atk',   label: 'ATK',  icon: '⚔️', bonus: '+2 ATK' },
  { stat: 'def',   label: 'DEF',  icon: '🛡️', bonus: '+1 DEF' },
  { stat: 'maxHp', label: 'Vida', icon: '❤️', bonus: '+10 HP' },
  { stat: 'spd',   label: 'VEL',  icon: '💨', bonus: '+1 VEL' },
]

export function HeroStats() {
  const { hero, spendSkillPoint } = useGameStore()
  if (!hero) return null

  const stats = computeStats(hero)
  const xpPct = (hero.xp / hero.xpToNext) * 100
  const alloc = hero.skillAllocations ?? { atk: 0, def: 0, maxHp: 0, spd: 0 }

  const statRows = [
    { label: 'ATK', value: stats.atk, icon: '⚔️', allocated: alloc.atk * 2 },
    { label: 'DEF', value: stats.def, icon: '🛡️', allocated: alloc.def },
    { label: 'VEL', value: stats.spd, icon: '💨', allocated: alloc.spd },
    { label: 'CRIT', value: `${stats.crit}%`, icon: '💥', allocated: 0 },
  ]

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Hero header */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-3 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white font-bold text-sm">{hero.name}</h2>
            <p className="text-white/40 text-xs capitalize">{hero.class} • Nível {hero.level}</p>
          </div>
          <div className="text-right">
            <p className="text-yellow-400 text-sm font-bold">🪙 {hero.gold}</p>
            <p className="text-white/30 text-xs">{hero.totalKills} abates</p>
          </div>
        </div>

        {/* XP bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">XP</span>
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <span className="text-xs text-white/40">{hero.xp}/{hero.xpToNext}</span>
        </div>
      </div>

      {/* Skill Points allocation */}
      {hero.skillPoints > 0 && (
        <div className="bg-purple-950/50 rounded-xl p-3 border border-purple-500/40">
          <h3 className="text-purple-300 text-xs font-bold uppercase mb-2">
            ✨ {hero.skillPoints} Ponto{hero.skillPoints !== 1 ? 's' : ''} de Habilidade
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {SKILL_OPTIONS.map(opt => (
              <button
                key={opt.stat}
                onClick={() => spendSkillPoint(opt.stat)}
                className="flex items-center gap-2 bg-purple-900/40 hover:bg-purple-800/60 rounded-lg p-2 text-left transition-colors border border-purple-500/20 hover:border-purple-400/40"
              >
                <span className="text-base shrink-0">{opt.icon}</span>
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold leading-none">{opt.label}</p>
                  <p className="text-purple-300 text-xs">{opt.bonus}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {statRows.map(row => (
          <div key={row.label} className="bg-slate-800/60 rounded-lg p-2 border border-white/5 flex items-center gap-2">
            <span className="text-base">{row.icon}</span>
            <div>
              <p className="text-white font-bold text-sm leading-none">{row.value}</p>
              <p className="text-white/30 text-xs">
                {row.label}
                {row.allocated > 0 && <span className="text-purple-400 ml-1">(+{row.allocated}★)</span>}
              </p>
            </div>
          </div>
        ))}
        {/* HP row full-width */}
        <div className="col-span-2 bg-slate-800/60 rounded-lg p-2 border border-white/5 flex items-center gap-2">
          <span className="text-base">❤️</span>
          <div>
            <p className="text-white font-bold text-sm leading-none">{stats.hp}/{stats.maxHp}</p>
            <p className="text-white/30 text-xs">
              HP
              {alloc.maxHp > 0 && <span className="text-purple-400 ml-1">(+{alloc.maxHp * 10}★)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-slate-800/60 rounded-xl p-3 border border-white/10">
        <h3 className="text-white/60 text-xs font-bold uppercase mb-2">Equipamento</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(['weapon', 'armor', 'helm', 'ring'] as const).map(slot => {
            const equip = hero.equipment[slot]
            return (
              <div key={slot} className="bg-black/30 rounded-lg p-2 border border-white/5">
                {equip ? (
                  <>
                    <p className="text-base leading-none mb-0.5">{equip.icon}</p>
                    <p className={`text-xs font-medium leading-tight ${RARITY_COLORS[equip.rarity]}`}>{equip.name}</p>
                  </>
                ) : (
                  <>
                    <p className="text-base leading-none mb-0.5 text-white/10">
                      {slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🥋' : slot === 'helm' ? '⛑️' : '💍'}
                    </p>
                    <p className="text-xs text-white/20 capitalize">{slot === 'weapon' ? 'Arma' : slot === 'armor' ? 'Armadura' : slot === 'helm' ? 'Elmo' : 'Anel'}</p>
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
