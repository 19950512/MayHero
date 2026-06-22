'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../lib/api'
import { CLASS_ICONS } from '../game/data'
import { useAuthStore } from '../store/authStore'

type RankHero = {
  id: string
  name: string
  class: string
  level: number
  totalKills: number
  gold: number
  currentZone: number
  user: { username: string }
}

const ZONE_NAMES: Record<number, string> = {
  1: 'Floresta Sombria',
  2: 'Cavernas de Pedra',
  3: 'Torre do Mago Sombrio',
}

export default function RankingsPage() {
  const [tab, setTab] = useState<'level' | 'kills'>('level')
  const [rankings, setRankings] = useState<RankHero[]>([])
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    const fetcher = tab === 'level' ? api.rankings.byLevel : api.rankings.byKills
    fetcher()
      .then(r => setRankings(r.rankings as RankHero[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tab])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 sticky top-0 backdrop-blur z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl">⚔️ May Hero</Link>
          <div className="flex gap-3 text-sm items-center">
            <Link href="/shop" className="text-white/50 hover:text-white">🛒 Shop</Link>
            {user ? (
              <>
                <Link href="/" className="text-white/50 hover:text-white">⚔️ Jogar</Link>
                <span className="text-white/30">@{user.username}</span>
                <button onClick={logout} className="text-white/30 hover:text-white/60">Sair</button>
              </>
            ) : (
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">🏆 Rankings</h1>
          <p className="text-white/40 mt-1">Os heróis mais poderosos de May Hero</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-900 rounded-xl p-1 mb-6 border border-white/10">
          {(['level', 'kills'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                tab === t ? 'bg-indigo-700 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'level' ? '⬆️ Por Nível' : '⚔️ Por Abates'}
            </button>
          ))}
        </div>

        {/* Rankings list */}
        {loading ? (
          <div className="text-center text-white/30 py-16">Carregando...</div>
        ) : rankings.length === 0 ? (
          <div className="text-center text-white/20 py-16">
            Nenhum herói ranqueado ainda.<br />
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">Seja o primeiro!</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rankings.map((hero, i) => (
              <div
                key={hero.id}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border transition-colors
                  ${i === 0 ? 'bg-yellow-900/20 border-yellow-500/30' :
                    i === 1 ? 'bg-slate-800/60 border-slate-500/30' :
                    i === 2 ? 'bg-orange-900/10 border-orange-700/20' :
                    'bg-slate-900/40 border-white/5'}
                `}
              >
                <div className="w-8 text-center">
                  {i < 3 ? (
                    <span className="text-xl">{medals[i]}</span>
                  ) : (
                    <span className="text-white/30 font-bold text-sm">#{i + 1}</span>
                  )}
                </div>

                <div className="text-2xl">{CLASS_ICONS[hero.class] ?? '⚔️'}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white truncate">{hero.name}</p>
                    <span className="text-white/30 text-xs">@{hero.user?.username}</span>
                  </div>
                  <p className="text-white/40 text-xs capitalize">
                    {hero.class} • {ZONE_NAMES[hero.currentZone] ?? `Zona ${hero.currentZone}`}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-white font-bold">Nível {hero.level}</p>
                  <p className="text-white/40 text-xs">
                    {tab === 'level' ? `${hero.totalKills} abates` : `${hero.totalKills} abates`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
