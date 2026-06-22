'use client'

import type { Hero } from '../game/types'
import { CLASS_ICONS } from '../game/data'

interface Props {
  hero: Hero
  isAttacking?: boolean
  isDead?: boolean
}

const CLASS_COLORS: Record<string, string> = {
  warrior: 'from-amber-900 to-amber-700',
  archer:  'from-emerald-900 to-emerald-700',
  mage:    'from-cyan-900 to-cyan-700',
  knight:  'from-stone-700 to-stone-500',
  paladin: 'from-yellow-800 to-yellow-600',
  druid:   'from-green-900 to-teal-700',
}

export function HeroSprite({ hero, isAttacking, isDead }: Props) {
  return (
    <div
      className={`
        flex flex-col items-center gap-1 transition-all duration-300
        ${isAttacking ? 'translate-x-4' : ''}
        ${isDead ? 'opacity-30 grayscale' : ''}
      `}
    >
      <div
        className={`
          w-14 h-14 rounded-full bg-gradient-to-b ${CLASS_COLORS[hero.class]}
          flex items-center justify-center text-xs font-bold tracking-widest
          shadow-lg border-2 border-amber-100/30 text-amber-50
          ${isAttacking ? 'scale-110' : ''}
          transition-transform duration-150
        `}
      >
        {CLASS_ICONS[hero.class]}
      </div>
      <span className="text-xs font-bold text-white/80 truncate max-w-[64px] text-center">
        {hero.name}
      </span>
    </div>
  )
}
