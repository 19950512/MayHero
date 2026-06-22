#!/usr/bin/env bash
set -euo pipefail

clear

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/prod-docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"
COMPOSE_CMD=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
ACTION="${1:-up}"

REMOTE_HOST="deploy@147.182.239.137"
REMOTE_DIR="/home/deploy/MayHero"
NGINX_DIR="/home/deploy/nginx-147.182.239.137"

usage() {
  cat <<'EOF'
Uso:
  bash deploy.sh [acao]

Acoes:
  up        Build e sobe os containers em background (padrao)
  down      Para e remove os containers
  restart   Reinicia todos os servicos
  logs      Exibe logs em tempo real
  ps        Lista status dos servicos
  pull      Baixa imagens base atualizadas
  remote    Push ao git e faz deploy no servidor via SSH

Exemplos:
  bash deploy.sh up
  bash deploy.sh remote
  bash deploy.sh logs
  bash deploy.sh down
EOF
}

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Erro: arquivo nao encontrado: $COMPOSE_FILE"
  exit 1
fi

if [[ "$ACTION" == "-h" || "$ACTION" == "--help" || "$ACTION" == "help" ]]; then
  usage
  exit 0
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Erro: arquivo nao encontrado: $ENV_FILE"
  echo "Crie .env na raiz (pode copiar de .env.example e ajustar os valores de producao)."
  exit 1
fi

case "$ACTION" in
  up)
    echo "Subindo stack de producao..."
    "${COMPOSE_CMD[@]}" up -d --build
    echo "Deploy concluido."
    "${COMPOSE_CMD[@]}" ps
    ;;
  down)
    echo "Parando stack de producao..."
    "${COMPOSE_CMD[@]}" down
    ;;
  restart)
    echo "Reiniciando stack de producao..."
    "${COMPOSE_CMD[@]}" down
    "${COMPOSE_CMD[@]}" up -d --build
    "${COMPOSE_CMD[@]}" ps
    ;;
  logs)
    "${COMPOSE_CMD[@]}" logs -f --tail=200
    ;;
  ps)
    "${COMPOSE_CMD[@]}" ps
    ;;
  pull)
    echo "Atualizando imagens base..."
    "${COMPOSE_CMD[@]}" pull
    ;;
  remote)
    echo "Fazendo push para o GitHub..."
    git -C "$ROOT_DIR" push origin main

    echo "Conectando ao servidor $REMOTE_HOST..."
    # shellcheck disable=SC2029
    ssh "$REMOTE_HOST" "
      set -e

      echo '==> Atualizando nginx...'
      cd $NGINX_DIR
      git pull
      docker compose up -d

      echo '==> Atualizando MayHero...'
      cd $REMOTE_DIR
      git pull
      bash deploy.sh up
    "
    echo "Deploy remoto concluido."
    ;;
  *)
    echo "Erro: acao invalida: $ACTION"
    echo
    usage
    exit 1
    ;;
esac
