'use client'

import { useState, useCallback } from 'react'
import { api, HeroSearchResult } from '../lib/api'
import { useGameStore } from '../store/gameStore'
import { RARITY_COLORS } from '../game/data'
import { getItemDisplayName } from '../game/enhancement'
import type { Equipment } from '../game/types'

const TRANSFER_COST = 500

interface Props {
  item: Equipment
  inventoryItemId: string | null
  onClose: () => void
  onTransferred: () => void
}

export function TransferItemModal({ item, inventoryItemId, onClose, onTransferred }: Props) {
  const { hero } = useGameStore()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<HeroSearchResult[]>([])
  const [selectedHero, setSelectedHero] = useState<HeroSearchResult | null>(null)
  const [subject, setSubject] = useState(`Transferência: ${getItemDisplayName(item)}`)
  const [message, setMessage] = useState('')
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    setError(null)
    try {
      const results = await api.hero.search(query.trim())
      setSearchResults(results)
      if (results.length === 0) setError('Nenhum herói encontrado com esse nome.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar.')
    } finally {
      setSearching(false)
    }
  }, [query])

  const handleSend = async () => {
    if (!selectedHero || !inventoryItemId || !hero) return
    if ((hero.gold ?? 0) < TRANSFER_COST) {
      setError(`Ouro insuficiente. Custo de transferência: ${TRANSFER_COST} ouro.`)
      return
    }
    setSending(true)
    setError(null)
    try {
      await api.mail.send({
        targetHeroName: selectedHero.name,
        subject: subject.trim() || `Transferência: ${getItemDisplayName(item)}`,
        message: message.trim(),
        inventoryItemIds: [inventoryItemId],
      })
      setSuccess(true)
      setTimeout(onTransferred, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao transferir.')
    } finally {
      setSending(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="bg-[#1a140f] border border-emerald-500/40 rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-emerald-300 text-lg font-bold mb-1">✓ Item enviado!</p>
          <p className="text-amber-100/60 text-sm">{selectedHero?.name} receberá o item na caixa de mensagens.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-[#1a140f] border border-amber-900/40 rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-amber-100 font-bold text-base">Transferir Item</h2>
          <button onClick={onClose} className="text-amber-100/40 hover:text-amber-100 text-xl leading-none">×</button>
        </div>

        {/* Item preview */}
        <div className="bg-black/30 border border-white/10 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">{item.icon}</span>
          <div>
            <p className={`text-sm font-bold ${RARITY_COLORS[item.rarity]}`}>{getItemDisplayName(item)}</p>
            <p className="text-white/40 text-xs capitalize">{item.slot} · {item.rarity}</p>
          </div>
        </div>

        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-2.5 text-amber-200/80 text-xs text-center">
          Custo de transferência: <strong className="text-amber-300">{TRANSFER_COST} ouro</strong>
          {hero && <span className="ml-2 text-amber-100/40">(você tem {hero.gold})</span>}
        </div>

        {/* Hero search */}
        <div>
          <label className="text-amber-100/60 text-xs uppercase font-bold mb-1.5 block tracking-wide">Buscar destinatário</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchResults([]); setSelectedHero(null) }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Nome do herói..."
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleSearch}
              disabled={searching || query.trim().length < 2}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-50 transition-colors"
            >
              {searching ? '...' : 'Buscar'}
            </button>
          </div>

          {searchResults.length > 0 && !selectedHero && (
            <div className="mt-2 flex flex-col gap-1">
              {searchResults.map(h => (
                <button
                  key={h.id}
                  onClick={() => { setSelectedHero(h); setSearchResults([]) }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-black/30 border border-white/10 hover:border-amber-500/40 text-xs text-white/80 transition-colors"
                >
                  <span className="text-amber-200 font-bold">{h.name}</span>
                  <span className="text-white/40 ml-2">{h.class} · Nível {h.level}</span>
                </button>
              ))}
            </div>
          )}

          {selectedHero && (
            <div className="mt-2 flex items-center justify-between bg-emerald-900/20 border border-emerald-500/30 rounded-lg px-3 py-2">
              <span className="text-emerald-200 text-xs">
                <strong>{selectedHero.name}</strong> · {selectedHero.class} · Nível {selectedHero.level}
              </span>
              <button onClick={() => setSelectedHero(null)} className="text-emerald-400/60 hover:text-emerald-300 text-xs">✕</button>
            </div>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="text-amber-100/60 text-xs uppercase font-bold mb-1.5 block tracking-wide">Assunto</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            maxLength={60}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-amber-100/60 text-xs uppercase font-bold mb-1.5 block tracking-wide">Mensagem (opcional)</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Escreva uma mensagem..."
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        {error && (
          <p className="text-red-300 text-xs text-center bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSend}
          disabled={!selectedHero || !inventoryItemId || sending}
          className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-amber-50 transition-all"
        >
          {sending ? 'Enviando...' : `Transferir por ${TRANSFER_COST} ouro`}
        </button>
      </div>
    </div>
  )
}
