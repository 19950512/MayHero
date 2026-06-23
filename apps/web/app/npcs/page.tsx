'use client'

import Link from 'next/link'
import { NPC_CATALOG } from '../game/npcs'
import { PageHeader } from '../components/PageHeader'

export default function NpcsPage() {
  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,#3b2818_0%,#1d150f_35%,#100d08_70%,#090806_100%)] text-[var(--ink)]">
      <PageHeader />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🧙</div>
          <h1 className="text-3xl font-bold tracking-[0.08em] text-amber-100">Personagens</h1>
          <p className="text-amber-100/55 mt-1">Comerciantes e figuras do mundo de May Hero</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {NPC_CATALOG.map(npc => (
            <Link
              key={npc.id}
              href={`/npcs/${npc.id}`}
              className="group bg-[#18120d] border border-amber-900/30 hover:border-amber-700/60 rounded-xl p-5 flex items-center gap-4 transition-all hover:bg-[#201810]"
            >
              {npc.sprite
                ? <img src={npc.sprite} alt={npc.name} className="w-14 h-14 object-contain shrink-0 rounded-lg" />
                : <span className="text-5xl shrink-0">{npc.image}</span>
              }
              <div className="min-w-0">
                <p className="text-amber-100 font-bold text-base group-hover:text-amber-50 transition-colors">
                  {npc.name}
                </p>
                <p className="text-amber-100/45 text-xs mt-1 leading-snug line-clamp-2">
                  {npc.lore}
                </p>
                <div className="flex gap-3 mt-2 text-[10px] text-amber-100/35">
                  <span>🛒 {npc.sells.length} itens à venda</span>
                  <span>💰 compra {npc.buys.length} tipo(s)</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
