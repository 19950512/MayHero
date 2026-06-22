#!/usr/bin/env bash
set -euo pipefail

clear

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"

MODE="build"
PLATFORM="all"
PUBLISH_POLICY="always"
SKIP_INSTALL=false
CLEAN=false

usage() {
  cat <<'EOF'
Uso:
  bash electron-release.sh [opcoes]

Opcoes:
  --mode build|deploy       Modo de execucao (padrao: build)
  --platform linux|win|all  Plataforma alvo (padrao: all)
  --publish always|onTag|never
                            Politica de publicacao no modo deploy (padrao: always)
  --skip-install            Nao roda npm install
  --clean                   Remove pasta dist antes do build
  -h, --help                Mostra esta ajuda

Exemplos:
  bash electron-release.sh --mode build --platform linux
  bash electron-release.sh --mode build --platform win
  bash electron-release.sh --mode deploy --platform all --publish onTag
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    --platform)
      PLATFORM="${2:-}"
      shift 2
      ;;
    --publish)
      PUBLISH_POLICY="${2:-}"
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Erro: opcao invalida: $1"
      echo
      usage
      exit 1
      ;;
  esac
done

if [[ "$MODE" != "build" && "$MODE" != "deploy" ]]; then
  echo "Erro: --mode deve ser build ou deploy"
  exit 1
fi

if [[ "$PLATFORM" != "linux" && "$PLATFORM" != "win" && "$PLATFORM" != "all" ]]; then
  echo "Erro: --platform deve ser linux, win ou all"
  exit 1
fi

if [[ "$PUBLISH_POLICY" != "always" && "$PUBLISH_POLICY" != "onTag" && "$PUBLISH_POLICY" != "never" ]]; then
  echo "Erro: --publish deve ser always, onTag ou never"
  exit 1
fi

if [[ "$MODE" == "deploy" && "$PUBLISH_POLICY" == "never" ]]; then
  echo "Erro: modo deploy exige --publish always ou --publish onTag"
  exit 1
fi

echo ""
echo "May Hero Electron Release"
echo "-------------------------"
echo "Modo: $MODE"
echo "Plataforma: $PLATFORM"
echo "Publish: $PUBLISH_POLICY"

if [[ ! -d "$WEB_DIR" ]]; then
  echo "Erro: pasta apps/web nao encontrada em: $WEB_DIR"
  exit 1
fi

if [[ "$SKIP_INSTALL" == false ]]; then
  echo ""
  echo "Instalando dependencias..."
  (
    cd "$ROOT_DIR"
    npm install
  )
fi

if [[ "$CLEAN" == true ]]; then
  echo ""
  echo "Limpando artefatos antigos..."
  rm -rf "$WEB_DIR/dist"
fi

echo ""
echo "Gerando build estatico do Next para Electron..."
(
  cd "$WEB_DIR"
  ELECTRON_BUILD=true npm run build
)

EB_CMD=(npx electron-builder)

case "$PLATFORM" in
  linux)
    EB_CMD+=(--linux AppImage)
    ;;
  win)
    EB_CMD+=(--win nsis)
    ;;
  all)
    EB_CMD+=(--linux AppImage --win nsis)
    ;;
esac

if [[ "$MODE" == "build" ]]; then
  EB_CMD+=(--publish never)
else
  EB_CMD+=(--publish "$PUBLISH_POLICY")
fi

echo ""
echo "Executando: ${EB_CMD[*]}"
(
  cd "$WEB_DIR"
  "${EB_CMD[@]}"
)

echo ""
echo "Build finalizado. Verifique os artefatos em: $WEB_DIR/dist"
