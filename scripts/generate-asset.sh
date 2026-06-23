#!/bin/bash
# May Hero — Asset Generator
# Generates game sprites via DALL-E 3 and saves them to the right public/assets/ folder.
#
# Usage:
#   ./scripts/generate-asset.sh --type item    --name "Poção de Vida" --desc "small red healing potion in a glass vial"
#   ./scripts/generate-asset.sh --type monster --name "Rato"          --desc "small aggressive grey sewer rat" --id rat
#   ./scripts/generate-asset.sh --type class   --name "Guerreiro"     --desc "heavily armored medieval warrior with sword and shield" --id warrior
#   ./scripts/generate-asset.sh --type npc     --name "Heitor Maydana" --desc "wise old merchant with grey beard and brown robes"
#   ./scripts/generate-asset.sh --type skill   --name "Bola de Fogo"  --desc "swirling fireball with orange and red flames"
#
# Requires: OPENAI_API_KEY environment variable

set -euo pipefail

clear

# Vamos ler do .env
if [[ -f "../.env" ]]; then
  export $(grep -v '^#' ../.env | xargs)
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PUBLIC_DIR="$PROJECT_ROOT/apps/web/public"

# ──────────────────────────────────────────────
# Usage
# ──────────────────────────────────────────────
usage() {
  cat <<EOF
May Hero — Asset Generator

Usage: $0 --type <TYPE> --name <NAME> --desc <DESC> [--id <FILE_ID>]

TYPES
  item      Item de inventário (poção, equipamento, material, moeda)
  npc       Personagem NPC (comerciante, aldeão, quest giver)
  monster   Monstro inimigo (rato, morcego, boss, etc.)
  class     Classe/vocação do herói (guerreiro, mago, arqueiro…)
  skill     Habilidade ou magia

OPTIONS
  --type    Tipo do asset  (obrigatório)
  --name    Nome do asset  (obrigatório) — ex: "Poção de Vida"
  --desc    Descrição visual em inglês (obrigatório) — ex: "small red healing potion"
  --id      ID para nome do arquivo (opcional; derivado do --name se omitido)

ENVIRONMENT
  OPENAI_API_KEY   Sua chave da OpenAI (export OPENAI_API_KEY=sk-...)

EXAMPLES
  $0 --type item    --name "Poção de Vida"    --desc "small red healing potion in a glass vial" --id healing_potion
  $0 --type item    --name "Anel de Cura"     --desc "golden ring with a green healing gem"     --id healing_ring
  $0 --type monster --name "Rato"             --desc "small aggressive grey sewer rat"           --id rat
  $0 --type monster --name "Morcego"          --desc "dark cave bat with sharp fangs"            --id bat
  $0 --type class   --name "Guerreiro"        --desc "heavily armored warrior with sword and shield" --id warrior
  $0 --type class   --name "Sorcerer"         --desc "robed mage channeling arcane lightning"   --id mage
  $0 --type npc     --name "Heitor Maydana"   --desc "wise old merchant with grey beard in brown robes"
  $0 --type skill   --name "Bola de Fogo"     --desc "swirling orange fireball with smoke trail"
EOF
}

# ──────────────────────────────────────────────
# Parse arguments
# ──────────────────────────────────────────────
TYPE=""
NAME=""
DESC=""
FILE_ID=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --type)    TYPE="$2";    shift 2 ;;
    --name)    NAME="$2";    shift 2 ;;
    --desc)    DESC="$2";    shift 2 ;;
    --id)      FILE_ID="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; echo ""; usage; exit 1 ;;
  esac
done

if [[ -z "$TYPE" || -z "$NAME" || -z "$DESC" ]]; then
  echo "Error: --type, --name, and --desc are required."
  echo ""
  usage
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "Error: OPENAI_API_KEY not set."
  echo "Export it with: export OPENAI_API_KEY=sk-..."
  exit 1
fi

# ──────────────────────────────────────────────
# Derive file ID from name when not provided
# ──────────────────────────────────────────────
if [[ -z "$FILE_ID" ]]; then
  FILE_ID=$(python3 -c "
import sys, re, unicodedata
s = '${NAME//\'/\\\'}'.strip()
s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
s = s.lower()
s = re.sub(r'[^a-z0-9]+', '_', s).strip('_')
print(s)
")
fi

# ──────────────────────────────────────────────
# Type → output directory + prompt fragment
# ──────────────────────────────────────────────
case "$TYPE" in
  item)
    OUT_DIR="$PUBLIC_DIR/assets/items"
    SPRITE_PATH="/assets/items/$FILE_ID.png"
    VIEW_HINT="isometric top-down perspective, inventory icon format"
    CONTEXT="An MMORPG item icon for a player inventory slot."
    ;;
  npc)
    OUT_DIR="$PUBLIC_DIR/assets/npcs"
    SPRITE_PATH="/assets/npcs/$FILE_ID.png"
    VIEW_HINT="front-facing full-body portrait, NPC dialogue card"
    CONTEXT="An MMORPG non-player character shown in a dialogue screen portrait."
    ;;
  monster)
    OUT_DIR="$PUBLIC_DIR/assets/monsters"
    SPRITE_PATH="/assets/monsters/$FILE_ID.png"
    VIEW_HINT="front-facing battle stance, enemy encounter sprite"
    CONTEXT="An MMORPG enemy monster displayed during a combat encounter."
    ;;
  class|vocation)
    OUT_DIR="$PUBLIC_DIR/assets/vocations"
    SPRITE_PATH="/assets/vocations/$FILE_ID.png"
    VIEW_HINT="dynamic action pose, character selection portrait"
    CONTEXT="An MMORPG hero class character shown on a character selection screen."
    ;;
  skill)
    OUT_DIR="$PUBLIC_DIR/assets/skills"
    SPRITE_PATH="/assets/skills/$FILE_ID.png"
    VIEW_HINT="square icon format with glowing magical effects"
    CONTEXT="An MMORPG active skill or spell icon shown in the player skill bar."
    ;;
  *)
    echo "Error: Unknown type '$TYPE'. Valid: item | npc | monster | class | skill"
    exit 1
    ;;
esac

mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/$FILE_ID.png"

# ──────────────────────────────────────────────
# Build the final prompt
# ──────────────────────────────────────────────
#
# Prompt strategy:
#   1. Game identity — anchors the aesthetic
#   2. Context — what this asset IS in the game
#   3. View/layout hint — how to frame it
#   4. Subject — name + visual description
#   5. Art direction — shared style across all May Hero assets
#
FULL_PROMPT="May Hero fantasy MMORPG game asset. ${CONTEXT} ${VIEW_HINT}. Subject: \"${NAME}\" — ${DESC}. Art direction: modern fantasy pixel art style, highly detailed sprite work, vibrant medieval fantasy color palette, clean bold outlines, light neutral background, perfectly centered composition, professional 2D game asset suitable for a top-down MMORPG. IMPORTANT: leave generous empty padding on all four sides (top, bottom, left, right) so the subject fits entirely inside a circle crop with no parts cut off. IMPORTANT: no text, no letters, no words, no labels, no watermarks, no captions anywhere in the image."

# ──────────────────────────────────────────────
# Print summary
# ──────────────────────────────────────────────
echo "======================================"
echo "  May Hero — Asset Generator"
echo "======================================"
printf "  Type   : %s\n" "$TYPE"
printf "  Name   : %s\n" "$NAME"
printf "  File ID: %s\n" "$FILE_ID"
printf "  Output : %s\n" "$OUT_FILE"
echo ""
echo "Prompt:"
echo "$FULL_PROMPT"
echo ""
echo "Calling DALL-E 3..."

# ──────────────────────────────────────────────
# Call OpenAI API via Python (no jq dependency)
# ──────────────────────────────────────────────
OPENAI_API_KEY="$OPENAI_API_KEY" ASSET_PROMPT="$FULL_PROMPT" OUT_FILE="$OUT_FILE" python3 - <<'PYEOF'
import urllib.request, urllib.error, json, os, sys, base64

prompt   = os.environ["ASSET_PROMPT"]
api_key  = os.environ["OPENAI_API_KEY"]
out_file = os.environ["OUT_FILE"]

payload = json.dumps({
    "model": "gpt-image-1",
    "prompt": prompt,
    "n": 1,
    "size": "1024x1024",
    "quality": "medium",
}).encode()

req = urllib.request.Request(
    "https://api.openai.com/v1/images/generations",
    data=payload,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
)

try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read())
        img_b64 = data["data"][0]["b64_json"]
        with open(out_file, "wb") as f:
            f.write(base64.b64decode(img_b64))
        print("ok")
except urllib.error.HTTPError as e:
    body = json.loads(e.read().decode())
    msg = body.get("error", {}).get("message", "Unknown API error")
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)
PYEOF

# ──────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────
echo ""
echo "======================================"
echo "  Done!"
echo "======================================"
printf "  Saved : %s\n" "$OUT_FILE"
printf "  Sprite: %s\n" "$SPRITE_PATH"
echo ""
echo "Add to your entity definition:"
printf "  sprite: '%s',\n" "$SPRITE_PATH"
echo ""
