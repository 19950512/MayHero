'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import { BASE_STATS, CLASS_ICONS } from '../game/data'
import type { HeroClass } from '../game/types'

const CLASS_DESCRIPTIONS: Record<HeroClass, { name: string; desc: string; color: string }> = {
  warrior: { name: 'Guerreiro', desc: 'Alta vida e defesa. Resistente e confiável.', color: 'border-red-600 bg-red-900/30' },
  archer:  { name: 'Arqueiro', desc: 'Alto crítico e velocidade. Ataca rápido.', color: 'border-green-600 bg-green-900/30' },
  mage:    { name: 'Mago', desc: 'Altíssimo ataque. Frágil mas devastador.', color: 'border-indigo-600 bg-indigo-900/30' },
}

export function CharacterCreation() {
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState<HeroClass>('warrior')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { startGame } = useGameStore()
  const { user } = useAuthStore()

  const handleStart = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const heroName = name.trim()
    const baseStats = BASE_STATS[selectedClass]

    // Se logado, cria o herói na API primeiro
    if (user) {
      try {
        await api.hero.create({
          name: heroName,
          class: selectedClass,
          stats: baseStats,
          baseStats: baseStats,
        })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : ''
        // "Herói já existe" é ok — apenas sincronizará depois
        if (!msg.includes('já existe')) {
          setError(msg || 'Erro ao criar herói online.')
          setLoading(false)
          return
        }
      }
    }

    startGame(heroName, selectedClass)
    setLoading(false)
  }

  const stats = BASE_STATS[selectedClass]

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-black text-white tracking-tight">⚔️ May Hero</h1>
        <p className="text-white/40 text-xs mt-1">Idle RPG — Crie seu herói</p>
      </div>

      {/* Auth status */}
      {user ? (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-3 py-2 text-green-300 text-xs text-center">
          ✓ Logado como <strong>@{user.username}</strong> — progresso salvo online
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-white/40 text-xs text-center">
          Jogando offline.{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Entrar</Link>
          {' '}para salvar progresso e acessar rankings.
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-3 py-2 text-red-300 text-xs text-center">
          {error}
        </div>
      )}

      <div>
        <label className="text-white/50 text-xs uppercase font-bold mb-1.5 block">Nome do Herói</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Digite seu nome..."
          maxLength={16}
          className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 outline-none focus:border-indigo-500 transition-colors"
          onKeyDown={e => e.key === 'Enter' && handleStart()}
        />
      </div>

      <div>
        <label className="text-white/50 text-xs uppercase font-bold mb-1.5 block">Classe</label>
        <div className="flex flex-col gap-2">
          {(Object.keys(CLASS_DESCRIPTIONS) as HeroClass[]).map(cls => {
            const info = CLASS_DESCRIPTIONS[cls]
            const selected = selectedClass === cls
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`
                  w-full rounded-xl p-3 text-left border-2 transition-all
                  ${selected ? info.color : 'border-white/10 bg-slate-800/40 hover:bg-slate-800/60'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CLASS_ICONS[cls]}</span>
                  <div>
                    <p className="text-white font-bold text-sm">{info.name}</p>
                    <p className="text-white/40 text-xs">{info.desc}</p>
                  </div>
                  {selected && <span className="ml-auto text-white/60 text-xs">✓</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
        <p className="text-white/40 text-xs uppercase font-bold mb-2">Status Inicial</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><p className="text-white font-bold text-sm">{stats.maxHp}</p><p className="text-white/30 text-xs">HP</p></div>
          <div><p className="text-white font-bold text-sm">{stats.atk}</p><p className="text-white/30 text-xs">ATK</p></div>
          <div><p className="text-white font-bold text-sm">{stats.def}</p><p className="text-white/30 text-xs">DEF</p></div>
          <div><p className="text-white font-bold text-sm">{stats.crit}%</p><p className="text-white/30 text-xs">CRIT</p></div>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!name.trim() || loading}
        className="w-full py-3 rounded-xl font-black text-base bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all shadow-lg"
      >
        {loading ? 'Criando...' : 'Começar Aventura'}
      </button>
    </div>
  )
}
