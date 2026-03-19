#!/usr/bin/env python3
"""
test_pipeline.py — Verifica el loop PHASE_COMPLETE completo (event-driven).

Simula el flujo:
  1. Supervisor recibe tarea inicial → delega a Explorer
  2. Explorer envía PHASE_COMPLETE: explorer → Supervisor
  3. Supervisor reacciona → delega a Analyst
  4. Analyst envía PHASE_COMPLETE: analyst → Supervisor
  5. Supervisor reacciona → delega a Exploiter
  6. Exploiter envía PHASE_COMPLETE: exploiter → Supervisor

El test no lanza agentes reales — sólo verifica que:
  - El Supervisor acepta hooks con PHASE_COMPLETE
  - La respuesta incluye runId (ejecución iniciada)
  - delegate.py puede enviar PHASE_COMPLETE a supervisor
  - El endpoint /hooks/agent devuelve 2xx con el mensaje esperado
"""

import json
import os
import subprocess
import sys
import time

errors = []

SUPERVISOR_URL = os.environ.get("SUPERVISOR_URL", "http://supervisor:3001")
HOOKS_TOKEN    = os.environ.get("HOOKS_TOKEN", "hooks-secret")
DELEGATE       = "/app/pentester/skills/delegate_to_agent/scripts/delegate.py"

TEST_DOMAIN = "pipeline-test.example.com"
TEST_TARGET = f"https://{TEST_DOMAIN}"


def check(label, condition, detail=""):
    if condition:
        print(f"  ✓  {label}")
    else:
        print(f"  ✗  {label}" + (f" — {detail}" if detail else ""))
        errors.append(label)


def curl_hook(url, token, message):
    """Sends a hook POST and returns (status_code, parsed_body)."""
    payload = json.dumps({"message": message, "wakeMode": "now", "name": "TestPipeline"})
    r = subprocess.run([
        "curl", "-s", "-o", "/tmp/pipeline_hook.json", "-w", "%{http_code}",
        "-X", "POST",
        f"{url}/hooks/agent",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-d", payload,
        "--connect-timeout", "5",
        "--max-time", "15",
    ], capture_output=True, text=True)
    status = r.stdout.strip()
    try:
        with open("/tmp/pipeline_hook.json") as f:
            body = json.loads(f.read())
    except Exception:
        body = {}
    return status, body


def delegate(agent, task):
    """Calls delegate.py and returns parsed JSON."""
    r = subprocess.run([
        "python3", DELEGATE,
        "--agent", agent,
        "--task", task,
    ], capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"_raw": r.stdout[:200], "_err": r.stderr[:200]}


# ── Test 1: Supervisor acepta hook de PHASE_COMPLETE: explorer
print("\n[1] PHASE_COMPLETE: explorer → Supervisor via curl")
msg_explorer = f"""PHASE_COMPLETE: explorer
DOMAIN: {TEST_DOMAIN}
TARGET: {TEST_TARGET}
FINDINGS_COUNT: 5
SUMMARY: TEST — Endpoints: 3. Tech stack: Node.js/Express. Secretos: ninguno."""

status, body = curl_hook(SUPERVISOR_URL, HOOKS_TOKEN, msg_explorer)
check(
    "Supervisor acepta PHASE_COMPLETE:explorer con 2xx",
    status.startswith("2"),
    f"got HTTP {status}, body={str(body)[:200]}"
)
check(
    "Supervisor devuelve runId para PHASE_COMPLETE:explorer",
    bool(body.get("runId")),
    str(body)[:200]
)

# Pequeña pausa entre hooks para no saturar
time.sleep(2)

# ── Test 2: Supervisor acepta hook de PHASE_COMPLETE: analyst
print("\n[2] PHASE_COMPLETE: analyst → Supervisor via curl")
msg_analyst = f"""PHASE_COMPLETE: analyst
DOMAIN: {TEST_DOMAIN}
TARGET: {TEST_TARGET}
FINDINGS_COUNT: 2
SUMMARY: TEST — Vulnerabilidades HIGH: 1 (IDOR en /api/users). MEDIUM: 1 (info disclosure)."""

status, body = curl_hook(SUPERVISOR_URL, HOOKS_TOKEN, msg_analyst)
check(
    "Supervisor acepta PHASE_COMPLETE:analyst con 2xx",
    status.startswith("2"),
    f"got HTTP {status}, body={str(body)[:200]}"
)
check(
    "Supervisor devuelve runId para PHASE_COMPLETE:analyst",
    bool(body.get("runId")),
    str(body)[:200]
)

time.sleep(2)

# ── Test 3: Supervisor acepta hook de PHASE_COMPLETE: exploiter
print("\n[3] PHASE_COMPLETE: exploiter → Supervisor via curl")
msg_exploiter = f"""PHASE_COMPLETE: exploiter
DOMAIN: {TEST_DOMAIN}
TARGET: {TEST_TARGET}
OBJECTIVE_MET: true
SUMMARY: TEST — Objetivo conseguido. IDOR explotado en /api/users/2."""

status, body = curl_hook(SUPERVISOR_URL, HOOKS_TOKEN, msg_exploiter)
check(
    "Supervisor acepta PHASE_COMPLETE:exploiter con 2xx",
    status.startswith("2"),
    f"got HTTP {status}, body={str(body)[:200]}"
)
check(
    "Supervisor devuelve runId para PHASE_COMPLETE:exploiter",
    bool(body.get("runId")),
    str(body)[:200]
)

time.sleep(2)

# ── Test 4: delegate.py puede enviar PHASE_COMPLETE a supervisor
print("\n[4] delegate.py → PHASE_COMPLETE:explorer")
data = delegate("supervisor", f"""PHASE_COMPLETE: explorer
DOMAIN: {TEST_DOMAIN}
TARGET: {TEST_TARGET}
FINDINGS_COUNT: 3
SUMMARY: TEST via delegate.py — ignore this""")

check(
    "delegate.py devuelve status=sent para PHASE_COMPLETE",
    data.get("status") == "sent",
    str(data)[:200]
)
check(
    "delegate.py devuelve runId",
    bool(data.get("runId")),
    str(data)[:200]
)

time.sleep(2)

# ── Test 5: Supervisor rechaza PHASE_COMPLETE con token incorrecto
print("\n[5] PHASE_COMPLETE con token incorrecto → debe dar 401")
status_bad, _ = curl_hook(SUPERVISOR_URL, "wrong-token", msg_explorer)
check(
    "Supervisor rechaza PHASE_COMPLETE con token incorrecto (401)",
    status_bad == "401",
    f"got HTTP {status_bad}"
)

# ── Resultado
print(f"\n{'─'*40}")
if errors:
    print(f"FALLOS ({len(errors)}):")
    for e in errors:
        print(f"  ✗  {e}")
    sys.exit(1)
else:
    print("Todos los tests de pipeline pasaron ✅")
