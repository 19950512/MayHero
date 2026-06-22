'use client'

import { useGameStore } from '../store/gameStore'
import { ZONES } from '../game/data'

export function ZoneSelector() {
  const { hero, currentZone, changeZone, killsInZone } = useGameStore()
  if (!hero) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-amber-100/60 text-xs uppercase font-bold tracking-wide">Reinos</p>
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
                  ? 'bg-amber-900/35 border-amber-500/60'
                  : locked
                    ? 'bg-stone-800/30 border-amber-100/10 opacity-40 cursor-not-allowed'
                    : 'bg-stone-900/45 border-amber-100/20 hover:border-amber-100/35 hover:bg-stone-800/60'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold ${active ? 'text-amber-100' : 'text-amber-100/70'}`}>{zone.name}</p>
                  <p className="text-xs text-amber-100/35">{zone.description}</p>
                </div>
                {locked ? (
                  <span className="text-amber-100/40 text-xs">Nível {zone.minLevel}+</span>
                ) : active ? (
                  <div className="text-right">
                    <span className="text-emerald-300 text-xs font-bold">Ativo</span>
                    <p className="text-amber-100/35 text-xs">{killsInZone} abates</p>
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
