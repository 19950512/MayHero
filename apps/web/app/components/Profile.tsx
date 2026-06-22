'use client'

import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import { CLASS_ICONS } from '../game/data'
import { normalizeSkillAllocationsForLevel } from '../game/engine'

const CLASS_DISPLAY: Record<string, string> = {
  warrior: 'Guerreiro',
  archer:  'Arqueiro',
  mage:    'Sorcerer',
  knight:  'Knight',
  paladin: 'Paladin',
  druid:   'Druid',
}

export function Profile() {
  const { hero, renameHero } = useGameStore()
  const { user } = useAuthStore()

  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!hero) return null

  const alloc = normalizeSkillAllocationsForLevel(hero)
  const allocatedPoints = alloc.atk + alloc.def + alloc.maxHp + alloc.spd
  const availableSkillPoints = Math.max(0, (hero.level - 1) - allocatedPoints)

  const startEdit = () => {
    setNameInput(hero.name)
    setEditing(true)
    setStatus('idle')
    setErrorMsg('')
  }

  const cancelEdit = () => {
    setEditing(false)
    setStatus('idle')
  }

  const saveRename = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === hero.name) { cancelEdit(); return }
    if (trimmed.length > 20) { setErrorMsg('Nome deve ter no máximo 20 caracteres.'); return }

    setStatus('saving')
    setErrorMsg('')

    // Update local state immediately
    renameHero(trimmed)

    // Persist to backend if authenticated
    if (user) {
      try {
        await api.hero.rename(trimmed)
        setStatus('ok')
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : 'Erro ao renomear.')
        setStatus('error')
        // Revert local rename on failure
        renameHero(hero.name)
        return
      }
    }

    setEditing(false)
    setTimeout(() => setStatus('idle'), 2500)
  }

  const sigil = CLASS_ICONS[hero.class] ?? hero.class.slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Hero card */}
      <div className="bg-gradient-to-b from-[#22170f] to-[#130f0a] rounded-xl p-4 border border-amber-700/40 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-amber-200/30 bg-amber-900/30 flex items-center justify-center text-sm font-bold tracking-widest text-amber-50 shrink-0">
          {sigil}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-amber-100 font-bold text-lg tracking-wide truncate">{hero.name}</p>
          <p className="text-amber-100/55 text-xs">{CLASS_DISPLAY[hero.class] ?? hero.class} — Nível {hero.level}</p>
          {user && (
            <p className="text-amber-100/35 text-xs mt-0.5">@{user.username}</p>
          )}
        </div>
      </div>

      {/* Rename section */}
      <div className="bg-[#1a130d]/70 rounded-xl p-4 border border-amber-100/15">
        <h3 className="text-amber-100/70 text-xs font-bold uppercase tracking-wide mb-3">Renomear Herói</h3>

        {!editing ? (
          <div className="flex items-center justify-between">
            <p className="text-amber-100 text-sm">{hero.name}</p>
            <button
              onClick={startEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-800 hover:bg-amber-700 text-amber-50 transition-colors"
            >
              Renomear
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {errorMsg && (
              <p className="text-red-300 text-xs">{errorMsg}</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setErrorMsg('') }}
                maxLength={20}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') saveRename()
                  if (e.key === 'Escape') cancelEdit()
                }}
                className="flex-1 bg-[#19120d] border border-amber-100/20 rounded-lg px-3 py-2 text-sm text-amber-50 placeholder-amber-100/20 outline-none focus:border-amber-500/60 transition-colors"
              />
              <button
                onClick={saveRename}
                disabled={status === 'saving'}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-amber-50 transition-colors"
              >
                {status === 'saving' ? '...' : 'Salvar'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={status === 'saving'}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-stone-700 hover:bg-stone-600 disabled:opacity-40 text-amber-100/70 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {status === 'ok' && (
          <p className="text-emerald-300 text-xs mt-2">Nome atualizado com sucesso.</p>
        )}

        {!user && (
          <p className="text-amber-100/35 text-xs mt-2">
            Conecte-se para que a alteração seja salva na sua conta.
          </p>
        )}
      </div>

      {/* Stats summary */}
      <div className="bg-[#1a130d]/70 rounded-xl p-4 border border-amber-100/15">
        <h3 className="text-amber-100/70 text-xs font-bold uppercase tracking-wide mb-3">Resumo de Campanha</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/25 rounded-lg p-2.5">
            <p className="text-amber-100 font-bold">{hero.totalKills}</p>
            <p className="text-amber-100/45 text-xs">Abates totais</p>
          </div>
          <div className="bg-black/25 rounded-lg p-2.5">
            <p className="text-amber-100 font-bold">{hero.gold}</p>
            <p className="text-amber-100/45 text-xs">Ouro acumulado</p>
          </div>
          <div className="bg-black/25 rounded-lg p-2.5">
            <p className="text-amber-100 font-bold">{hero.xp} / {hero.xpToNext}</p>
            <p className="text-amber-100/45 text-xs">Experiência</p>
          </div>
          <div className="bg-black/25 rounded-lg p-2.5">
            <p className="text-amber-100 font-bold">{availableSkillPoints}</p>
            <p className="text-amber-100/45 text-xs">Pontos disponíveis</p>
          </div>
        </div>
      </div>
    </div>
  )
}
