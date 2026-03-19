#!/usr/bin/env python3
"""
test_hooks.py — Verifica que los endpoints de hooks están accesibles en todos los agentes.

Comprueba:
  - Cada agente responde en su puerto con 200/401
  - El endpoint /hooks/agent rechaza tokens incorrectos (401)
  - El endpoint /hooks/agent acepta el HOOKS_TOKEN correcto (200)
  - El Supervisor puede recibir hooks (nuevo en arquitectura event-driven)
"""

import json
import os
import sys
import subprocess

errors = []

AGENTS = {
    "supervisor": ("http://supervisor:3001", os.environ.get("SUPERVISOR_URL", "http://supervisor:3001")),
    "explorer":   ("http://explorer:3002",   os.environ.get("EXPLORER_URL",   "http://explorer:3002")),
    "analyst":    ("http://analyst:3003",    os.environ.get("ANALYST_URL",    "http://analyst:3003")),
    "exploiter":  ("http://exploiter:3004",  os.environ.get("EXPLOITER_URL",  "http://exploiter:3004")),
}
HOOKS_TOKEN = os.environ.get("HOOKS_TOKEN", "hooks-secret")
WRONG_TOKEN = "wrong-token-test"

def check(label, condition, detail=""):
    if condition:
        print(f"  ✓  {label}")
    else:
        print(f"  ✗  {label}" + (f" — {detail}" if detail else ""))
        errors.append(label)

def curl_hook(url, token, message="test"):
    """Sends a hook request and returns (status_code, response_body)."""
    payload = json.dumps({"message": message, "wakeMode": "now", "name": "TestRunner"})
    r = subprocess.run([
        "curl", "-s", "-o", "/tmp/hook_response.json", "-w", "%{http_code}",
        "-X", "POST",
        f"{url}/hooks/agent",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-d", payload,
        "--connect-timeout", "5",
        "--max-time", "10",
    ], capture_output=True, text=True)
    status_code = r.stdout.strip()
    try:
        with open("/tmp/hook_response.json") as f:
            body = f.read()
    except Exception:
        body = ""
    return status_code, body

def curl_health(url):
    """Check if an agent's base URL responds."""
    r = subprocess.run([
        "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
        url,
        "--connect-timeout", "5",
        "--max-time", "10",
    ], capture_output=True, text=True)
    return r.stdout.strip()

# ── Test cada agente
for agent_name, (internal_url, env_url) in AGENTS.items():
    print(f"\n[{agent_name}] {internal_url}")

    # 1. Health check
    status = curl_health(internal_url)
    check(
        f"{agent_name}: responde en {internal_url} (status={status})",
        status in ("200", "401", "403", "404"),
        f"got HTTP {status} — puede que el contenedor no esté corriendo"
    )

    # 2. Hook con token incorrecto → debe dar 401
    status_wrong, body_wrong = curl_hook(internal_url, WRONG_TOKEN, "test_wrong_token")
    check(
        f"{agent_name}: rechaza token incorrecto con 401",
        status_wrong == "401",
        f"got HTTP {status_wrong}, body={body_wrong[:100]}"
    )

    # 3. Hook con token correcto → debe dar 200 o 202
    status_ok, body_ok = curl_hook(
        internal_url,
        HOOKS_TOKEN,
        f"TEST_HOOK from test_hooks.py — ignore this message"
    )
    check(
        f"{agent_name}: acepta HOOKS_TOKEN con 2xx (status={status_ok})",
        status_ok.startswith("2"),
        f"got HTTP {status_ok}, body={body_ok[:200]}"
    )

    # 4. Para el Supervisor, verificar que el runId viene en la respuesta
    if agent_name == "supervisor" and status_ok.startswith("2"):
        try:
            data = json.loads(body_ok)
            has_run_id = bool(data.get("runId"))
            check(
                "supervisor: la respuesta incluye runId",
                has_run_id,
                str(data)
            )
        except Exception as e:
            check("supervisor: respuesta es JSON válido", False, f"{e} — body={body_ok[:100]}")

# ── delegate.py puede enviar a supervisor
print(f"\n[delegate_to_supervisor]")
DELEGATE = "/app/pentester/skills/delegate_to_agent/scripts/delegate.py"
r = subprocess.run([
    "python3", DELEGATE,
    "--agent", "supervisor",
    "--task", "TEST_HOOK via delegate.py — ignore this message",
], capture_output=True, text=True)
try:
    data = json.loads(r.stdout)
    check("delegate.py --agent supervisor devuelve status=sent", data.get("status") == "sent", str(data))
    check("delegate.py devuelve runId", bool(data.get("runId")), str(data))
except Exception as e:
    check("delegate.py --agent supervisor ejecuta sin error", False, f"{e} — stdout={r.stdout[:200]}")

# ── Resultado
print(f"\n{'─'*40}")
if errors:
    print(f"FALLOS ({len(errors)}):")
    for e in errors:
        print(f"  ✗  {e}")
    sys.exit(1)
else:
    print("Todos los tests de hooks pasaron ✅")
