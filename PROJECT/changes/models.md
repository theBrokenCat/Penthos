# Cambios de Modelo LLM

## 2026-03-15 — Modelo inicial: claude-opus-4-6

**Qué:** Todos los agentes usaban `claude-opus-4-6` por defecto (default de OpenClaw)
**Por qué:** Configuración inicial, no se cambió explícitamente
**Efecto:** Funcional pero muy costoso (~$15/MTok input, ~$75/MTok output)
**Archivos:** Ninguno — era el default de OpenClaw

---

## 2026-03-16 — Cambio a claude-haiku-4-5-20251001

**Qué:** Cambiado de `claude-opus-4-6` a `claude-haiku-4-5-20251001` en los 4 agentes
**Por qué:** El usuario detectó en la facturación que se estaba usando Opus. Haiku es ~20x más barato.
**Efecto:** Coste reducido drásticamente. Rate limits siguen siendo un problema en tier bajo de API.
**Config key:** `agents.defaults.model.primary` en cada `openclaw.json`
**Archivos:**
- `pentester/config/supervisor.json`
- `pentester/config/explorer.json`
- `pentester/config/analyst.json`
- `pentester/config/exploiter.json`

---

## 2026-03-16 — [REVERTIDO PARCIALMENTE] Intento con google/gemini-2.0-flash

**Qué:** Se intentó migrar a `google/gemini-2.0-flash` para evitar rate limits de Anthropic
**Por qué:** Rate limits constantes con Haiku en tier bajo de API de Anthropic
**Efecto:** No confirmado / revertido en favor de Ollama local
**Estado:** `[REVERTIDO]`

---

## 2026-03-16 — Migración a Ollama local: ollama/qwen3.5:9b

**Qué:** Todos los agentes migrados a `ollama/qwen3.5:9b` con proveedor Ollama local
**Por qué:** Rate limits insostenibles con la API de Anthropic (tier bajo). Ollama local = sin límites, sin coste por llamada.
**Efecto:** Sin rate limits. Latencia depende del hardware local (GPU vs CPU).
**Config añadida:**
```json
"models": {
  "providers": {
    "ollama": {
      "baseUrl": "http://host.docker.internal:11434",
      "models": []
    }
  }
}
```
**Archivos:**
- `pentester/config/supervisor.json`
- `pentester/config/explorer.json`
- `pentester/config/analyst.json`
- `pentester/config/exploiter.json`

**Notas:**
- El modelo corre en el Mac host, los contenedores acceden vía `host.docker.internal:11434`
- Alternativas guardadas en config: `claude-haiku-4-5-20251001` / `google/gemini-2.0-flash`
- Pendiente verificar si corre en GPU o CPU (`ollama ps` en terminal del Mac)

---

## 2026-03-16 — Cambio a ollama/llama3.1:8b

**Qué:** Cambiado de `ollama/qwen3.5:9b` a `ollama/llama3.1:8b` en los 4 agentes
**Por qué:** `qwen3.5:9b` no seguía el flujo definido en los SOUL.md — alucinaba vulnerabilidades de Juice Shop basándose en su conocimiento de entrenamiento en lugar de datos reales de ZAP, y no ejecutaba `store_finding_in_vector_db` correctamente. `llama3.1:8b` tiene mejor reputación para seguir instrucciones en tareas agénticas.
**Efecto:** Tool calling inconsistente — el Explorer funcionó en un caso pero el Analyst nunca ejecutó skills via Exec correctamente
**Archivos:** Los 4 `pentester/config/*.json`

---

## 2026-03-16 — Cambio a ollama/qwen2.5:7b

**Qué:** Cambiado de `ollama/llama3.1:8b` a `ollama/qwen2.5:7b` en los 4 agentes
**Por qué:** `llama3.1:8b` es inconsistente con tool calling en Ollama — a veces pone el tool call en `message.content` (texto) en lugar de `message.tool_calls` (estructura API). `qwen2.5:7b` tiene soporte de function calling más fiable con la API OpenAI-compatible de Ollama.
**Efecto:** Pendiente de verificar
**Archivos:** Los 4 `pentester/config/*.json`

---

## 2026-03-16 — Vuelta a claude-haiku-4-5-20251001 (desde Ollama)

**Qué:** Todos los agentes vuelven a `claude-haiku-4-5-20251001`. Se eliminan todos los bloques específicos de Ollama de los configs.
**Por qué:** Ningún modelo Ollama probado (`qwen3.5:9b`, `llama3.1:8b`, `qwen2.5:7b`) ejecutó las skills de forma fiable — o alucinaban, o ponían el tool call como texto en lugar de usar la API de function calling correctamente.
**Archivos:** Los 4 `pentester/config/*.json`

### Config completa de Ollama para recuperar en el futuro

Si vuelves a Ollama, estos son todos los bloques que hay que añadir a cada `openclaw.json`:

**1. Provider (al mismo nivel que `agents`):**
```json
"models": {
  "providers": {
    "ollama": {
      "baseUrl": "http://host.docker.internal:11434",
      "models": []
    }
  }
}
```

**2. Modelo + streaming fix (dentro de `agents.defaults`):**
```json
"model": {
  "primary": "ollama/NOMBRE_MODELO"
},
"models": {
  "ollama/NOMBRE_MODELO": {
    "streaming": false
  }
}
```
> ⚠️ `streaming: false` es **obligatorio** para Ollama. Sin esto, el tool calling falla (SDK issue #1205 de OpenClaw) — el modelo genera el JSON del tool call pero no se ejecuta.

**3. Workarounds para modelos lentos (dentro de `agents.defaults`):**
```json
"timeoutSeconds": 1800,
"subagents": {
  "maxSpawnDepth": 1,
  "runTimeoutSeconds": 120
}
```
> `timeoutSeconds: 1800` evita que OpenClaw mate al agente por timeout (modelos locales son lentos).
> `subagents.runTimeoutSeconds: 120` evita que el agente se quede bloqueado si el modelo lanza un `Sessions Spawn` innecesario.

**Modelos probados y resultado:**
| Modelo | Resultado |
|--------|-----------|
| `ollama/qwen3.5:9b` | Alucinaba vulnerabilidades. No usaba skills correctamente. |
| `ollama/llama3.1:8b` | Tool calling inconsistente. A veces funcionaba, a veces no. |
| `ollama/qwen2.5:7b` | No llegó a probarse en producción (agente no respondía). |

**Recomendación futura:** Antes de volver a Ollama, probar `qwen2.5:14b` o `hermes3:8b` — tienen mejor soporte de function calling que los modelos de 7-9B probados.
