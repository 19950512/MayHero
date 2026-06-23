'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import { BASE_STATS } from '../game/data'
import { HERO_CLASSES } from '../game/classes'
import type { HeroClass } from '../game/types'

export function CharacterCreation() {
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState<HeroClass>('warrior')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { startGame, hydrateHeroFromServer } = useGameStore()
  const { user } = useAuthStore()

  // When a logged-in user lands here, check if they already have a server hero
  // and restore it automatically instead of forcing re-creation.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    api.hero.get()
      .then(data => {
        if (cancelled) return
        hydrateHeroFromServer(data)
      })
      .catch(() => {
        // 404 means no hero yet — stay on creation screen
      })
    return () => { cancelled = true }
  }, [user, hydrateHeroFromServer])

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
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto text-[var(--ink)]">
      <div className="text-center pt-2">
        <h1 className="text-3xl font-bold tracking-[0.08em] text-amber-100">May Hero</h1>
        <p className="text-amber-100/60 text-xs mt-1 tracking-wide">Crônicas Medievais de Guerra e Magia</p>
      </div>

      {/* Auth status */}
      {user ? (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl px-3 py-2 text-emerald-200 text-xs text-center">
          Conta conectada como <strong>@{user.username}</strong> com progresso online
        </div>
      ) : (
        <div className="bg-[#1e1711]/60 border border-amber-100/10 rounded-xl px-3 py-2 text-amber-100/50 text-xs text-center">
          Jogando offline.{' '}
          <Link href="/login" className="text-amber-300 hover:text-amber-200">Entrar</Link>
          {' '}para salvar progresso e acessar rankings.
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-3 py-2 text-red-300 text-xs text-center">
          {error}
        </div>
      )}

      <div>
        <label className="text-amber-100/70 text-xs uppercase font-bold mb-1.5 block tracking-wide">Nome do Herói</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Digite seu nome..."
          maxLength={16}
          className="w-full bg-[#19120d] border border-amber-100/15 rounded-xl px-3 py-2.5 text-amber-50 text-sm placeholder-amber-100/20 outline-none focus:border-amber-500/60 transition-colors"
          onKeyDown={e => e.key === 'Enter' && handleStart()}
        />
      </div>

      <div>
        <label className="text-amber-100/70 text-xs uppercase font-bold mb-1.5 block tracking-wide">Ordem de Combate</label>
        <div className="flex flex-col gap-2">
          {HERO_CLASSES.map(info => {
            const cls = info.id
            const selected = selectedClass === cls
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`
                  w-full rounded-xl p-3 text-left border-2 transition-all
                  ${selected ? info.themeColor : 'border-amber-100/10 bg-[#17110d]/70 hover:bg-[#21180f]/80'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full border border-amber-200/30 bg-amber-900/30 flex items-center justify-center text-[11px] font-bold tracking-widest shrink-0">{info.sigil}</span>
                  <div>
                    <p className="text-amber-50 font-bold text-sm tracking-wide">{info.name}</p>
                    <p className="text-amber-100/55 text-xs">{info.description}</p>
                  </div>
                  {selected && <span className="ml-auto text-amber-200/80 text-xs uppercase tracking-wider">ativa</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-[#16110c]/70 rounded-xl p-3 border border-amber-100/10">
        <p className="text-amber-100/55 text-xs uppercase font-bold mb-2 tracking-wide">Atributos Iniciais</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><p className="text-amber-100 font-bold text-sm">{stats.maxHp}</p><p className="text-amber-100/35 text-xs">HP</p></div>
          <div><p className="text-amber-100 font-bold text-sm">{stats.atk}</p><p className="text-amber-100/35 text-xs">ATK</p></div>
          <div><p className="text-amber-100 font-bold text-sm">{stats.def}</p><p className="text-amber-100/35 text-xs">DEF</p></div>
          <div><p className="text-amber-100 font-bold text-sm">{stats.crit}%</p><p className="text-amber-100/35 text-xs">CRIT</p></div>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!name.trim() || loading}
        className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-amber-800 to-yellow-700 hover:from-amber-700 hover:to-yellow-600 disabled:opacity-30 disabled:cursor-not-allowed text-amber-50 transition-all shadow-lg"
      >
        {loading ? 'Forjando personagem...' : 'Iniciar Campanha'}
      </button>

      <p className="text-center text-[11px] text-amber-100/45 pb-2">
        Em breve: ordens avançadas como Paladin, Druid e Sorcerer.
      </p>
    </div>
  )
}
