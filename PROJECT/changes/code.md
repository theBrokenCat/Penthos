# Cambios de Código (Skills y MCP Server)

## 2026-03-16 — Fix count=0 en zap_history.py

**Qué:** Cambiado `"count": "0"` por `"count": "2000"` y eliminado `baseurl` cuando no hay filtro
```python
# ANTES
data = zap_get(zap_url, api_key, "/JSON/core/view/messages/", {
    "baseurl": filter_url or "",
    "start": "0",
    "count": "0",  # 0 = all (INCORRECTO en ZAP moderno)
})

# DESPUÉS
params = {"start": "0", "count": "2000"}
if filter_url:
    params["baseurl"] = filter_url
data = zap_get(zap_url, api_key, "/JSON/core/view/messages/", params)
```
**Por qué:** ZAP interpretaba `count=0` literalmente (devuelve 0 mensajes). El Analyst veía historial vacío aunque el Explorer había capturado tráfico.
**Efecto:** ZAP devuelve hasta 2000 mensajes correctamente
**Archivos:** `pentester/skills/get_proxy_history/scripts/zap_history.py`

---

## 2026-03-16 — Fix open redirect en spider.py (bloqueo de red)

**Qué:** Añadido interceptor de red en Playwright para bloquear requests fuera de scope antes de que se resuelvan:
```python
async def block_out_of_scope(route):
    if not in_scope(route.request.url, scope):
        await route.abort()
    else:
        await route.continue_()
await page.route("**/*", block_out_of_scope)
```
**Por qué:** `page.goto()` sigue redirecciones HTTP antes de que el código pueda verificar el scope. Juice Shop tiene `/redirect?to=https://github.com` → el spider acababa indexando GitHub.
**Efecto:** El spider nunca sale del dominio objetivo, aunque haya open redirects
**Archivos:** `pentester/skills/spider_endpoint/scripts/spider.py`

---

## 2026-03-16 — Creado MCP server ZAP (pentester/mcp/)

**Qué:** Nuevo servidor MCP TypeScript que expone la REST API de ZAP como herramientas nativas para los agentes. 10 herramientas:
- `zap_spider_start/status/results`
- `zap_active_scan_start/status`
- `zap_get_alerts` (filtrable por riesgo)
- `zap_get_messages/message`
- `zap_send_request`
- `zap_status`

**Por qué:** Las skills Python son funcionales pero el MCP permite que el agente use ZAP como herramienta nativa sin scripts intermedios, con mejor integración y control de errores.
**Efecto:** Pendiente — requiere `docker-compose up --build` para compilar `dist/`
**Estado:** Código escrito, `dist/` aún no compilado en imagen Docker actual
**Archivos:**
- `pentester/mcp/src/index.ts` (nuevo)
- `pentester/mcp/package.json` (nuevo)
- `pentester/mcp/tsconfig.json` (nuevo)

---

## 2026-03-16 — Fix trigger_scan.py: API key null + URL_NOT_FOUND

**Qué:** Dos fixes en `pentester/skills/trigger_active_scan/scripts/trigger_scan.py`:

**Fix 1 — API key null:**
```python
# ANTES
api_key = args.api_key or os.environ.get("ZAP_API_KEY", "")
# DESPUÉS
api_key = args.api_key or os.environ.get("ZAP_API_KEY", "changeme")
```

**Fix 2 — Spider automático antes del scan activo:**
```python
def zap_spider_and_wait(zap_url, api_key, target_url, timeout=120):
    """Run ZAP's built-in spider to populate the sites tree."""
    data = zap_post(zap_url, api_key, "/JSON/spider/action/scan/", {
        "url": target_url, "maxChildren": "20", "recurse": "true",
    })
    spider_id = data.get("scan", "0")
    elapsed = 0
    while elapsed < timeout:
        status = zap_get(zap_url, api_key, "/JSON/spider/view/status/", {"scanId": spider_id})
        if int(status.get("status", 0)) >= 100:
            break
        time.sleep(5); elapsed += 5
    return spider_id

# En main(), antes de start_active_scan():
try:
    zap_spider_and_wait(zap_url, api_key, args.url)
except Exception:
    pass  # Non-fatal
```

**Por qué:**
- ZAP devolvía `null api key` porque el default era `""` (string vacío), no `"changeme"`
- ZAP devolvía `URL_NOT_FOUND (400)` porque tras un restart su árbol de sitios está vacío. El scan activo requiere que la URL exista en el árbol de sitios previamente.

**Efecto:** El script hace spider automático, lo que también actualiza `SKILL.md` (ya no hace falta ejecutar `spider_endpoint` manualmente antes del active scan)
**Archivos:** `pentester/skills/trigger_active_scan/scripts/trigger_scan.py`, `pentester/skills/trigger_active_scan/SKILL.md`

---

## 2026-03-16 — Reemplazo global de 8090 → 8080 en skills

**Qué:** Reemplazadas todas las referencias a `http://zap:8090` por `http://zap:8080` en todos los SKILL.md y scripts Python
**Por qué:** ZAP solo escucha en el puerto 8080 (tanto API como proxy). Las instrucciones con 8090 hacían que los agentes intentaran conectar a un puerto sin listener.
**Afecta a:** `spider_endpoint`, `analyze_tech_stack`, `extract_js_secrets`, `get_proxy_history`, `trigger_active_scan`, `replay_modified_request`, `fuzz_parameters`, `test_auth_bypass`, `bypass_client_controls`
**Archivos:** Todos los `SKILL.md` y scripts `.py` en `pentester/skills/`
