'use client'

import { useState } from 'react'
import type { Enemy } from '../game/types'

interface Props {
  enemy: Enemy
  currentHp: number
  isAttacking?: boolean
  isDead?: boolean
}

export function EnemySprite({ enemy, currentHp, isAttacking, isDead }: Props) {
  const hpPct = (currentHp / enemy.stats.maxHp) * 100
  const [imgFailed, setImgFailed] = useState(false)

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
          w-14 h-14 rounded-full overflow-hidden
          flex items-center justify-center
          shadow-lg border-2 ${enemy.isBoss ? 'border-amber-400 scale-110' : 'border-stone-300/30'}
          transition-transform duration-150 bg-gradient-to-b from-stone-700 to-stone-500
        `}
      >
        {enemy.sprite && !imgFailed ? (
          <img
            src={enemy.sprite}
            alt={enemy.name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-2xl">{enemy.emoji}</span>
        )}
      </div>
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${hpPct > 50 ? 'bg-green-500' : hpPct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white/60 truncate max-w-[72px] text-center">
        {enemy.name}
        {enemy.isBoss && ' (Chefe)'}
      </span>
    </div>
  )
}
