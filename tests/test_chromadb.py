#!/usr/bin/env python3
"""
test_chromadb.py — Verifica las operaciones de ChromaDB:
  - store_finding_in_vector_db
  - query_attack_surface (con y sin --url-filter)
  - wait_for_findings (detecta nuevos hallazgos correctamente)
  - clear_target_data (limpia por dominio)
"""

import json
import os
import subprocess
import sys
import time
import uuid

STORE  = "/app/pentester/skills/store_finding_in_vector_db/scripts/store.py"
QUERY  = "/app/pentester/skills/query_attack_surface/scripts/query.py"
WAIT   = "/app/pentester/skills/query_attack_surface/scripts/wait_for_findings.py"
CLEAR  = "/app/pentester/skills/clear_target_data/scripts/clear_target.py"

TEST_DOMAIN = f"test-{uuid.uuid4().hex[:8]}.example.com"
TEST_URL    = f"https://{TEST_DOMAIN}/test-path"

errors = []

def run(cmd):
    """Run a command and return the parsed JSON output.
    wait_for_findings.py emits multiple JSON objects (a progress line first,
    then the final result). We use JSONDecoder.raw_decode to consume all JSON
    objects from stdout and return the LAST one.
    """
    r = subprocess.run(cmd, capture_output=True, text=True)
    decoder = json.JSONDecoder()
    last_obj = None
    pos = 0
    text = r.stdout
    while pos < len(text):
        # Skip non-JSON characters (whitespace, progress lines like "Round N/M: ...")
        if text[pos] == '{':
            try:
                obj, end = decoder.raw_decode(text, pos)
                last_obj = obj
                pos = end
            except json.JSONDecodeError:
                pos += 1
        else:
            pos += 1
    if last_obj is not None:
        return last_obj
    return {"_raw_stdout": r.stdout, "_stderr": r.stderr, "_returncode": r.returncode}

def check(label, condition, detail=""):
    if condition:
        print(f"  ✓  {label}")
    else:
        print(f"  ✗  {label}" + (f" — {detail}" if detail else ""))
        errors.append(label)

# ── 1. Limpiar dominio de test (por si quedaron datos de ejecuciones anteriores)
print("\n[1] Limpieza inicial")
r = run(["python3", CLEAR, "--domain", TEST_DOMAIN])
check("clear inicial ejecuta sin error", r.get("status") == "ok", str(r))

# ── 2. Guardar un finding de prueba
print("\n[2] store_finding_in_vector_db")
r = run([
    "python3", STORE,
    "--type", "note",
    "--title", f"Test finding {TEST_DOMAIN}",
    "--description", "Hallazgo de prueba generado por test_chromadb.py",
    "--url", TEST_URL,
    "--severity", "info",
    "--agent", "test",
    "--tags", "test,automated",
])
check("store devuelve status=ok", r.get("status") == "ok", str(r))
stored_id = r.get("id", "")
check("store devuelve un ID de finding", bool(stored_id), str(r))

# ── 3. Query con --url-filter (debe encontrar el finding)
print("\n[3] query_attack_surface con --url-filter")
r = run(["python3", QUERY, "--url-filter", TEST_DOMAIN, "--all", "--limit", "10"])
check("query con url-filter devuelve status=ok", r.get("status") == "ok", str(r))
returned = r.get("returned", 0)
check(f"query encuentra ≥1 finding para {TEST_DOMAIN}", returned >= 1, f"returned={returned}")
if returned >= 1:
    titles = [f.get("title", "") for f in r.get("results", [])]
    check("el finding guardado aparece en los resultados", any(TEST_DOMAIN in t for t in titles), str(titles))

# ── 4. Query SIN url-filter (debe encontrar ≥1 finding en total)
print("\n[4] query_attack_surface sin --url-filter")
r_all = run(["python3", QUERY, "--all", "--limit", "5"])
check("query sin filtro devuelve status=ok", r_all.get("status") == "ok", str(r_all))
check("hay ≥1 finding en la DB", r_all.get("total_in_db", 0) >= 1)

# ── 5. wait_for_findings — ya hay 1 finding, before=0 → debe detectar inmediatamente
print("\n[5] wait_for_findings (before=0, debería detectar el finding existente)")
r = run([
    "python3", WAIT,
    "--domain", TEST_DOMAIN,
    "--before", "0",
    "--timeout", "30",
    "--interval", "5",
])
check("wait_for_findings devuelve new_findings", r.get("status") == "new_findings", str(r))
check("wait_for_findings reporta ≥1 nuevo finding", r.get("new", 0) >= 1, str(r))

# ── 6. wait_for_findings — before=returned → debería hacer timeout rápido (30s)
print("\n[6] wait_for_findings timeout (before=N, no hay findings nuevos)")
current_count = run(["python3", QUERY, "--url-filter", TEST_DOMAIN, "--all", "--limit", "100"])
before_n = current_count.get("returned", 1)
t0 = time.time()
r = run([
    "python3", WAIT,
    "--domain", TEST_DOMAIN,
    "--before", str(before_n),
    "--timeout", "10",
    "--interval", "5",
])
elapsed = time.time() - t0
check("wait_for_findings timeout devuelve status=timeout", r.get("status") == "timeout", str(r))
check(f"timeout ocurrió en ≈10s (elapsed={elapsed:.1f}s)", elapsed >= 8, f"elapsed={elapsed:.1f}s")

# ── 7. Guardar segundo finding y verificar wait_for_findings lo detecta
print("\n[7] wait_for_findings detecta finding añadido dinámicamente")
before_n2 = run(["python3", QUERY, "--url-filter", TEST_DOMAIN, "--all", "--limit", "100"]).get("returned", 0)

# Guardar el segundo finding en un hilo separado con delay
def store_after_delay():
    time.sleep(3)
    subprocess.run([
        "python3", STORE,
        "--type", "endpoint",
        "--title", f"Endpoint test {TEST_DOMAIN}",
        "--description", "Segundo hallazgo de prueba",
        "--url", f"{TEST_URL}/api/test",
        "--severity", "info",
        "--agent", "test",
    ], capture_output=True)

import threading
t = threading.Thread(target=store_after_delay)
t.start()

r = run([
    "python3", WAIT,
    "--domain", TEST_DOMAIN,
    "--before", str(before_n2),
    "--timeout", "30",
    "--interval", "5",
])
t.join()
check("wait_for_findings detecta finding añadido a los ~3s", r.get("status") == "new_findings", str(r))
check("wait_for_findings reporta el finding nuevo", r.get("new", 0) >= 1, str(r))

# ── 8. clear_target_data limpia los findings del dominio de test
print("\n[8] clear_target_data")
r = run(["python3", CLEAR, "--domain", TEST_DOMAIN])
check("clear devuelve status=ok", r.get("status") == "ok", str(r))
deleted = r.get("findings_deleted", 0)
check(f"clear elimina ≥2 findings (deleted={deleted})", deleted >= 2, str(r))

# Verificar que realmente se eliminaron
r_post = run(["python3", QUERY, "--url-filter", TEST_DOMAIN, "--all", "--limit", "10"])
check("después del clear el dominio no tiene findings", r_post.get("returned", 0) == 0, str(r_post))

# ── Resultado final
print(f"\n{'─'*40}")
if errors:
    print(f"FALLOS ({len(errors)}):")
    for e in errors:
        print(f"  ✗  {e}")
    sys.exit(1)
else:
    print("Todos los tests de ChromaDB pasaron ✅")
