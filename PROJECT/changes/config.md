# Cambios de Configuración de Agentes

## 2026-03-15 — Eliminada key `workspace` de openclaw.json

**Qué:** Eliminado el bloque `"workspace": {...}` de los 4 `openclaw.json`
**Por qué:** OpenClaw devolvía `Invalid config: Unrecognized key: "workspace"` y los agentes no arrancaban
**Efecto:** Agentes arrancan correctamente
**Archivos:** Los 4 `pentester/config/*.json`

---

## 2026-03-15 — Token unificado OPENCLAW_GATEWAY_TOKEN

**Qué:** Cambiado `OPENCLAW_GATEWAY_TOKEN` a valor unificado `${OPENCLAW_GATEWAY_TOKEN:-pentester}` en todos los agentes
**Por qué:** Tokens distintos impedían la comunicación entre agentes
**Efecto:** Los agentes pueden comunicarse entre sí vía ACP
**Archivos:** `docker-compose.yml` (raíz)

---

## 2026-03-16 — Añadido maxConcurrent, contextTokens, contextPruning

**Qué:** Añadidos parámetros de control de recursos al bloque `agents.defaults` de los 4 agentes:
```json
"maxConcurrent": 1,
"contextTokens": 40000,
"contextPruning": { "mode": "cache-ttl", "keepLastAssistants": 6 }
```
**Por qué:** Rate limits de Anthropic por ráfagas de requests paralelas y contextos demasiado largos
**Efecto:** Una request activa por agente, contexto limitado a 40k tokens
**Archivos:** Los 4 `pentester/config/*.json`

---

## 2026-03-16 — [FALLIDO] mcpServers como key raíz

**Qué:** Añadido `"mcpServers": { "zap": {...} }` como key de primer nivel en `analyst.json` y `exploiter.json`
**Por qué:** Intentando conectar el MCP server de ZAP a los agentes
**Efecto:** `Invalid config: Unrecognized key: "mcpServers"` — OpenClaw no acepta esta key en raíz
**Estado:** `[FALLIDO Y REVERTIDO]`

---

## 2026-03-16 — mcpServers bajo plugins.entries.acpx.config

**Qué:** Añadido bloque MCP server bajo la key correcta descubierta en el código fuente de OpenClaw:
```json
"plugins": {
  "entries": {
    "acpx": {
      "config": {
        "mcpServers": {
          "zap": {
            "command": "node",
            "args": ["/app/pentester/mcp/dist/index.js"],
            "env": { "ZAP_BASE_URL": "http://zap:8080", "ZAP_API_KEY": "changeme" }
          }
        }
      }
    }
  }
}
```
**Por qué:** La key correcta está en `extensions/acpx/src/config.ts` del código fuente de OpenClaw
**Efecto:** Config válida — pendiente de confirmar que el MCP server funciona (requiere `dist/` compilado)
**Archivos:** `pentester/config/analyst.json`, `pentester/config/exploiter.json`

---

## 2026-03-16 — Reducción contextTokens a 20000 + timeoutSeconds 1800

**Qué:** Reducido `contextTokens` de 40000 a 20000 y añadido `timeoutSeconds: 1800` en explorer, analyst, exploiter
**Por qué:** `qwen3.5:9b` tardaba más de 10 minutos procesando el output del spider (timeout de 600s por defecto)
**Efecto:** El modelo tiene menos tokens que procesar por llamada y 30 minutos de timeout en lugar de 10
**Archivos:** `pentester/config/explorer.json`, `pentester/config/analyst.json`, `pentester/config/exploiter.json`

---

## 2026-03-16 — streaming: false para Ollama (fix tool calling)

**Qué:** Añadido `agents.defaults.models["ollama/llama3.1:8b"] = { "streaming": false }` en los 4 agentes
**Por qué:** El código fuente de OpenClaw documenta explícitamente: *"false for Ollama to avoid SDK issue #1205"*. Con streaming activo, el mecanismo de tool calling de Ollama falla — el modelo genera el JSON del tool call pero OpenClaw no lo ejecuta (aparece como texto en lugar de disparar el `Exec`). Detectado con `llama3.1:8b` pero aplica a cualquier modelo Ollama.
**Efecto:** Los tool calls de los agentes se procesan correctamente y las skills se ejecutan vía `Exec`
**Archivos:** Los 4 `pentester/config/*.json`

---

## 2026-03-16 — Añadido subagents.runTimeoutSeconds: 120

**Qué:** Añadido `"subagents": { "maxSpawnDepth": 1, "runTimeoutSeconds": 120 }` en explorer, analyst, exploiter
**Por qué:** `qwen3.5:9b` a veces lanza `Sessions Spawn` para ejecutar skills, quedándose el agente padre bloqueado indefinidamente esperando al sub-agente
**Efecto:** Si un sub-agente no responde en 2 minutos, se mata automáticamente
**Archivos:** `pentester/config/explorer.json`, `pentester/config/analyst.json`, `pentester/config/exploiter.json`
