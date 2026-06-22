#!/usr/bin/env bash
set -e

clear

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Parse flags ───────────────────────────────────────────────────────────────
ELECTRON=false
for arg in "$@"; do
  case "$arg" in
    --electron|-e) ELECTRON=true ;;
  esac
done

echo ""
echo "⚔️  May Hero — Dev Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Libera portas antes de subir ─────────────────────────────────────────────
for PORT in 3069 3070; do
  PID=$(fuser ${PORT}/tcp 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "→ Liberando porta $PORT (PID $PID)..."
    kill -9 "$PID" 2>/dev/null || true
  fi
done
sleep 1

# ── Opção 1: Docker Compose (se Docker disponível) ────────────────────────────
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  if [ "$ELECTRON" = true ]; then
    echo "✓ Docker detectado — subindo API+banco em background..."
    docker compose -f "$ROOT/dev-docker-compose.yml" up --build --no-attach web &
    DOCKER_PID=$!

    echo "→ Aguardando API ficar pronta..."
    timeout 60 bash -c 'until curl -sf http://localhost:3070/health >/dev/null 2>&1; do sleep 2; done' \
      && echo "✓ API pronta" || echo "⚠ API demorou — tentando abrir Electron mesmo assim"

    echo "→ Abrindo Electron..."
    cd "$ROOT/apps/web"
    NODE_ENV=development npm run electron
    kill $DOCKER_PID 2>/dev/null
  else
    echo "✓ Docker detectado — subindo com docker compose..."
    echo "  💡 Use 'bash dev.sh --electron' para abrir o app desktop."
    echo ""
    exec docker compose -f "$ROOT/dev-docker-compose.yml" up --build
  fi
  exit 0
fi

# ── Opção 2: Manual sem banco ─────────────────────────────────────────────────
echo "⚠  Docker não encontrado — modo offline (sem API/banco de dados)"
echo "   Rankings e shop precisarão do Docker para funcionar."
echo ""

if [ "$ELECTRON" = true ]; then
  echo "→ Iniciando Next.js + Electron..."
  cd "$ROOT/apps/web"
  exec npm run electron:dev
else
  echo "→ Iniciando Next.js em http://localhost:3069"
  echo "  💡 Use 'bash dev.sh --electron' para abrir o app desktop."
  echo ""
  cd "$ROOT/apps/web"
  exec npm run dev
fi
