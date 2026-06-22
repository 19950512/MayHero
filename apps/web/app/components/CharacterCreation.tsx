'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import { BASE_STATS } from '../game/data'
import type { HeroClass } from '../game/types'

const CLASS_DESCRIPTIONS: Record<HeroClass, { name: string; desc: string; color: string; sigil: string }> = {
  warrior: { name: 'Guerreiro',     sigil: 'GU', desc: 'Linha de frente versátil. Equilíbrio entre ataque e defesa.',              color: 'border-amber-600/70 bg-amber-950/40' },
  archer:  { name: 'Arqueiro',      sigil: 'AR', desc: 'Alta velocidade e crítico. Desfere golpes certeiros à distância.',         color: 'border-green-600/70 bg-green-950/30' },
  mage:    { name: 'Sorcerer',      sigil: 'MA', desc: 'Poder arcano supremo. Frágil mas de dano devastador.',                      color: 'border-cyan-600/70 bg-cyan-950/30' },
  knight:  { name: 'Knight',        sigil: 'KN', desc: 'Fortaleza viva em armadura pesada. Excelência em sobrevivência.',           color: 'border-stone-400/70 bg-stone-800/40' },
  paladin: { name: 'Paladin',       sigil: 'PA', desc: 'Guerreiro sagrado com luz divina. Equilíbrio entre força e proteção.',      color: 'border-yellow-500/70 bg-yellow-950/30' },
  druid:   { name: 'Druid',         sigil: 'DR', desc: 'Manipulador da natureza. Alto dano mágico com mobilidade sobrenatural.',     color: 'border-emerald-500/70 bg-emerald-950/30' },
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
          {(Object.keys(CLASS_DESCRIPTIONS) as HeroClass[]).map(cls => {
            const info = CLASS_DESCRIPTIONS[cls]
            const selected = selectedClass === cls
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`
                  w-full rounded-xl p-3 text-left border-2 transition-all
                  ${selected ? info.color : 'border-amber-100/10 bg-[#17110d]/70 hover:bg-[#21180f]/80'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full border border-amber-200/30 bg-amber-900/30 flex items-center justify-center text-[11px] font-bold tracking-widest shrink-0">{info.sigil}</span>
                  <div>
                    <p className="text-amber-50 font-bold text-sm tracking-wide">{info.name}</p>
                    <p className="text-amber-100/55 text-xs">{info.desc}</p>
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
