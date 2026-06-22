'use client'

import { useGameStore } from '../store/gameStore'
import { ZONES } from '../game/data'

export function ZoneSelector() {
  const { hero, currentZone, changeZone, killsInZone } = useGameStore()
  if (!hero) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-white/40 text-xs uppercase font-bold">Zonas</p>
      <div className="flex flex-col gap-1.5">
        {ZONES.map(zone => {
          const locked = hero.level < zone.minLevel
          const active = zone.id === currentZone

          return (
            <button
              key={zone.id}
              onClick={() => changeZone(zone.id)}
              disabled={locked}
              className={`
                w-full rounded-xl p-3 text-left border transition-all
                ${active
                  ? 'bg-indigo-900/80 border-indigo-500/60'
                  : locked
                    ? 'bg-slate-800/30 border-white/5 opacity-40 cursor-not-allowed'
                    : 'bg-slate-800/60 border-white/10 hover:border-white/20 hover:bg-slate-700/60'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold ${active ? 'text-white' : 'text-white/70'}`}>{zone.name}</p>
                  <p className="text-xs text-white/30">{zone.description}</p>
                </div>
                {locked ? (
                  <span className="text-white/30 text-xs">Nível {zone.minLevel}+</span>
                ) : active ? (
                  <div className="text-right">
                    <span className="text-green-400 text-xs font-bold">✓ Ativo</span>
                    <p className="text-white/30 text-xs">{killsInZone} abates</p>
                  </div>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
