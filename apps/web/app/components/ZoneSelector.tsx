'use client'

import { useGameStore } from '../store/gameStore'
import { CITIES } from '../game/data'

export function ZoneSelector() {
  const { hero, currentDungeon, changeDungeon, killsInZone } = useGameStore()
  if (!hero) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-amber-100/60 text-xs uppercase font-bold tracking-wide">Cidades & Masmorras</p>
      <div className="flex flex-col gap-4">
        {CITIES.map(city => (
          <div key={city.id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <p className="text-amber-100/50 text-xs font-semibold uppercase tracking-wider">{city.name}</p>
              <div className="flex-1 h-px bg-amber-100/10" />
            </div>
            <p className="text-amber-100/30 text-xs mb-1">{city.description}</p>
            {city.dungeons.map(dungeon => {
              const locked = hero.level < dungeon.minLevel
              const active = dungeon.id === currentDungeon

              return (
                <button
                  key={dungeon.id}
                  onClick={() => changeDungeon(dungeon.id)}
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
                      <p className={`text-sm font-bold ${active ? 'text-amber-100' : 'text-amber-100/70'}`}>{dungeon.name}</p>
                      <p className="text-xs text-amber-100/35">{dungeon.description}</p>
                      <p className="text-xs text-amber-100/25 mt-0.5">Nível recomendado: {dungeon.recommendedLevel}</p>
                    </div>
                    <div className="ml-2 shrink-0 text-right">
                      {locked ? (
                        <span className="text-amber-100/40 text-xs">Nível {dungeon.minLevel}+</span>
                      ) : active ? (
                        <>
                          <span className="text-emerald-300 text-xs font-bold">Ativo</span>
                          <p className="text-amber-100/35 text-xs">{killsInZone} abates</p>
                        </>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
