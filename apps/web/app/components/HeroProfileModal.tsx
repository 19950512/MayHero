'use client'

import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { CLASS_ICONS, RARITY_COLORS, DUNGEON_BY_ID } from '../game/data'
import { ITEM_BY_ID } from '../game/items'

type PublicProfile = {
  name: string
  class: string
  level: number
  xp: number
  xpToNext: number
  gold: number
  totalKills: number
  skillPoints: number
  currentZone: number
  statsJson: Record<string, unknown>
  equipJson: Record<string, unknown>
  username: string | null
}

const CLASS_DISPLAY: Record<string, string> = {
  warrior: 'Guerreiro', archer: 'Arqueiro', mage: 'Sorcerer',
  knight: 'Knight', paladin: 'Paladin', druid: 'Druid',
}

const STAT_LABELS: Record<string, string> = {
  atk: 'ATK', def: 'DEF', spd: 'VEL', crit: 'CRIT', maxHp: 'HP', maxMp: 'MP',
}

const SLOT_LABELS: Record<string, string> = {
  weapon: 'Arma', armor: 'Armadura', helm: 'Elmo', ring: 'Anel',
}

const SLOT_ORDER = ['weapon', 'armor', 'helm', 'ring']

function zoneName(zoneId: number): string {
  const dungeon = Object.values(DUNGEON_BY_ID).find(d => d.zoneId === zoneId)
  return dungeon?.name ?? `Zona ${zoneId}`
}

interface Props {
  heroName: string
  onClose: () => void
  onSendMail?: (name: string, heroClass: string, level: number) => void
}

export function HeroProfileModal({ heroName, onClose, onSendMail }: Props) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.hero.publicProfile(heroName)
      .then(setProfile)
      .catch(e => setError(e instanceof Error ? e.message : 'Erro ao carregar perfil.'))
      .finally(() => setLoading(false))
  }, [heroName])

  const sigil = profile ? (CLASS_ICONS[profile.class] ?? profile.class.slice(0, 2).toUpperCase()) : '?'
  const xpPct = profile ? Math.min(100, (profile.xp / profile.xpToNext) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <div
        className="bg-[#1a140f] border border-amber-900/40 rounded-2xl w-full max-w-sm flex flex-col gap-0 max-h-[92dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5 shrink-0">
          <h2 className="text-amber-100/60 text-[10px] uppercase font-bold tracking-widest">Perfil do Herói</h2>
          <button onClick={onClose} className="text-amber-100/40 hover:text-amber-100 text-xl leading-none">×</button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-amber-100/30 text-sm">Carregando...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-16 px-4">
            <p className="text-red-300/70 text-sm text-center">{error}</p>
          </div>
        )}

        {profile && (
          <>
            {/* Hero card */}
            <div className="px-4 py-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-amber-200/30 bg-amber-900/30 flex items-center justify-center text-sm font-bold tracking-widest text-amber-50 shrink-0">
                {sigil}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-amber-100 font-bold text-lg tracking-wide truncate">{profile.name}</p>
                <p className="text-amber-100/55 text-xs">{CLASS_DISPLAY[profile.class] ?? profile.class} · Nível {profile.level}</p>
                {profile.username && <p className="text-amber-100/30 text-xs mt-0.5">@{profile.username}</p>}
              </div>
            </div>

            {/* XP bar */}
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between text-[10px] text-amber-100/35 mb-1">
                <span>Experiência</span>
                <span>{profile.xp} / {profile.xpToNext}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="mx-4 mb-3 bg-black/25 rounded-xl p-3 border border-white/5">
              <p className="text-amber-100/40 text-[10px] uppercase font-bold tracking-widest mb-2">Atributos</p>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(STAT_LABELS).map(([key, label]) => {
                  const val = profile.statsJson[key]
                  if (val === undefined) return null
                  return (
                    <div key={key} className="bg-black/30 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-amber-100 font-bold text-xs">{String(Math.round(Number(val)))}</p>
                      <p className="text-amber-100/35 text-[10px]">{label}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Equipment */}
            <div className="mx-4 mb-3">
              <p className="text-amber-100/40 text-[10px] uppercase font-bold tracking-widest mb-2">Equipamento</p>
              <div className="flex flex-col gap-1.5">
                {SLOT_ORDER.map(slot => {
                  const item = profile.equipJson[slot] as Record<string, unknown> | null | undefined
                  if (!item || typeof item !== 'object') {
                    return (
                      <div key={slot} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-white/5 bg-black/20">
                        <span className="text-white/15 text-base w-7 text-center">·</span>
                        <div>
                          <p className="text-white/20 text-xs">{SLOT_LABELS[slot]}</p>
                          <p className="text-white/15 text-[10px]">Vazio</p>
                        </div>
                      </div>
                    )
                  }
                  const rarity = (item.rarity as string) ?? 'common'
                  const colorClass = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] ?? 'text-white/70'
                  const bonuses = item.bonuses as Record<string, number> | undefined
                  const bonusText = bonuses
                    ? Object.entries(bonuses).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' · ')
                    : ''
                  const enh = typeof item.enhancement === 'number' && item.enhancement > 0
                    ? ` +${item.enhancement}`
                    : ''
                  return (
                    <div key={slot} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-white/10 bg-black/25">
                      <span className="w-7 h-7 shrink-0 flex items-center justify-center overflow-hidden">
                        {ITEM_BY_ID[String(item.id ?? '')]?.sprite
                          ? <img src={ITEM_BY_ID[String(item.id ?? '')]!.sprite} alt={String(item.name ?? '')} className="w-6 h-6 object-contain" />
                          : <span className="text-base">{String(item.icon ?? '⚔️')}</span>
                        }
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${colorClass}`}>
                          {String(item.name ?? '')}{enh}
                        </p>
                        <p className="text-white/30 text-[10px] truncate">{bonusText}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Campaign stats */}
            <div className="mx-4 mb-3 bg-black/25 rounded-xl p-3 border border-white/5">
              <p className="text-amber-100/40 text-[10px] uppercase font-bold tracking-widest mb-2">Campanha</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-black/30 rounded-lg px-2.5 py-2">
                  <p className="text-amber-100 font-bold text-sm">{profile.totalKills.toLocaleString()}</p>
                  <p className="text-amber-100/40 text-[10px]">Abates</p>
                </div>
                <div className="bg-black/30 rounded-lg px-2.5 py-2">
                  <p className="text-amber-100 font-bold text-sm">{profile.gold.toLocaleString()}</p>
                  <p className="text-amber-100/40 text-[10px]">Ouro</p>
                </div>
                <div className="bg-black/30 rounded-lg px-2.5 py-2 col-span-2">
                  <p className="text-amber-100 font-bold text-xs truncate">{zoneName(profile.currentZone)}</p>
                  <p className="text-amber-100/40 text-[10px]">Zona atual</p>
                </div>
              </div>
            </div>

            {/* Send mail button */}
            {onSendMail && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => { onSendMail(profile.name, profile.class, profile.level); onClose() }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-800/60 hover:bg-amber-700/80 text-amber-100 transition-colors"
                >
                  ✉️ Enviar Mensagem
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
