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
      <div className="relative bg-gradient-to-b from-[#23180f] to-[#140f0a] rounded-xl p-4 border border-amber-800/40">
        {/* Zone name */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-amber-100/55 font-medium">
          {battle.enemy?.isBoss ? 'Chefe da Zona' : battle.phase === 'idle' ? 'Aguardando confronto' : 'Confronto em curso'}
        </div>

        {/* Fighters */}
        <div className="flex items-center justify-between mt-4">
          <HeroSprite
            hero={hero}
            isAttacking={isHeroAttacking}
            isDead={hero.stats.hp <= 0}
          />

          <div className="flex flex-col items-center gap-1">
            <span className="text-amber-100/30 text-xl">X</span>
            <span className="text-xs text-amber-100/35 uppercase tracking-wide">duelo</span>
          </div>

          {battle.enemy ? (
            <EnemySprite
              enemy={battle.enemy}
              currentHp={battle.enemyCurrentHp}
              isAttacking={isEnemyAttacking}
              isDead={battle.phase === 'victory'}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-stone-800/40 border-2 border-dashed border-amber-100/20 flex items-center justify-center text-amber-100/30 text-xs tracking-widest">
              ?
            </div>
          )}
        </div>

        {/* Hero HP bar */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-amber-100/45 w-6">Vida</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
              style={{ width: `${(hero.stats.hp / hero.stats.maxHp) * 100}%` }}
            />
          </div>
          <span className="text-xs text-amber-100/65 w-16 text-right">{hero.stats.hp}/{hero.stats.maxHp}</span>
        </div>
      </div>

      {/* Battle log */}
      <div
        ref={logsRef}
        className="flex-1 overflow-y-auto bg-black/30 rounded-xl p-2 border border-amber-100/10 min-h-0 max-h-[130px]"
      >
        {battle.logs.length === 0 ? (
          <p className="text-amber-100/30 text-xs text-center mt-2">O confronto começará em breve...</p>
        ) : (
          battle.logs.map((log) => (
            <p
              key={log.id}
              className={`text-xs leading-relaxed ${
                log.actor === 'hero'
                  ? log.isCrit ? 'text-amber-300 font-bold' : 'text-emerald-300'
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
              ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-50'
              : 'bg-stone-700 hover:bg-stone-600 text-stone-100/70'
          }`}
        >
          {autoFight ? 'Combate Automático' : 'Combate Pausado'}
        </button>
        <button
          onClick={usePotion}
          disabled={hero.gold < potionCost || hero.stats.hp >= hero.stats.maxHp}
          className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-800 hover:bg-amber-700 disabled:opacity-30 disabled:cursor-not-allowed text-amber-50 transition-colors"
        >
          Poção ({potionCost} ouro)
        </button>
      </div>
    </div>
  )
}
