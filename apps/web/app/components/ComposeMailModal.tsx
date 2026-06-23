'use client'

import { useState, useCallback, useEffect } from 'react'
import { api, HeroSearchResult } from '../lib/api'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { RARITY_COLORS } from '../game/data'
import { getItemDisplayName } from '../game/enhancement'
import { HeroProfileModal } from './HeroProfileModal'
import type { Equipment } from '../game/types'

const TRANSFER_COST_PER_SEND = 500

interface Props {
  preAttached?: Equipment
  preRecipient?: { name: string; class: string; level: number }
  onClose: () => void
  onSent: () => void
}

export function ComposeMailModal({ preAttached, preRecipient, onClose, onSent }: Props) {
  const { hero, inventory, replaceInventory } = useGameStore()
  const { user } = useAuthStore()

  // Recipient search
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<HeroSearchResult[]>([])
  const [recipient, setRecipient] = useState<HeroSearchResult | null>(
    preRecipient ? { id: preRecipient.name, name: preRecipient.name, class: preRecipient.class, level: preRecipient.level } : null
  )

  // Compose fields
  const [subject, setSubject] = useState(preAttached ? `Transferindo: ${getItemDisplayName(preAttached)}` : '')
  const [body, setBody] = useState('')
  const [gold, setGold] = useState(0)

  // Item attachments — keyed by inventory index to handle duplicates
  const [attachedIdxs, setAttachedIdxs] = useState<Set<number>>(
    () => {
      if (!preAttached) return new Set()
      const idx = inventory.findIndex(i =>
        i.id === preAttached.id && i.slot === preAttached.slot && i.rarity === preAttached.rarity
      )
      return idx >= 0 ? new Set([idx]) : new Set()
    }
  )
  const [dbItemIds, setDbItemIds] = useState<Record<number, string>>({})
  const [loadingDbIds, setLoadingDbIds] = useState(false)

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [previewHero, setPreviewHero] = useState<HeroSearchResult | null>(null)

  // Fetch DB inventory item IDs so we can attach them
  useEffect(() => {
    if (!user || attachedIdxs.size === 0) return
    setLoadingDbIds(true)
    api.hero.inventory()
      .then(dbItems => {
        const mapping: Record<number, string> = {}
        for (const idx of attachedIdxs) {
          const item = inventory[idx]
          if (!item) continue
          const match = dbItems.find(di =>
            di.itemData.id === item.id &&
            di.itemData.slot === item.slot &&
            di.itemData.rarity === item.rarity
          )
          if (match) mapping[idx] = match.id
        }
        setDbItemIds(mapping)
      })
      .catch(() => undefined)
      .finally(() => setLoadingDbIds(false))
  }, [user, attachedIdxs, inventory])

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (q.length < 2) return
    setSearching(true)
    setError(null)
    try {
      const results = await api.hero.search(q)
      setSearchResults(results)
      if (results.length === 0) setError('Nenhum herói encontrado.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro na busca.')
    } finally {
      setSearching(false)
    }
  }, [query])

  const toggleItem = (idx: number) => {
    setAttachedIdxs(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const hasItems = attachedIdxs.size > 0
  const hasFee = hasItems || gold > 0
  const transferFee = hasFee ? TRANSFER_COST_PER_SEND : 0
  const totalCost = gold + transferFee

  const handleSend = async () => {
    if (!recipient || !user) return
    if (!subject.trim()) { setError('Preencha o assunto.'); return }
    if ((hero?.gold ?? 0) < totalCost) {
      setError(`Ouro insuficiente. Custo total: ${totalCost} (${gold} enviado + ${transferFee} taxa).`)
      return
    }

    // Collect resolved DB item IDs
    const inventoryItemIds = [...attachedIdxs]
      .map(idx => dbItemIds[idx])
      .filter(Boolean)

    if (hasItems && inventoryItemIds.length !== attachedIdxs.size) {
      setError('Não foi possível localizar todos os itens no servidor. Tente novamente.')
      return
    }

    setSending(true)
    setError(null)
    try {
      await api.mail.send({
        targetHeroName: recipient.name,
        subject: subject.trim(),
        message: body.trim(),
        gold: gold > 0 ? gold : undefined,
        inventoryItemIds: inventoryItemIds.length > 0 ? inventoryItemIds : undefined,
      })
      setSuccess(true)

      // Refresh local inventory if items were sent
      if (hasItems) {
        api.hero.inventory()
          .then(dbItems => {
            const items = dbItems.map(db => {
              const raw = db.itemData
              if (
                typeof raw.id !== 'string' || typeof raw.name !== 'string' ||
                typeof raw.slot !== 'string' || typeof raw.rarity !== 'string' ||
                typeof raw.icon !== 'string' || typeof raw.requiredLevel !== 'number' ||
                !raw.bonuses || typeof raw.bonuses !== 'object'
              ) return null
              if (!['weapon', 'armor', 'helm', 'ring'].includes(raw.slot as string)) return null
              return raw as unknown as Equipment
            }).filter((i): i is Equipment => !!i)
            replaceInventory(items)
          })
          .catch(() => undefined)
      }

      setTimeout(onSent, 1400)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar.')
    } finally {
      setSending(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="bg-[#1a140f] border border-emerald-500/40 rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-4xl mb-3">✉️</p>
          <p className="text-emerald-300 text-lg font-bold mb-1">Mensagem enviada!</p>
          <p className="text-amber-100/50 text-sm">{recipient?.name} receberá na caixa de entrada.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <div
        className="bg-[#1a140f] border border-amber-900/40 rounded-2xl w-full max-w-md flex flex-col gap-3 max-h-[92dvh] overflow-y-auto relative"
        style={{ padding: '1.25rem' }}
        onClick={e => e.stopPropagation()}
      >
        {previewHero && (
          <HeroProfileModal
            heroName={previewHero.name}
            onClose={() => setPreviewHero(null)}
            onSendMail={(name, heroClass, level) => {
              setPreviewHero(null)
              setRecipient({ id: previewHero.id, name, class: heroClass, level })
              setSearchResults([])
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-amber-100 font-bold text-sm tracking-wide">✉️ Nova Mensagem</h2>
          <button onClick={onClose} className="text-amber-100/40 hover:text-amber-100 text-xl leading-none">×</button>
        </div>

        {/* --- Recipient --- */}
        <div>
          <label className="text-amber-100/50 text-[10px] uppercase font-bold mb-1 block tracking-widest">Para</label>
          {recipient ? (
            <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-500/30 rounded-xl px-3 py-2">
              <div>
                <span className="text-emerald-200 text-xs font-bold">{recipient.name}</span>
                <span className="text-white/35 text-xs ml-2 capitalize">{recipient.class} · Nível {recipient.level}</span>
              </div>
              <button onClick={() => { setRecipient(null); setSearchResults([]) }} className="text-emerald-400/60 hover:text-emerald-300 text-xs ml-2">✕</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSearchResults([]) }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Nome do herói destinatário..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-amber-500/50"
              />
              <button
                onClick={handleSearch}
                disabled={searching || query.trim().length < 2}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-50 transition-colors shrink-0"
              >
                {searching ? '...' : 'Buscar'}
              </button>
            </div>
          )}

          {searchResults.length > 0 && !recipient && (
            <div className="mt-1.5 flex flex-col gap-1 max-h-32 overflow-y-auto">
              {searchResults.map(h => (
                <div key={h.id} className="flex gap-1">
                  <button
                    onClick={() => { setRecipient(h); setSearchResults([]) }}
                    className="flex-1 text-left px-3 py-2 rounded-xl bg-black/30 border border-white/10 hover:border-amber-500/40 text-xs text-white/80 transition-colors"
                  >
                    <span className="text-amber-200 font-bold">{h.name}</span>
                    <span className="text-white/35 ml-2 capitalize">{h.class} · Nível {h.level}</span>
                  </button>
                  <button
                    onClick={() => setPreviewHero(h)}
                    className="shrink-0 w-8 rounded-xl bg-black/30 border border-white/10 hover:border-amber-500/40 text-white/40 hover:text-amber-300 text-xs transition-colors"
                    title="Ver perfil"
                  >
                    👤
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Subject --- */}
        <div>
          <label className="text-amber-100/50 text-[10px] uppercase font-bold mb-1 block tracking-widest">Assunto</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            maxLength={60}
            placeholder="Assunto da mensagem..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-amber-500/50"
          />
        </div>

        {/* --- Body --- */}
        <div>
          <label className="text-amber-100/50 text-[10px] uppercase font-bold mb-1 block tracking-widest">Mensagem</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Escreva sua mensagem aqui..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        {/* --- Gold --- */}
        <div>
          <label className="text-amber-100/50 text-[10px] uppercase font-bold mb-1 block tracking-widest">Ouro anexo</label>
          <div className="flex items-center gap-2">
            <span className="text-amber-300 text-sm">💰</span>
            <input
              type="number"
              min={0}
              max={hero?.gold ?? 0}
              value={gold || ''}
              onChange={e => setGold(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="0"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-amber-500/50"
            />
            {hero && <span className="text-amber-100/30 text-xs shrink-0">Você tem {hero.gold}</span>}
          </div>
        </div>

        {/* --- Item attachments --- */}
        <div>
          <label className="text-amber-100/50 text-[10px] uppercase font-bold mb-1.5 block tracking-widest">
            Itens anexados ({attachedIdxs.size})
          </label>

          {inventory.length === 0 ? (
            <p className="text-white/25 text-xs text-center py-3">Nenhum item no inventário.</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-1.5">
              {inventory.map((item, idx) => {
                const attached = attachedIdxs.has(idx)
                const enhancement = item.enhancement ?? 0
                return (
                  <button
                    key={`${item.id}-${idx}`}
                    onClick={() => toggleItem(idx)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      attached
                        ? 'bg-emerald-900/30 border border-emerald-500/40'
                        : 'bg-black/20 border border-white/5 hover:border-white/15'
                    }`}
                  >
                    <span className={`text-base shrink-0 w-7 text-center transition-all ${attached ? 'scale-110' : ''}`}>
                      {attached ? '✓' : item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${RARITY_COLORS[item.rarity]}`}>
                        {getItemDisplayName(item)}
                        {enhancement > 0 && <span className="text-green-400 ml-1">+{enhancement}</span>}
                      </p>
                      <p className="text-white/30 text-[10px] capitalize">{item.slot}</p>
                    </div>
                    {attached && <span className="text-emerald-400 text-xs shrink-0">✓</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* --- Fee summary --- */}
        {(hasFee) && (
          <div className="bg-amber-900/15 border border-amber-700/25 rounded-xl px-3 py-2 text-xs">
            <div className="flex justify-between text-amber-100/50">
              <span>Ouro a enviar</span>
              <span className="text-amber-300">{gold} ouro</span>
            </div>
            {hasItems && (
              <div className="flex justify-between text-amber-100/50 mt-0.5">
                <span>Taxa de transferência ({attachedIdxs.size} {attachedIdxs.size === 1 ? 'item' : 'itens'})</span>
                <span className="text-amber-300">{TRANSFER_COST_PER_SEND} ouro</span>
              </div>
            )}
            <div className="flex justify-between text-amber-200 font-bold mt-1 pt-1 border-t border-amber-700/20">
              <span>Total debitado de você</span>
              <span>{totalCost} ouro</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-300 text-xs bg-red-900/20 border border-red-700/30 rounded-xl px-3 py-2">{error}</p>
        )}

        {/* --- Send button --- */}
        <button
          onClick={handleSend}
          disabled={!recipient || sending || loadingDbIds || !subject.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-amber-50 transition-all shrink-0"
        >
          {sending ? 'Enviando...' : loadingDbIds ? 'Carregando itens...' : '✉️ Enviar Mensagem'}
        </button>
      </div>
    </div>
  )
}
