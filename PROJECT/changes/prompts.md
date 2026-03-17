# Cambios de Prompts (SOUL.md de Agentes)

## 2026-03-16 — Explorer SOUL.md: fix proxy 8090 → 8080

**Qué:** Cambiadas las referencias a `http://zap:8090` por `http://zap:8080` en las instrucciones del spider y fingerprinting
**Por qué:** ZAP no escucha en 8090. El Explorer enrutaba tráfico a un puerto vacío y ZAP no capturaba nada.
**Efecto:** El tráfico del spider pasa por ZAP correctamente y aparece en el historial del Analyst
**Archivos:** `pentester/agents/explorer/SOUL.md`

---

## 2026-03-16 — Supervisor SOUL.md: fix proxy 8090 → 8080

**Qué:** Cambiada referencia a `http://zap:8090` en las instrucciones del flujo de reconocimiento
**Por qué:** Consistencia con el fix del Explorer. El Supervisor coordina los agentes y sus instrucciones deben tener el puerto correcto.
**Archivos:** `pentester/agents/supervisor/SOUL.md`

---

## 2026-03-16 — Explorer SOUL.md: reducido max-pages 50 → 20

**Qué:** Cambiado `--max-pages 50` por `--max-pages 20` y `--depth 3` por `--depth 2` en el comando del spider
**Por qué:** Con `qwen3.5:9b` local, el output del spider de 50 páginas (~400KB de JSON) tardaba más de 10 minutos en ser procesado por el modelo → timeout de OpenClaw.
**Efecto:** Spider más rápido (~2-3 min). Menos cobertura de superficie pero respuesta dentro del timeout.
**Archivos:** `pentester/agents/explorer/SOUL.md`

---

## 2026-03-16 — Explorer/Analyst/Exploiter SOUL.md: prohibido Sessions Spawn para skills

**Qué:** Añadida regla crítica en el bloque `# REGLAS` de los 3 agentes operativos:
```
CRÍTICO: Ejecuta las skills SIEMPRE con `Exec` directamente.
NUNCA uses `Sessions Spawn` para ejecutar skills — las skills son
herramientas locales, no sub-agentes.
```
**Por qué:** `qwen3.5:9b` a veces decide lanzar un `Sessions Spawn` para ejecutar skills en lugar de usar `Exec`. El agente padre se queda bloqueado esperando al sub-agente indefinidamente (sin timeout).
**Efecto:** El modelo recibe instrucción explícita de usar la ruta directa. Combinado con `subagents.runTimeoutSeconds: 120` en config para el caso de que lo ignore.
**Archivos:**
- `pentester/agents/explorer/SOUL.md`
- `pentester/agents/analyst/SOUL.md`
- `pentester/agents/exploiter/SOUL.md`
