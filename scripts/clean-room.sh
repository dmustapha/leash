#!/usr/bin/env bash
# clean-room.sh — the release gate, runnable from a fresh clone (C0 rule 23).
# 1. assert no secret leaked into the tracked tree
# 2. run the FULL offline test suite (no credentials): typecheck + unit + integration tiers
# 3. regenerate headline evidence into evidence/ (best-effort; needs network for live reads)
# 4. diff regenerated vs committed, expecting zero drift
#
# The one-command release gate reused in local + CI is `npm run check` (typecheck + unit + integration).
# This script wraps that gate plus the secret-leak assertion and the evidence-drift check.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== clean-room: secret-leak scan =="
# Fail if any private key / seed material is committed into the tracked tree.
# (.env is gitignored; this catches an accidental hardcode or a mis-committed key.)
LEAK_PATTERNS='(-----BEGIN [A-Z ]*PRIVATE KEY-----|wallet-auth:[A-Za-z0-9+/=]+|PRIVATE_KEY=0x[0-9a-fA-F]{64}|OPERATOR_KEY=0x[0-9a-fA-F]{64})'
# Only scan tracked files; .env / .env.* are gitignored so never appear here (except .env.example, which is safe).
TRACKED=$(git ls-files 2>/dev/null || find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -name '.env' -not -name '.env.*')
LEAKS=$(printf '%s\n' "$TRACKED" | grep -vE '(^|/)\.env($|\.)' | grep -v '\.env\.example$' | while read -r f; do
  [ -f "$f" ] || continue
  grep -EIl "$LEAK_PATTERNS" "$f" 2>/dev/null || true
done)
if [ -n "$LEAKS" ]; then
  echo "SECRET LEAK detected in tracked files:"; echo "$LEAKS"; exit 1
fi
echo "no secret leaked into the tracked tree."

echo "== clean-room: release gate (npm run check) =="
npm run check

echo "== clean-room: regenerate headline evidence =="
# Recompute live claims into evidence/. Non-fatal offline: a fresh clone without network still passes the gate,
# but a networked run must produce zero drift against any committed evidence.
if npm run verify:claims; then
  if [ -f evidence/claims-recomputed.json ] && git ls-files --error-unmatch evidence/claims-recomputed.json >/dev/null 2>&1; then
    if ! git diff --exit-code -- evidence/claims-recomputed.json; then
      echo "EVIDENCE DRIFT: recomputed claims differ from committed evidence."; exit 1
    fi
    echo "evidence matches committed (zero drift)."
  else
    echo "evidence regenerated (not yet committed; nothing to diff)."
  fi
else
  echo "verify:claims could not run (offline or pre-seed) — skipping drift check."
fi

echo "== clean-room: PASS =="
