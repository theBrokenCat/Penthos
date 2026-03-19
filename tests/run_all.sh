#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
#  run_all.sh — Ejecuta todos los tests de la arquitectura event-driven
#
#  Uso (desde el host Mac):
#    bash tests/run_all.sh
#  o para un test concreto:
#    bash tests/run_all.sh hooks
#    bash tests/run_all.sh chromadb
#    bash tests/run_all.sh pipeline
#    bash tests/run_all.sh zap
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

CONTAINER="agent-supervisor"
TESTS_DIR="/app/tests"
PASS=0
FAIL=0

run_test() {
  local name="$1"
  local script="$2"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  TEST: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if docker exec "$CONTAINER" python3 "$TESTS_DIR/$script" 2>&1; then
    echo "  ✅  PASS: $name"
    PASS=$((PASS+1))
  else
    echo "  ❌  FAIL: $name"
    FAIL=$((FAIL+1))
  fi
}

FILTER="${1:-all}"

echo "╔════════════════════════════════════════╗"
echo "║   OpenClaw Pentester — Test Suite      ║"
echo "╚════════════════════════════════════════╝"

if [[ "$FILTER" == "all" || "$FILTER" == "chromadb" ]]; then
  run_test "ChromaDB: store / query / clear" "test_chromadb.py"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "hooks" ]]; then
  run_test "Hooks: endpoints accesibles en todos los agentes" "test_hooks.py"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "pipeline" ]]; then
  run_test "Pipeline: PHASE_COMPLETE loop completo" "test_pipeline.py"
fi

if [[ "$FILTER" == "all" || "$FILTER" == "zap" ]]; then
  run_test "ZAP: daemon accesible y respondiendo" "test_zap.py"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESULTADO: $PASS passed / $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
[[ $FAIL -eq 0 ]]
