'use client'

import Link from 'next/link'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'

type Tab = 'battle' | 'stats' | 'inventory' | 'zones' | 'profile' | 'mail' | 'menu'

interface MenuItemDef {
  icon: string
  label: string
  description: string
  action: { type: 'tab'; tab: Tab } | { type: 'link'; href: string } | { type: 'danger'; fn: () => void }
}

interface MenuGroup {
  title: string
  items: MenuItemDef[]
}

interface Props {
  onNavigate: (tab: Tab) => void
}

export function MenuScreen({ onNavigate }: Props) {
  const { hero, resetGame } = useGameStore()
  const { user } = useAuthStore()

  const groups: MenuGroup[] = [
    {
      title: '⚔️ Combate',
      items: [
        { icon: '🗡️', label: 'Confronto',  description: 'Arena de batalha',    action: { type: 'tab', tab: 'battle'    } },
        { icon: '🗺️', label: 'Reinos',     description: 'Zonas e dungeons',    action: { type: 'tab', tab: 'zones'     } },
      ],
    },
    {
      title: '🧙 Personagem',
      items: [
        { icon: '📊', label: 'Herói',      description: 'Stats e habilidades', action: { type: 'tab', tab: 'stats'     } },
        { icon: '🎒', label: 'Inventário', description: 'Equipamentos e itens',action: { type: 'tab', tab: 'inventory' } },
        { icon: '👤', label: 'Perfil',     description: 'Suas informações',    action: { type: 'tab', tab: 'profile'   } },
      ],
    },
    {
      title: '🏪 Comércio',
      items: [
        { icon: '🛒', label: 'Mercado',    description: 'Comprar e vender itens', action: { type: 'link', href: '/shop'   } },
        { icon: '⚒️', label: 'Ferreiro',   description: 'Loja de equipamentos',   action: { type: 'link', href: '/loja'   } },
        { icon: '🔨', label: 'Forja',      description: 'Aprimorar equipamentos', action: { type: 'link', href: '/forja'  } },
        { icon: '🧙', label: 'NPCs',       description: 'Personagens e negócios', action: { type: 'link', href: '/npcs'   } },
      ],
    },
    {
      title: '📬 Social',
      items: [
        { icon: '✉️', label: 'Correio',    description: 'Mensagens e transferências', action: { type: 'tab', tab: 'mail'  } },
        { icon: '🏆', label: 'Rankings',   description: 'Tabela de heróis',       action: { type: 'link', href: '/rankings' } },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pb-2">
      {/* Hero summary bar */}
      {hero && (
        <div className="bg-[#16110c]/80 border border-amber-900/30 rounded-xl px-3 py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-amber-200 text-sm font-bold shrink-0">
            {hero.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-amber-100 text-sm font-bold truncate">{hero.name}</p>
            <p className="text-amber-100/45 text-xs capitalize">{hero.class} · Nível {hero.level}</p>
          </div>
          {user && (
            <p className="text-amber-100/30 text-xs shrink-0">@{user.username}</p>
          )}
        </div>
      )}

      {/* Groups */}
      {groups.map(group => (
        <div key={group.title}>
          <p className="text-amber-100/40 text-[10px] uppercase font-bold tracking-widest mb-2 px-0.5">{group.title}</p>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map(item => {
              const inner = (
                <div className="bg-[#16110c]/70 border border-amber-900/20 hover:border-amber-700/50 rounded-xl px-3 py-3 flex items-center gap-3 transition-all hover:bg-[#1e1610]/80 active:scale-[0.97]">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-amber-100 text-xs font-bold">{item.label}</p>
                    <p className="text-amber-100/35 text-[10px] leading-tight">{item.description}</p>
                  </div>
                </div>
              )

              if (item.action.type === 'tab') {
                return (
                  <button key={item.label} onClick={() => onNavigate(item.action.type === 'tab' ? item.action.tab : 'menu')} className="text-left">
                    {inner}
                  </button>
                )
              }
              if (item.action.type === 'link') {
                return (
                  <Link key={item.label} href={(item.action as { type: 'link'; href: string }).href}>
                    {inner}
                  </Link>
                )
              }
              return null
            })}
          </div>
        </div>
      ))}

      {/* Danger zone */}
      <div className="mt-2 pt-3 border-t border-white/5">
        <button
          onClick={() => { if (confirm('Tem certeza? O progresso local será perdido!')) resetGame() }}
          className="w-full py-2.5 rounded-xl text-xs text-red-400/50 hover:text-red-300/80 hover:bg-red-900/10 transition-colors"
        >
          Resetar Jogo
        </button>
      </div>
    </div>
  )
}
