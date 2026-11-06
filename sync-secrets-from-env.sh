#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/sync-secrets-from-env.sh <staging|production> [path-to-env-file]
STAGE="${1:?usage: $0 <staging|production> [.env file]}"
ENV_FILE="${2:-".env.$STAGE"}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Missing $ENV_FILE"; exit 1
fi

# Use your convention: profile name == stage name
export AWS_PROFILE="$STAGE"

# Read KEY=VALUE lines, ignore comments/blank, trim trailing spaces
while IFS='=' read -r raw_key raw_val; do
  # skip comments/blank
  [[ -z "${raw_key:-}" || "${raw_key:0:1}" == "#" ]] && continue

  key="$(echo -n "$raw_key" | tr -d '[:space:]')"
  # keep the raw value as-is, but strip surrounding quotes if present
  val="${raw_val%\"}"; val="${val#\"}"
  val="${val%\'}"; val="${val#\'}"

  # skip empty (optional)
  [[ -z "$val" ]] && continue

  echo "→ Setting $key for stage=$STAGE"
  sst secret set "$key" "$val" --stage "$STAGE"
done < <(sed -e 's/[[:space:]]*$//' "$ENV_FILE")

echo "✅ Secrets synced from $ENV_FILE to stage=$STAGE"
