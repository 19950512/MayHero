'use client'

import React from 'react'
import { getItemDisplayName, enhanceBonusPerLevel } from '../game/enhancement'
import { ITEM_BY_ID } from '../game/data'
import type { Equipment } from '../game/types'

const RARITY_COLORS: Record<Equipment['rarity'], string> = {
  common: 'text-stone-300',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

const RARITY_BORDER: Record<Equipment['rarity'], string> = {
  common: 'border-stone-500/30',
  rare: 'border-blue-500/40',
  epic: 'border-purple-500/40',
  legendary: 'border-amber-500/50',
}

const RARITY_LABEL: Record<Equipment['rarity'], string> = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
}

const SLOT_LABELS: Record<Equipment['slot'], string> = {
  weapon: 'Arma',
  armor: 'Armadura',
  helm: 'Elmo',
  ring: 'Anel',
}

interface ItemDetailModalProps {
  item: Equipment
  onClose: () => void
  onEquip?: () => void
  canEquip?: boolean
  onUnequip?: () => void
  onForge?: () => void
  onSell?: () => void
  onSend?: () => void
  sendLabel?: string
  sellPanel?: React.ReactNode
}

export function ItemDetailModal({ item, onClose, onEquip, canEquip, onUnequip, onForge, onSell, onSend, sendLabel, sellPanel }: ItemDetailModalProps) {
  const enhancement = item.enhancement ?? 0
  const bonusEntries = Object.entries(item.bonuses ?? {})

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={`relative bg-[#1a130e] rounded-2xl border ${RARITY_BORDER[item.rarity]} p-5 w-full max-w-xs shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/30 hover:text-white/70 text-lg leading-none"
        >
          ✕
        </button>

        {/* Icon + name */}
        <div className="flex flex-col items-center text-center mb-4">
          {ITEM_BY_ID[item.id]?.sprite
            ? <img src={ITEM_BY_ID[item.id]!.sprite} alt={item.name} className="w-20 h-20 object-contain mb-2 drop-shadow-lg" />
            : <span className="text-5xl mb-2">{item.icon}</span>
          }
          <p className={`font-bold text-base ${RARITY_COLORS[item.rarity]}`}>
            {getItemDisplayName(item)}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
            <span>{SLOT_LABELS[item.slot]}</span>
            <span>•</span>
            <span className={RARITY_COLORS[item.rarity]}>{RARITY_LABEL[item.rarity]}</span>
            {item.requiredLevel > 1 && (
              <>
                <span>•</span>
                <span>Nível {item.requiredLevel}+</span>
              </>
            )}
          </div>
        </div>

        {/* Enhancement bar */}
        {enhancement > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/40">Aprimoramento</span>
              <span className={`font-bold ${enhancement >= 15 ? 'text-red-400' : enhancement >= 8 ? 'text-amber-400' : 'text-green-400'}`}>
                +{enhancement} / +20
              </span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${enhancement <= 7 ? 'bg-green-500' : enhancement <= 14 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${(enhancement / 20) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Bonuses */}
        <div className="bg-black/30 rounded-xl p-3 mb-4">
          <p className="text-white/35 text-xs uppercase font-bold mb-2">Atributos</p>
          {bonusEntries.length === 0 ? (
            <p className="text-white/25 text-xs">Nenhum bônus</p>
          ) : (
            <div className="space-y-1.5">
              {bonusEntries.map(([stat, val]) => {
                const base = val as number
                const perLvl = enhanceBonusPerLevel(base)
                const totalEnhBonus = perLvl * enhancement
                const effective = base + totalEnhBonus
                return (
                  <div key={stat} className="flex items-center justify-between text-xs gap-2">
                    <span className="text-white/50 uppercase w-14 shrink-0">{stat}</span>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <span className="text-white/60">+{base}</span>
                      {enhancement > 0 && (
                        <>
                          <span className="text-white/30">+</span>
                          <span className="text-amber-400">({perLvl}/nível × {enhancement})</span>
                          <span className="text-white/30">=</span>
                          <span className="text-green-400 font-bold">+{effective}</span>
                        </>
                      )}
                      {enhancement === 0 && (
                        <span className="text-green-400 font-bold">+{base}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {enhancement === 0 && (
            <p className="text-white/25 text-[10px] mt-2">Aprimore este item na Forja para aumentar os atributos.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {onEquip !== undefined && (
            <button
              onClick={() => { onEquip(); onClose() }}
              disabled={!canEquip}
              className="w-full py-2 rounded-xl text-sm font-bold bg-indigo-700 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              {canEquip ? 'Equipar' : `Requer Nível ${item.requiredLevel}`}
            </button>
          )}
          {onForge !== undefined && (
            <button
              onClick={() => { onForge(); onClose() }}
              className="w-full py-2 rounded-xl text-sm font-bold bg-amber-800 hover:bg-amber-700 text-amber-50 transition-colors"
            >
              Aprimorar na Forja
            </button>
          )}
          {onUnequip !== undefined && (
            <button
              onClick={() => { onUnequip(); onClose() }}
              className="w-full py-2 rounded-xl text-sm font-bold bg-stone-700 hover:bg-stone-600 text-white/80 transition-colors"
            >
              Desequipar
            </button>
          )}
          {(onSell !== undefined || onSend !== undefined) && (
            <div className="flex gap-2 pt-1 border-t border-white/5">
              {onSell !== undefined && (
                <button
                  onClick={onSell}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-yellow-400 transition-colors"
                >
                  Vender
                </button>
              )}
              {onSend !== undefined && (
                <button
                  onClick={onSend}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-sky-400 transition-colors"
                >
                  {sendLabel ?? 'Enviar'}
                </button>
              )}
            </div>
          )}
          {sellPanel && <div className="pt-1 border-t border-white/5">{sellPanel}</div>}
        </div>
      </div>
    </div>
  )
}
