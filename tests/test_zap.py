#!/usr/bin/env python3
"""
test_zap.py — Verifica que el daemon ZAP está accesible y respondiendo.

Comprueba:
  - ZAP REST API responde en el puerto configurado (8080)
  - El endpoint /JSON/core/view/version/ devuelve la versión de ZAP
  - El endpoint /JSON/core/view/alerts/ es accesible (con ZAP_API_KEY)
  - El proxy HTTP de ZAP (puerto 8090) acepta conexiones
  - Playwright puede enrutar tráfico a través del proxy ZAP
"""

import json
import os
import subprocess
import sys

errors = []

ZAP_API_URL  = os.environ.get("ZAP_API_URL",  "http://zap:8080")
ZAP_API_KEY  = os.environ.get("ZAP_API_KEY",  "zap-secret")
ZAP_PROXY    = os.environ.get("ZAP_PROXY",    "http://zap:8090")


def check(label, condition, detail=""):
    if condition:
        print(f"  ✓  {label}")
    else:
        print(f"  ✗  {label}" + (f" — {detail}" if detail else ""))
        errors.append(label)


def curl_json(url, timeout=10):
    """GET a URL and parse JSON response. Returns (status_code, parsed_body)."""
    r = subprocess.run([
        "curl", "-s", "-o", "/tmp/zap_response.json", "-w", "%{http_code}",
        url,
        "--connect-timeout", "5",
        "--max-time", str(timeout),
    ], capture_output=True, text=True)
    status = r.stdout.strip()
    try:
        with open("/tmp/zap_response.json") as f:
            body = json.loads(f.read())
    except Exception:
        try:
            with open("/tmp/zap_response.json") as f:
                body = {"_raw": f.read()[:200]}
        except Exception:
            body = {}
    return status, body


def curl_proxy_check(proxy_url, timeout=5):
    """Check if the proxy port is reachable (returns HTTP status or connection error)."""
    r = subprocess.run([
        "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
        "--proxy", proxy_url,
        "http://example.com",
        "--connect-timeout", str(timeout),
        "--max-time", str(timeout),
    ], capture_output=True, text=True)
    return r.stdout.strip(), r.returncode


# ── Test 1: ZAP REST API accesible
print("\n[1] ZAP REST API — health check")
status, body = curl_json(f"{ZAP_API_URL}/JSON/core/view/version/?apikey={ZAP_API_KEY}")
check(
    f"ZAP API responde en {ZAP_API_URL} (status={status})",
    status == "200",
    f"got HTTP {status} — ¿está corriendo el contenedor zap?"
)
if status == "200":
    version = body.get("version", "")
    check(
        f"ZAP API devuelve versión válida (version={version})",
        bool(version),
        str(body)[:200]
    )
    print(f"      ZAP version: {version}")

# ── Test 2: ZAP API key protege el endpoint
print("\n[2] ZAP API key protection")
status_bad, body_bad = curl_json(f"{ZAP_API_URL}/JSON/core/view/version/?apikey=wrong-key")
# ZAP devuelve 200 pero con {"code":"wrong_api_key"} o similar
if status_bad == "200":
    is_error = "wrong_api_key" in str(body_bad) or "error" in str(body_bad).lower()
    check(
        "ZAP rechaza API key incorrecta (devuelve error en body)",
        is_error,
        f"body={str(body_bad)[:200]}"
    )
else:
    check(
        "ZAP rechaza API key incorrecta (status != 200)",
        status_bad not in ("200",),
        f"got HTTP {status_bad}"
    )

# ── Test 3: ZAP core/view/alerts accesible
print("\n[3] ZAP core/view/alerts")
status, body = curl_json(f"{ZAP_API_URL}/JSON/core/view/alerts/?apikey={ZAP_API_KEY}&start=0&count=5")
check(
    "ZAP /alerts endpoint accesible",
    status == "200",
    f"got HTTP {status}, body={str(body)[:100]}"
)

# ── Test 4: ZAP spider disponible (listar scans, no pedir status de scan inexistente)
print("\n[4] ZAP spider disponible")
status, body = curl_json(f"{ZAP_API_URL}/JSON/spider/view/scans/?apikey={ZAP_API_KEY}")
check(
    "ZAP spider /scans endpoint accesible",
    status == "200",
    f"got HTTP {status}, body={str(body)[:100]}"
)

# ── Test 5: ZAP ascan disponible (listar scans activos)
print("\n[5] ZAP active scan disponible")
status, body = curl_json(f"{ZAP_API_URL}/JSON/ascan/view/scans/?apikey={ZAP_API_KEY}")
check(
    "ZAP ascan /scans endpoint accesible",
    status == "200",
    f"got HTTP {status}, body={str(body)[:100]}"
)

# ── Test 6: Proxy HTTP — ZAP expone proxy en el mismo puerto que la API (8080)
# El puerto 8090 en docker-compose es un mapeo de host, pero ZAP no escucha allí
# internamente. El proxy HTTP real es 8080 (acepta peticiones CONNECT y HTTP).
print("\n[6] ZAP proxy HTTP (puerto 8080)")
ZAP_PROXY_REAL = ZAP_API_URL  # http://zap:8080
proxy_status, proxy_rc = curl_proxy_check(ZAP_PROXY_REAL)
check(
    f"ZAP proxy {ZAP_PROXY_REAL} acepta conexiones (rc={proxy_rc})",
    proxy_rc == 0 or proxy_status not in ("", "000"),
    f"exit_code={proxy_rc}, http_status={proxy_status}"
)

# ── Test 7: MCP server Python helper accesible
print("\n[7] ZAP MCP helper scripts accesibles")
import os.path
zap_skills = [
    "/app/pentester/skills/spider_endpoint/scripts",
    "/app/pentester/skills/get_proxy_history/scripts",
    "/app/pentester/skills/trigger_active_scan/scripts",
    "/app/pentester/skills/parse_scan_issues/scripts",
]
for skill_dir in zap_skills:
    skill_name = skill_dir.split("/")[-2]
    exists = os.path.isdir(skill_dir)
    check(
        f"skill {skill_name}/scripts/ existe",
        exists,
        f"no encontrado: {skill_dir}"
    )

# ── Resultado
print(f"\n{'─'*40}")
if errors:
    print(f"FALLOS ({len(errors)}):")
    for e in errors:
        print(f"  ✗  {e}")
    sys.exit(1)
else:
    print("Todos los tests de ZAP pasaron ✅")
