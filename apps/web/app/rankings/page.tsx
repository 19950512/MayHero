'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../lib/api'
import { CLASS_ICONS } from '../game/data'
import { PageHeader } from '../components/PageHeader'
import { HeroProfileModal } from '../components/HeroProfileModal'

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
  1: 'Floresta de Santa Rita',
  2: 'Cavernas do Rio Pedroso',
  3: 'Torre do Arauto das Sombras',
}

const CLASS_NAMES: Record<string, string> = {
  warrior: 'Guerreiro',
  archer:  'Arqueiro',
  mage:    'Sorcerer',
  knight:  'Knight',
  paladin: 'Paladin',
  druid:   'Druid',
}

export default function RankingsPage() {
  const [tab, setTab] = useState<'level' | 'kills'>('level')
  const [rankings, setRankings] = useState<RankHero[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingHero, setViewingHero] = useState<string | null>(null)

  useEffect(() => {
    const fetcher = tab === 'level' ? api.rankings.byLevel : api.rankings.byKills
    fetcher()
      .then(r => setRankings(r.rankings as RankHero[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tab])

  const medals = ['I', 'II', 'III']

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,#3b2818_0%,#1d150f_35%,#100d08_70%,#090806_100%)] text-[var(--ink)]">
      {viewingHero && (
        <HeroProfileModal heroName={viewingHero} onClose={() => setViewingHero(null)} />
      )}
      <PageHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-100 tracking-[0.08em]">Tabela de Heróis</h1>
          <p className="text-amber-100/55 mt-1">Registro oficial dos campeões de May Hero</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#1d150f] rounded-xl p-1 mb-6 border border-amber-800/40">
          {(['level', 'kills'] as const).map(t => (
            <button
              key={t}
              onClick={() => {
                setLoading(true)
                setTab(t)
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                tab === t ? 'bg-amber-800 text-amber-50' : 'text-amber-100/45 hover:text-amber-100/75'
              }`}
            >
              {t === 'level' ? 'Por Nível' : 'Por Abates'}
            </button>
          ))}
        </div>

        {/* Rankings list */}
        {loading ? (
          <div className="text-center text-amber-100/35 py-16">Carregando...</div>
        ) : rankings.length === 0 ? (
          <div className="text-center text-amber-100/30 py-16">
            Nenhum herói ranqueado ainda.<br />
            <Link href="/register" className="text-amber-300 hover:text-amber-200 mt-2 inline-block">Seja o primeiro!</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rankings.map((hero, i) => (
              <button
                key={hero.id}
                onClick={() => setViewingHero(hero.name)}
                className={`
                  w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-colors hover:brightness-110 active:scale-[0.99]
                  ${i === 0 ? 'bg-amber-900/25 border-amber-500/40' :
                    i === 1 ? 'bg-stone-700/35 border-stone-400/30' :
                    i === 2 ? 'bg-orange-900/20 border-orange-700/30' :
                    'bg-stone-900/45 border-amber-100/10'}
                `}
              >
                <div className="w-8 text-center">
                  {i < 3 ? (
                    <span className="text-sm tracking-widest text-amber-100/90">{medals[i]}</span>
                  ) : (
                    <span className="text-amber-100/35 font-bold text-sm">#{i + 1}</span>
                  )}
                </div>

                <div className="w-9 h-9 rounded-full border border-amber-200/35 bg-amber-900/25 flex items-center justify-center text-[10px] tracking-widest font-bold text-amber-50">{CLASS_ICONS[hero.class] ?? 'HR'}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-amber-100 truncate tracking-wide">{hero.name}</p>
                    <span className="text-amber-100/35 text-xs">@{hero.user?.username}</span>
                  </div>
                  <p className="text-amber-100/45 text-xs">
                    {CLASS_NAMES[hero.class] ?? hero.class} • {ZONE_NAMES[hero.currentZone] ?? `Zona ${hero.currentZone}`}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-amber-100 font-bold">Nível {hero.level}</p>
                  <p className="text-amber-100/45 text-xs">
                    {tab === 'level' ? `${hero.totalKills} abates` : `${hero.totalKills} abates`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
