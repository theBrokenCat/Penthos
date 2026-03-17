# Spec 08 — Monitor de Agentes

## Propósito

Pantalla en tiempo real para ver qué están haciendo los 4 agentes del sistema. Permite detectar errores, ver qué tarea están ejecutando, cuántos hallazgos han encontrado y, para admins, controlar su ciclo de vida.

Ruta: `/agents`

---

## Layout de la pantalla

### Grid 2×2 de tarjetas de agente

```
┌─────────────────────────┬─────────────────────────┐
│  🧠 SUPERVISOR           │  🕷️ EXPLORER             │
│  ● Online                │  🔄 Busy                 │
│  Puerto 3001             │  Puerto 3002             │
│                          │                          │
│  Coordinando:            │  Crawling:               │
│  "Juice Shop v2"         │  /rest/products/search   │
│                          │                          │
│  Findings: 0             │  Findings: 23            │
│  Uptime: 2h 14m          │  Uptime: 2h 14m          │
│  Modelo: haiku-4-5       │  Modelo: haiku-4-5       │
│                          │                          │
│  [Ping]  [Ver logs]      │  [Ping]  [Ver logs]      │
└─────────────────────────┴─────────────────────────┘
┌─────────────────────────┬─────────────────────────┐
│  🔬 ANALYST              │  💥 EXPLOITER            │
│  ● Online                │  ○ Offline               │
│  Puerto 3003             │  Puerto 3004             │
│                          │                          │
│  En espera de Explorer   │  Sin tarea activa        │
│                          │                          │
│  Findings: 8             │  Findings: 3             │
│  Uptime: 2h 14m          │  Uptime: —               │
│  Modelo: haiku-4-5       │  Modelo: haiku-4-5       │
│                          │                          │
│  [Ping]  [Ver logs]      │  [Iniciar]  [Ver logs]   │
└─────────────────────────┴─────────────────────────┘
```

### Indicadores de estado

| Estado | Color | Animación | Significado |
|---|---|---|---|
| Online | 🟢 Verde | — | Disponible y en espera |
| Busy | 🔵 Azul | Pulso | Ejecutando una tarea |
| Offline | ⚪ Gris | — | No iniciado / detenido |
| Error | 🔴 Rojo | Parpadeo | Error / no responde |
| Starting | 🟡 Amarillo | Giro | Iniciando |

---

## Panel de logs en tiempo real

Al hacer click en "Ver logs" se abre un panel lateral (drawer):

```
┌─────────────────────────────────────────────────────┐
│  🕷️ Explorer — Logs en tiempo real                   │
│  ────────────────────────────────────────────────── │
│  [Limpiar]  [Pausar]  [Descargar]                   │
│  ────────────────────────────────────────────────── │
│  17:45:02  INFO   Crawling /rest/products/search    │
│  17:45:03  DEBUG  Found link: /rest/categories      │
│  17:45:05  INFO   New endpoint stored: POST /api/   │
│  17:45:06  INFO   JS file analyzed: main.bundle.js  │
│  17:45:08  WARN   Scope check: /external.com skipped│
│  17:45:10  INFO   Crawling complete: 47 endpoints   │
│  ────────────────────────────────────────────────── │
│  [Cerrar]                                           │
└─────────────────────────────────────────────────────┘
```

- Scroll automático al último log
- Filtro por nivel: `DEBUG | INFO | WARN | ERROR`
- Resaltado de color por nivel
- Máximo 500 líneas en memoria (scroll infinito)

---

## Sección: Métricas del sistema

Debajo de las tarjetas, una barra de métricas globales:

```
ChromaDB: ● Online · 156 findings · 3 colecciones
ZAP:      ● Online · Puerto 8080 · último scan hace 5min
interactsh: ● Online · 0 callbacks pendientes
```

---

## Sección: Historial de tareas (últimas 24h)

Tabla con las tareas ejecutadas por los agentes:

```
Hora     Agente      Tarea                       Duración  Estado
17:45    Explorer    Spider /rest/products        2m 13s    ✅
17:42    Analyst     Active scan /api/*           8m 44s    ✅
17:38    Exploiter   SQLi test /rest/products     1m 55s    ✅ (HITL)
17:30    Supervisor  Init "Juice Shop v2"         0s        ✅
```

---

## Controles de agentes (solo admin)

Cada tarjeta de agente incluye:

**Si está Offline:**
- Botón "Iniciar" → llama a `POST /api/agents/:name/start`
- Confirmar: "¿Iniciar el agente Explorer?"

**Si está Online/Busy:**
- Botón "Reiniciar" → llama a `POST /api/agents/:name/restart`
- Botón "Detener" → llama a `POST /api/agents/:name/stop` (requiere confirmación)

**Todos:**
- Botón "Ping" → verifica que el agente responde (timeout 5s)
- Botón "Cambiar modelo" → modal para cambiar modelo LLM del agente

---

## Implementación técnica — Server-Sent Events

```typescript
// GET /api/sse/agents
// Emite estado de todos los agentes cada 3 segundos

export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const interval = setInterval(async () => {
        const status = await getAgentsStatus() // ping a puertos 3001-3004
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(status)}\n\n`)
        )
      }, 3000)

      // Limpiar al desconectar
      return () => clearInterval(interval)
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  })
}
```

```typescript
// Componente cliente
"use client"
useEffect(() => {
  const sse = new EventSource("/api/sse/agents")
  sse.onmessage = (e) => setAgentsStatus(JSON.parse(e.data))
  return () => sse.close()
}, [])
```

---

## Comprobación de salud de los agentes

El API verifica el estado pingSando el OpenClaw gateway:

```typescript
async function getAgentHealth(agentName: string, port: number) {
  try {
    const res = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(2000)
    })
    const data = await res.json()
    return { status: "online", ...data }
  } catch {
    return { status: "offline" }
  }
}
```
