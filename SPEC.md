# ⚔️ May Hero — Game Specification

> **Status:** Em desenvolvimento ativo  
> **Stack:** Next.js 16 + Fastify 5 + PostgreSQL + Redis + Electron  
> **Versão atual:** 0.2.0

---

## Conceito

May Hero é um **Idle RPG** — o herói combate automaticamente enquanto o jogador gerencia equipamentos, zonas e recursos. Funciona como app web (browser), app desktop (Electron com ícone na bandeja do sistema) e tem backend online para rankings globais e mercado de itens entre jogadores.

---

## 1. Loop de Jogo

```
Criar herói → Auto-batalha (1 turno a cada 1.5s) → Vitória/Derrota → Próximo inimigo → ...
```

1. O herói inicia na **Zona 1** e combate inimigos automaticamente
2. A cada **1.5 segundos** ocorre um turno: herói ataca, inimigo contra-ataca
3. Na **vitória**: ganha XP, ouro e chance de drop de item (15%, ponderado por raridade)
4. Na **derrota**: perde 10% do ouro, HP restaurado a 50%, próxima batalha começa
5. A cada **10 abates** na zona aparece um **Chefe** com recompensas maiores
6. O jogador pode **pausar** o auto-battle ou **trocar de zona** manualmente
7. O progresso é salvo no `localStorage` e **sincronizado com a API a cada 30s** (se logado)

---

## 2. Classes

| Classe | HP Base | ATK | DEF | VEL | CRIT | Playstyle |
|---|---|---|---|---|---|---|
| ⚔️ Guerreiro | 120 | 12 | 8 | 5 | 8% | Tank — sobrevive bem, cresce consistente |
| 🏹 Arqueiro | 90 | 15 | 5 | 9 | 15% | DPS — abate rápido, frágil |
| 🔮 Mago | 70 | 18 | 3 | 6 | 10% | Burst — maior ATK, morre fácil |

### Crescimento por nível

| Stat | Guerreiro/nível | Arqueiro/nível | Mago/nível |
|---|---|---|---|
| Max HP | +18 | +12 | +8 |
| ATK | +2.5 | +3.2 | +4.0 |
| DEF | +1.5 | +1.0 | +0.8 |
| VEL | +0.3 | +0.5 | +0.3 |
| CRIT | +0.2% | +0.4% | +0.3% |

---

## 3. Sistema de Combate

### Fórmula de dano
```
dano = max(1, ATK_atacante - DEF_defensor + random(-2, +1))
dano_critico = dano × 1.8
```

### Velocidade dupla
Se o inimigo tiver `VEL > VEL_herói + 4`, ele ataca **duas vezes** no mesmo turno.

### Crítico
Chance de crítico cap: **75%**. O crit multiplica o dano por 1.8×.

### Curva de XP
```
XP para subir do nível N = floor(100 × N^1.5)
```
| Nível | XP necessário |
|---|---|
| 1→2 | 100 |
| 5→6 | 558 |
| 10→11 | 1.581 |
| 20→21 | 8.944 |

### Level-up
- Stats recalculados pela fórmula de crescimento da classe
- HP e MP restaurados ao máximo
- +1 **Skill Point** para distribuir nos atributos

### Skill Points *(implementado)*
A cada level-up o jogador recebe 1 ponto para alocar (permanente, sem refund):

| Opção | Bônus por ponto |
|---|---|
| ATK | +2 ATK |
| DEF | +1 DEF |
| Vida | +10 HP máximo |
| VEL | +1 VEL |

### Poção
- Custo: `10 + nível × 2` de ouro
- Cura: 40% do HP máximo
- Disponível a qualquer momento durante o combate

---

## 4. Zonas e Inimigos

### Zona 1 — Floresta Sombria *(nível mínimo: 1)*

| Inimigo | HP | ATK | DEF | VEL | CRIT | XP | Ouro |
|---|---|---|---|---|---|---|---|
| 🟢 Slime | 20 | 4 | 1 | 2 | 2% | 8 | 1–4 |
| 🦇 Morcego | 15 | 6 | 0 | 7 | 5% | 10 | 2–5 |
| 👺 Goblin | 30 | 7 | 2 | 4 | 3% | 14 | 3–7 |
| 🐺 Lobo | 35 | 9 | 2 | 6 | 6% | 18 | 2–6 |
| 👹 **Orc Chefe** *(boss)* | 100 | 14 | 5 | 3 | 4% | 60 | 15–30 |

### Zona 2 — Cavernas de Pedra *(nível mínimo: 5)*

| Inimigo | HP | ATK | DEF | VEL | CRIT | XP | Ouro |
|---|---|---|---|---|---|---|---|
| 💀 Esqueleto | 55 | 14 | 4 | 4 | 5% | 28 | 6–12 |
| 🕷️ Aranha Gigante | 48 | 16 | 3 | 8 | 8% | 32 | 8–14 |
| 🧌 Troll | 80 | 18 | 7 | 2 | 2% | 40 | 10–18 |
| 🗿 **Golem de Pedra** *(boss)* | 250 | 28 | 12 | 2 | 3% | 150 | 40–80 |

### Zona 3 — Torre do Mago Sombrio *(nível mínimo: 10)*

| Inimigo | HP | ATK | DEF | VEL | CRIT | XP | Ouro |
|---|---|---|---|---|---|---|---|
| 🧟 Mago Zumbi | 90 | 24 | 6 | 5 | 10% | 55 | 15–25 |
| 😈 Demônio | 110 | 28 | 8 | 7 | 12% | 65 | 18–32 |
| 🌑 **Lorde das Sombras** *(boss)* | 500 | 45 | 18 | 6 | 15% | 350 | 100–200 |

**Chefes** aparecem a cada **10 abates** na zona. São sinalizados com ⚠️ na interface.

---

## 5. Itens e Equipamentos

### Slots disponíveis
- ⚔️ **Arma** (weapon) — aumenta ATK principalmente
- 🥋 **Armadura** (armor) — aumenta DEF e HP
- ⛑️ **Elmo** (helm) — aumenta DEF e HP
- 💍 **Anel** (ring) — efeitos variados

### Raridades e drop rate
| Raridade | Cor | Peso de drop |
|---|---|---|
| Common | Cinza | 60% |
| Rare | Azul | 25% |
| Epic | Roxo | 12% |
| Legendary | Dourado | 3% |

> Chance base de drop por vitória: **15%**. A raridade é sorteada pelos pesos acima dentro do pool elegível pelo nível do herói.

### Armas

| Item | Raridade | Nível | Bônus |
|---|---|---|---|
| 🪵 Galho | Common | 1 | +2 ATK |
| ⚔️ Espada de Ferro | Common | 2 | +5 ATK, +1 DEF |
| 🏹 Arco do Caçador | Common | 2 | +6 ATK, +1 VEL |
| 🪄 Cajado de Carvalho | Common | 2 | +7 ATK, +2 CRIT |
| 🗡️ Espada de Aço | Rare | 5 | +12 ATK, +2 DEF |
| 🔥 Cajado de Fogo | Rare | 7 | +18 ATK, +5 CRIT |
| 🌑 Lâmina Sombria | Epic | 10 | +28 ATK, +8 CRIT, +2 VEL |
| ✨ Excalibur | Legendary | 15 | +50 ATK, +10 DEF, +12 CRIT |

### Armaduras

| Item | Raridade | Nível | Bônus |
|---|---|---|---|
| 👕 Roupa de Tecido | Common | 1 | +2 DEF |
| 🥋 Armadura de Couro | Common | 2 | +5 DEF, +10 HP |
| 🛡️ Cota de Malha | Rare | 5 | +10 DEF, +25 HP |
| ⚜️ Armadura de Placas | Epic | 10 | +18 DEF, +60 HP |
| 🐉 Armadura Dracônica | Legendary | 15 | +35 DEF, +120 HP |

### Elmos

| Item | Raridade | Nível | Bônus |
|---|---|---|---|
| 🪖 Capuz | Common | 1 | +1 DEF |
| ⛑️ Elmo de Ferro | Common | 3 | +3 DEF, +8 HP |
| 👑 Coroa do Rei | Epic | 10 | +8 DEF, +30 HP, +5 CRIT |

### Anéis

| Item | Raridade | Nível | Bônus |
|---|---|---|---|
| 💍 Anel de Cobre | Common | 1 | +1 ATK |
| 💨 Anel da Velocidade | Rare | 5 | +3 VEL, +4 CRIT |
| 🔮 Anel do Poder | Epic | 10 | +15 ATK, +6 CRIT |

### Como obter itens
- **Drop aleatório** (15% de chance por vitória, raridade ponderada) — filtra por `requiredLevel ≤ nível atual`
- **Compra no Mercado** — de outros jogadores

### Como usar itens
- Aba **Bolsa** → botão "Equipar" — substitui o slot automaticamente
- Item antigo vai para o inventário
- Equipar exige nível mínimo do item

---

## 6. Mercado de Itens (Shop)

- Qualquer jogador pode **listar itens** do inventário diretamente na aba Bolsa (botão "Vender" → campo de preço → confirmar)
- Fluxo de listagem: sync forçado → busca ID do item no DB → `POST /shop/list`
- Qualquer jogador pode **comprar** itens na página `/shop`
- A transação é **server-side**: ouro é deduzido do comprador e creditado ao vendedor atomicamente
- Listagem pode ser **cancelada** antes da venda
- Itens listados ficam bloqueados no inventário até venda ou cancelamento
- Paginação: 20 itens por página

---

## 7. Rankings

Dois rankings públicos (sem precisar de login):

| Ranking | Ordenação |
|---|---|
| 🏆 Por Nível | Nível decrescente → abates como desempate |
| ⚔️ Por Abates | Total de kills decrescente |

- Top 50 jogadores exibidos
- Cache em **Redis** (sorted sets `leaderboard:level` e `leaderboard:kills`)
- Fallback direto no PostgreSQL se Redis estiver indisponível
- Atualizado a cada sync do herói

---

## 8. Sistema Online

### Contas
- Registro: `username` (3–20 chars, alphanumeric+underscore) + email + senha
- Login via JWT com **expiração de 7 dias**
- Sessão salva no `localStorage`

### Sincronização
- O jogo roda **client-side** (no browser/Electron)
- A cada **30 segundos** ou a cada mudança de `killsInZone`, o estado é enviado para a API
- Indicadores no header: `↻` (sinc), `✓` (ok), `✗` (erro)
- Se o herói não existir na API ainda, ele é criado automaticamente na primeira sync
- Anti-cheat básico: rejeita se o nível subir mais de 5 por sync

### Rate Limiting
- **100 req/min por IP** — respostas com `HTTP 429` e header `Retry-After: 60`
- Implementado como hook `onRequest` em memória

### Offline
- Funciona sem conta — salvo apenas no `localStorage`
- Rankings e shop ficam vazios (precisam da API)

---

## 9. Interface

### App (Electron/Browser — 420×620px)
| Aba | Conteúdo |
|---|---|
| ⚔️ Batalha | Arena, HP bars, log de combate, botões Auto/Poção |
| 🧙 Herói | Stats, XP, equipamento atual, ouro, painel de Skill Points |
| 🎒 Bolsa | Inventário com botões Equipar e Vender (logado) |
| 🗺️ Zonas | Seletor de zona, links para Rankings/Shop, Reset |

### Site público
| Página | Conteúdo |
|---|---|
| `/` | Jogo (ou criação de herói) |
| `/login` | Login com email+senha |
| `/register` | Cadastro |
| `/rankings` | Leaderboard por nível/abates |
| `/shop` | Mercado de itens com paginação |

---

## 10. ❌ O que falta / TODO

### Gameplay
- [ ] **Habilidades ativas** — ataques especiais, magias, buffs consumindo MP
- [ ] **MP** existe como stat mas não é usado no combate
- [ ] **Mais zonas** — só 3 zonas, teto de progressão baixo
- [ ] **Mais itens** — apenas 20 itens no pool, sem legendários de zona 3
- [ ] **Set de classe** — itens com bônus específicos por classe
- [ ] **Sistema de encantamento** — melhorar itens com ouro/materiais
- [ ] **Missões/Quests** — objetivos diários ou por zona
- [ ] **Conquistas** — achievements desbloqueáveis

### Balanceamento
- [ ] Zona 3 é muito difícil para entrar com apenas Nível 10 sem bom equipamento
- [ ] Curva de XP pode ser muito íngreme nos níveis altos
- [ ] Sem cap de ouro — jogador pode acumular infinitamente

### Online / Multiplayer
- [ ] **Anti-cheat fraco** — apenas valida delta de nível, não valida XP/ouro
- [ ] **WebSocket subutilizado** — implementado mas não usado no frontend (rankings em tempo real)
- [ ] **Party/Grupo** — cooperação entre jogadores
- [ ] **PvP** — duelos entre heróis
- [ ] **Guild** — clãs com ranking coletivo
- [ ] **Trade direto** — trocar itens com jogador específico sem passar pelo shop

### Shop
- [ ] **Busca e filtro** — por tipo, raridade, nível
- [ ] **Histórico de vendas** — jogador ver o que vendeu/comprou
- [ ] **Preço sugerido** — comparação com mercado

### Infra / Técnico
- [ ] **Migrations Prisma** — usando `db push` em dev, falta criar migrations formais para produção
- [ ] **Rate limiting persistente** — atual é in-memory (perde ao reiniciar); produção precisa de Redis
- [ ] **Testes automatizados** — sem nenhum teste unitário ou de integração
- [ ] **CI/CD** — sem pipeline configurado
- [ ] **Dockerfile de produção** — só existe `Dockerfile.dev` com `tsx watch`
- [ ] **`NEXT_PUBLIC_API_URL`** — hardcoded `localhost:3070`; SSR precisaria do nome interno do serviço Docker

### UX
- [ ] **Animações de combate** — sprites se movendo na arena
- [ ] **Sons** — efeitos sonoros de ataque, crítico, level-up
- [ ] **Tutorial** — nenhuma instrução para novos jogadores
- [ ] **Notificação desktop** (Electron) — alertar sobre level-up quando minimizado
- [ ] **Tela de Game Over** — ao morrer mostra tela antes de continuar
- [ ] **Histórico de batalhas** — log salvo além das últimas 12 linhas visíveis

---

## Histórico de versões

### v0.2.0
- Skill Points funcionais: alocação permanente de pontos em ATK/DEF/HP/VEL a cada level-up
- Drop de itens por raridade ponderada (common 60% / rare 25% / epic 12% / legendary 3%)
- Botão "Vender" na aba Bolsa: listagem de itens no mercado direto da UI do jogo
- Endpoint `GET /hero/inventory` para obter IDs dos itens no DB
- JWT com expiração de 7 dias (register + login)
- Rate limiting: 100 req/min por IP com HTTP 429
- Docker: corrigido `FROM node:20-alpine` → `FROM node:20` para ambiente sem acesso ao registry

### v0.1.0
- Criação de herói (nome + classe)
- Auto-batalha com 3 zonas e todos os inimigos do spec
- Sistema de XP, level-up, ouro e drops
- Inventário e equipamento (4 slots)
- Mercado de itens (listar/comprar/cancelar) via página `/shop`
- Rankings por nível e abates com cache Redis
- Sincronização com API a cada 30s
- Autenticação JWT (registro + login)
- WebSocket para leaderboard em tempo real (backend pronto, frontend pendente)
- App Electron com ícone na bandeja
