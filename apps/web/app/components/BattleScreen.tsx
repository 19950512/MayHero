'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { HeroSprite } from './HeroSprite'
import { EnemySprite } from './EnemySprite'

export function BattleScreen() {
  const { hero, battle, autoFight, toggleAutoFight, usePotion } = useGameStore()
  const logsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [battle.logs])

  if (!hero) return null

  const isHeroAttacking = battle.logs.at(-1)?.actor === 'hero' && battle.phase === 'fighting'
  const isEnemyAttacking = battle.logs.at(-1)?.actor === 'enemy' && battle.phase === 'fighting'
  const potionCost = 10 + hero.level * 2

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Battle arena */}
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl p-4 border border-white/10">
        {/* Zone name */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-white/40 font-medium">
          {battle.enemy?.isBoss ? '⚠️ Chefe da Zona' : battle.phase === 'idle' ? 'Aguardando...' : 'Em batalha'}
        </div>

        {/* Fighters */}
        <div className="flex items-center justify-between mt-4">
          <HeroSprite
            hero={hero}
            isAttacking={isHeroAttacking}
            isDead={hero.stats.hp <= 0}
          />

          <div className="flex flex-col items-center gap-1">
            <span className="text-white/20 text-2xl">⚔️</span>
            <span className="text-xs text-white/30">VS</span>
          </div>

          {battle.enemy ? (
            <EnemySprite
              enemy={battle.enemy}
              currentHp={battle.enemyCurrentHp}
              isAttacking={isEnemyAttacking}
              isDead={battle.phase === 'victory'}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-700/50 border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 text-2xl">
              ?
            </div>
          )}
        </div>

        {/* Hero HP bar */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-white/40 w-4">❤️</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
              style={{ width: `${(hero.stats.hp / hero.stats.maxHp) * 100}%` }}
            />
          </div>
          <span className="text-xs text-white/50 w-16 text-right">{hero.stats.hp}/{hero.stats.maxHp}</span>
        </div>
      </div>

      {/* Battle log */}
      <div
        ref={logsRef}
        className="flex-1 overflow-y-auto bg-black/30 rounded-xl p-2 border border-white/5 min-h-0 max-h-[130px]"
      >
        {battle.logs.length === 0 ? (
          <p className="text-white/20 text-xs text-center mt-2">O combate começará em breve...</p>
        ) : (
          battle.logs.map((log) => (
            <p
              key={log.id}
              className={`text-xs leading-relaxed ${
                log.actor === 'hero'
                  ? log.isCrit ? 'text-yellow-300 font-bold' : 'text-green-300'
                  : log.isCrit ? 'text-red-300 font-bold' : 'text-red-200/70'
              }`}
            >
              {log.message}
            </p>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={toggleAutoFight}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
            autoFight
              ? 'bg-green-700 hover:bg-green-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white/60'
          }`}
        >
          {autoFight ? '⚔️ Auto ON' : '⏸ Pausado'}
        </button>
        <button
          onClick={usePotion}
          disabled={hero.gold < potionCost || hero.stats.hp >= hero.stats.maxHp}
          className="flex-1 py-2 rounded-lg text-xs font-bold bg-purple-800 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
        >
          🧪 Poção ({potionCost}g)
        </button>
      </div>
    </div>
  )
}
