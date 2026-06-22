'use client'

import type { Enemy } from '../game/types'

interface Props {
  enemy: Enemy
  currentHp: number
  isAttacking?: boolean
  isDead?: boolean
}

export function EnemySprite({ enemy, currentHp, isAttacking, isDead }: Props) {
  const hpPct = (currentHp / enemy.stats.maxHp) * 100

  return (
    <div
      className={`
        flex flex-col items-center gap-1 transition-all duration-300
        ${isAttacking ? '-translate-x-4' : ''}
        ${isDead ? 'opacity-0 scale-50' : ''}
      `}
    >
      <div
        className={`
          w-14 h-14 rounded-full bg-gradient-to-b from-gray-800 to-gray-600
          flex items-center justify-center text-3xl
          shadow-lg border-2 ${enemy.isBoss ? 'border-yellow-400' : 'border-white/20'}
          transition-transform duration-150
          ${enemy.isBoss ? 'scale-110' : ''}
        `}
      >
        {enemy.emoji}
      </div>
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${hpPct > 50 ? 'bg-green-500' : hpPct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white/60 truncate max-w-[72px] text-center">
        {enemy.name}
        {enemy.isBoss && ' 👑'}
      </span>
    </div>
  )
}
