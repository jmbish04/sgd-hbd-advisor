#!/bin/bash

# Entry point for Cloudflare Docs Query Agent

PYTHON=$(command -v python3 || command -v python)

if [ -z "$PYTHON" ]; then
  echo "Python3 is required but not found. Exiting."
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SCRIPT="$SCRIPT_DIR/query-cloudflare-docs.py"

if [ ! -f "$SCRIPT" ]; then
  echo "cfdocs_query_agent.py not found at $SCRIPT. Exiting."
  exit 1
fi

# Check for .dev.vars and ensure CF_API_KEY or fallback key exists
ENV_FILE=".dev.vars"
KEY_VAR="CF_API_KEY"
FALLBACK_KEY_VAR="WORKER_OPENAI_PROXY_KEY"

if [ ! -f "$ENV_FILE" ]; then
  echo "[Info] Creating missing $ENV_FILE..."
  echo "$FALLBACK_KEY_VAR=\"enter key here\"" > "$ENV_FILE"
  echo "[Warning] Please update $ENV_FILE with your actual API key."
fi

source "$ENV_FILE"

if [ -z "${!KEY_VAR}" ] && [ -z "${!FALLBACK_KEY_VAR}" ]; then
  echo "[Error] API key missing. Set either $KEY_VAR or $FALLBACK_KEY_VAR in $ENV_FILE or system environment."
  exit 1
fi

export CF_API_KEY="${!KEY_VAR:-${!FALLBACK_KEY_VAR}}"

if [ "$1" == "--demo" ]; then
  echo "Running demo query about worker types..."

  FILES=()
  for f in wrangler.jsonc wrangler.toml package.json src/worker-configuration.d.ts; do
    if [ -f "$f" ]; then
      FILES+=("$f")
    else
      echo "[Warning] Missing file: $f"
    fi
  done

  if [ ${#FILES[@]} -eq 0 ]; then
    echo "No relevant files found for demo. Aborting."
    exit 1
  fi

  TMPFILE=$(mktemp)
  cat > "$TMPFILE" <<EOF
[
  {
    "query": "What Cloudflare worker types or configuration options are declared or inferred in this project?",
    "cloudflare_bindings_involved": ["ai", "kv", "d1"],
    "node_libs_involved": ["undici", "itty-router"],
    "tags": ["worker", "bindings", "types"],
    "relevant_code_files": [
      $(for f in "${FILES[@]}"; do echo "{\"file_path\": \"$f\", \"start_line\": 1, \"end_line\": 40, \"relation_to_question\": \"direct\"},"; done | sed '$s/,$//')
    ]
  }
]
EOF

  exec "$PYTHON" "$SCRIPT" "$TMPFILE"
else
  exec "$PYTHON" "$SCRIPT" "$@"
fi
