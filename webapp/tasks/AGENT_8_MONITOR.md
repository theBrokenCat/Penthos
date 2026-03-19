# AGENT_8_MONITOR — Monitor de Agentes en Tiempo Real

## Misión
Implementar la pantalla `/agents` con el estado en tiempo real de los 4 agentes del sistema, panel de logs, métricas del sistema (ZAP, ChromaDB, interactsh) e historial de tareas.

## Prerrequisitos
- AGENT_2_BACKEND ✅ (rutas /api/agents/*, /api/sse/agents)
- AGENT_3_FRONTEND ✅ (layout y componentes base)
- Leer: `webapp/specs/08_AGENTS_MONITOR.md`

## Entregables

### 1. Página monitor (`src/app/(dashboard)/agents/page.tsx`)
Client Component (necesita SSE). Layout:
- Grid 2×2 de tarjetas de agente
- Barra de métricas del sistema
- Historial de tareas

Conectar al SSE al montar el componente:
```typescript
useEffect(() => {
  const sse = new EventSource("/api/sse/agents")
  sse.onmessage = (e) => {
    const data = JSON.parse(e.data)
    setAgentsStatus(data)
  }
  sse.onerror = () => {
    setConnectionError(true)
    sse.close()
  }
  return () => sse.close()
}, [])
```

Mostrar banner de "Conexión perdida - reintentando..." si el SSE falla.

### 2. Componente `<AgentCard>` (`src/components/agents/AgentCard.tsx`)
```typescript
interface AgentCardProps {
  name: AgentName
  emoji: string
  port: number
  status: AgentStatus
  currentTask?: string
  currentAuditId?: string
  currentAuditName?: string
  findingsCount: number
  uptime?: number         // segundos
  model: string
  lastActivityAt?: Date
  isAdmin: boolean
}
```

**Visual de la card:**
- Header: emoji + nombre + badge de estado (con animación si "busy")
- Puerto: badge zinc pequeño
- Tarea actual: texto truncado (si es larga, tooltip completo)
- Auditoría actual: link clickable → `/audits/[id]`
- Métricas: "N findings · Activo X horas"
- Modelo: badge pequeño con el nombre
- Footer con botones de control

**Botones según estado (solo si isAdmin):**
- Offline → `[Iniciar]`
- Online/Busy → `[Reiniciar]` `[Detener]`
- Error → `[Reiniciar]`
- Todos → `[Ping]` `[Ver logs]`

**Confirmación antes de Detener:**
```typescript
<AlertDialog>
  <AlertDialogTrigger>Detener</AlertDialogTrigger>
  <AlertDialogContent>
    ¿Detener el agente Explorer? Las tareas en curso se interrumpirán.
    <AlertDialogAction>Confirmar</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

### 3. Drawer de logs (`src/components/agents/AgentLogsDrawer.tsx`)
Sheet de shadcn/ui que se abre desde la derecha al click en "Ver logs".

Conectar al SSE de logs (si está disponible en el backend):
```typescript
// GET /api/sse/agents/:name/logs
// Si no existe, usar polling GET /api/agents/:name/logs?since=timestamp
```

**Controles del drawer:**
- Toggle de nivel: ALL | INFO | WARN | ERROR (client-side filter)
- Botón "Limpiar" (limpia la lista local)
- Botón "Pausar/Reanudar" el scroll automático
- Botón "Descargar" (descarga como .txt)

**Línea de log:**
```
[17:45:02] INFO  Crawling /rest/products/search
[17:45:08] WARN  Scope check: /external.com skipped
[17:45:10] ERROR ZAP timeout on /api/cart
```
- Colores: INFO=zinc, WARN=yellow, ERROR=red, DEBUG=zinc-500
- Fuente monoespaciada
- Auto-scroll al último mensaje (parar si el usuario hace scroll arriba)
- Máximo 500 líneas (rotar los más antiguos)

### 4. Barra de métricas del sistema (`src/components/agents/SystemMetrics.tsx`)
```typescript
// Llamar a GET /api/system/status (crear esta ruta si no existe)
// Verificar: ChromaDB, ZAP, interactsh
```

Visualización horizontal:
```
ChromaDB ● 156 findings · 3 colecciones
ZAP      ● Puerto 8080 · último scan 5min
interactsh ● 0 callbacks pendientes
```
- Refrescar cada 30s con SWR

### 5. Historial de tareas (`src/components/agents/TaskHistory.tsx`)
Tabla de las últimas 50 tareas de los agentes (últimas 24h).
- Datos: timestamp, agente (emoji+nombre), descripción de tarea, duración, estado
- Filtro por agente (chips)
- Ordenado por tiempo (más reciente primero)
- Paginación simple (anterior/siguiente)
- Badge de estado: ✅ / ❌ / ⏳ (en progreso) / 🔒 (HITL)

### 6. Ruta API adicional (`src/app/api/system/status/route.ts`)
Si AGENT_2 no la creó, este agente debe crearla:
```typescript
// Verifica conectividad de servicios externos
GET /api/system/status → {
  chromadb: { status, collections, totalFindings },
  zap: { status, lastScanAt },
  interactsh: { status, pendingCallbacks }
}
```

## Criterios de aceptación
- [ ] Las 4 cards se renderizan con estado actualizado en tiempo real
- [ ] La animación de "busy" se activa/desactiva correctamente
- [ ] El drawer de logs abre y muestra logs (reales o simulados)
- [ ] El auto-scroll del drawer funciona y se puede pausar
- [ ] Las métricas del sistema se actualizan cada 30s
- [ ] Los controles de admin (Iniciar/Detener) solo aparecen para usuarios con rol admin
- [ ] El historial de tareas carga datos reales del audit_log
- [ ] Si el SSE se corta, muestra banner de reconexión
