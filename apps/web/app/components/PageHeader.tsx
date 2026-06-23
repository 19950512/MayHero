'use client'

import Link from 'next/link'
import { useGameStore } from '../store/gameStore'

export function PageHeader() {
  const { hero } = useGameStore()

  return (
    <header className="border-b border-amber-900/40 bg-[#1a140f]/90 sticky top-0 backdrop-blur z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="text-amber-100 font-semibold text-base tracking-[0.08em] shrink-0">May Hero</Link>

        {hero ? (
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-amber-100/50 text-xs">Nível</span>
              <span className="text-amber-200 font-bold text-xs">{hero.level}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 max-w-[160px]">
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (hero.xp / hero.xpToNext) * 100)}%` }}
                />
              </div>
              <span className="text-blue-300 text-[10px] font-semibold shrink-0 hidden sm:inline">
                {hero.xp}/{hero.xpToNext}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-amber-100/50 text-xs">💰</span>
              <span className="text-amber-300 font-bold text-xs">{hero.gold.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <Link
          href="/"
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/30 hover:bg-amber-800/50 text-amber-100 text-xs font-bold transition-colors"
        >
          ☰ Menu
        </Link>
      </div>
    </header>
  )
}
