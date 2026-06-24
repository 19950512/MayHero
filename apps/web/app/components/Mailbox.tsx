'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { MailMessage } from '../lib/api'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { RARITY_COLORS, ITEM_BY_ID } from '../game/data'
import { ComposeMailModal } from './ComposeMailModal'
import { HeroProfileModal } from './HeroProfileModal'
import { ItemDetailModal } from './ItemDetailModal'
import type { Equipment } from '../game/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

export function Mailbox() {
  const { hydrateHeroFromServer } = useGameStore()
  const { user } = useAuthStore()
  const [mails, setMails] = useState<MailMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composePreRecipient, setComposePreRecipient] = useState<{ name: string; class: string; level: number } | undefined>(undefined)
  const [viewingHero, setViewingHero] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<Equipment | null>(null)

  const toEquipment = (data: Record<string, unknown>): Equipment | null => {
    if (!data.id || typeof data.id !== 'string') return null
    const slot = data.slot as string
    const rarity = data.rarity as string
    if (!['weapon', 'armor', 'helm', 'ring'].includes(slot)) return null
    if (!['common', 'rare', 'epic', 'legendary'].includes(rarity)) return null
    return {
      id: data.id,
      name: (data.name as string) ?? '',
      slot: slot as Equipment['slot'],
      rarity: rarity as Equipment['rarity'],
      bonuses: (data.bonuses as Equipment['bonuses']) ?? {},
      icon: (data.icon as string) ?? '⚔️',
      requiredLevel: (data.requiredLevel as number) ?? 1,
      enhancement: data.enhancement as number | undefined,
    }
  }

  const loadMails = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api.mail.inbox()
      setMails(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadMails() }, [loadMails])

  const handleExpand = async (mail: MailMessage) => {
    if (expanded === mail.id) {
      setExpanded(null)
      return
    }
    setExpanded(mail.id)
    if (!mail.read) {
      try {
        await api.mail.markRead(mail.id)
        setMails(prev => prev.map(m => m.id === mail.id ? { ...m, read: true } : m))
      } catch {}
    }
  }

  const handleClaim = async (mail: MailMessage) => {
    setClaimingId(mail.id)
    setError(null)
    try {
      const result = await api.mail.claim(mail.id)
      setMails(prev => prev.map(m => m.id === mail.id
        ? { ...m, claimed: true, gold: 0, attachments: m.attachments.map(a => ({ ...a, claimed: true })) }
        : m
      ))
      // Refresh hero stats from server to reflect new gold/items
      if (result.goldClaimed > 0 || result.itemsClaimed > 0) {
        api.hero.get().then(hydrateHeroFromServer).catch(() => undefined)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao coletar.')
    } finally {
      setClaimingId(null)
    }
  }

  const handleDelete = async (mail: MailMessage) => {
    setDeletingId(mail.id)
    setError(null)
    try {
      await api.mail.delete(mail.id)
      setMails(prev => prev.filter(m => m.id !== mail.id))
      if (expanded === mail.id) setExpanded(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao deletar.')
    } finally {
      setDeletingId(null)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/30 text-sm text-center">Faça login para acessar suas mensagens.</p>
      </div>
    )
  }

  const unread = mails.filter(m => !m.read).length

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}
      {composeOpen && (
        <ComposeMailModal
          preRecipient={composePreRecipient}
          onClose={() => { setComposeOpen(false); setComposePreRecipient(undefined) }}
          onSent={() => { setComposeOpen(false); setComposePreRecipient(undefined); loadMails() }}
        />
      )}
      {viewingHero && (
        <HeroProfileModal
          heroName={viewingHero}
          onClose={() => setViewingHero(null)}
          onSendMail={(name, heroClass, level) => {
            setViewingHero(null)
            setComposePreRecipient({ name, class: heroClass, level })
            setComposeOpen(true)
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-white/40 text-xs uppercase font-bold">Mensagens</p>
          {unread > 0 && (
            <span className="bg-amber-600 text-amber-50 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setComposeOpen(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-800/60 hover:bg-amber-700/80 text-amber-100 transition-colors"
          >
            ✉️ Compor
          </button>
          <button
            onClick={loadMails}
            disabled={loading}
            className="text-amber-100/40 hover:text-amber-100/70 text-xs transition-colors"
          >
            {loading ? 'Carregando...' : '↻'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-300 text-xs bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
      )}

      {!loading && mails.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-white/20 text-sm text-center">Nenhuma mensagem.<br />Quando alguém transferir itens, aparecerão aqui.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {mails.map(mail => {
          const hasUnclaimed = (!mail.claimed && mail.gold > 0) || mail.attachments.some(a => !a.claimed)
          const isExpanded = expanded === mail.id

          return (
            <div
              key={mail.id}
              className={`rounded-xl border overflow-hidden transition-colors ${
                !mail.read ? 'border-amber-600/40 bg-amber-900/10' : 'border-white/10 bg-black/20'
              }`}
            >
              {/* Header row */}
              <button
                className="w-full text-left px-3 py-2.5 flex items-center gap-2.5"
                onClick={() => handleExpand(mail)}
              >
                <span className="text-base shrink-0">{hasUnclaimed ? '📬' : '📭'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-xs font-bold truncate ${!mail.read ? 'text-amber-100' : 'text-white/70'}`}>
                      {mail.subject}
                    </p>
                    {hasUnclaimed && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-700/60 text-amber-200 font-bold">
                        Coletar
                      </span>
                    )}
                  </div>
                  <p className="text-white/30 text-[10px]">
                    {mail.fromHero ? (
                      <button
                        className="text-amber-300/60 hover:text-amber-300 underline underline-offset-2 transition-colors"
                        onClick={e => { e.stopPropagation(); setViewingHero(mail.fromHero!.name) }}
                      >
                        {mail.fromHero.name}
                      </button>
                    ) : 'Sistema'}
                    {' '}· {timeAgo(mail.createdAt)}
                  </p>
                </div>
                <span className="text-white/30 text-xs shrink-0">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-white/5 pt-2.5 flex flex-col gap-2.5">
                  {mail.message && (
                    <p className="text-white/60 text-xs leading-relaxed">{mail.message}</p>
                  )}

                  {/* Gold attachment */}
                  {!mail.claimed && mail.gold > 0 && (
                    <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-700/30 rounded-lg px-2.5 py-1.5">
                      <span className="text-amber-300 text-sm">💰</span>
                      <span className="text-amber-200 text-xs font-bold">{mail.gold} ouro</span>
                      {mail.claimed && <span className="text-amber-100/30 text-xs ml-auto">Coletado</span>}
                    </div>
                  )}

                  {/* Item attachments */}
                  {mail.attachments.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {mail.attachments.map(att => {
                        const d = att.itemData as Record<string, unknown>
                        const rarity = (d.rarity as string) ?? 'common'
                        const colorClass = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] ?? 'text-white/70'
                        const sprite = ITEM_BY_ID[(d.id as string) ?? '']?.sprite
                        const eq = toEquipment(d)
                        return (
                          <div
                            key={att.id}
                            className={`flex items-center gap-2 bg-black/30 border rounded-lg px-2.5 py-1.5 ${
                              att.claimed ? 'border-white/5 opacity-50' : 'border-white/15'
                            }`}
                          >
                            <button
                              onClick={() => eq && setDetailItem(eq)}
                              disabled={!eq}
                              className="shrink-0 w-10 h-10 rounded-md bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden hover:border-amber-500/40 disabled:cursor-default transition-colors"
                              title={eq ? 'Ver detalhes' : undefined}
                            >
                              {sprite
                                ? <img src={sprite} alt={(d.name as string) ?? 'Item'} className="w-full h-full object-contain p-0.5" />
                                : <span className="text-xl">{(d.icon as string) ?? '⚔️'}</span>
                              }
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold ${colorClass}`}>{(d.name as string) ?? 'Item'}</p>
                              <p className="text-white/30 text-[10px] capitalize">{(d.slot as string) ?? ''}</p>
                            </div>
                            {att.claimed && <span className="text-white/30 text-[10px]">Coletado</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {hasUnclaimed && (
                      <button
                        onClick={() => handleClaim(mail)}
                        disabled={claimingId === mail.id}
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-amber-50 transition-colors"
                      >
                        {claimingId === mail.id ? 'Coletando...' : '✦ Coletar tudo'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(mail)}
                      disabled={deletingId === mail.id || hasUnclaimed}
                      title={hasUnclaimed ? 'Colete os itens antes de deletar' : 'Deletar mensagem'}
                      className="px-3 py-2 rounded-lg text-xs text-red-400/60 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingId === mail.id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
