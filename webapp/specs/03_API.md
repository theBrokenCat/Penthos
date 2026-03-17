# Spec 03 — Backend API (Next.js API Routes)

## Estructura general de respuestas

```typescript
// Éxito
{ data: T, meta?: { total, page, limit } }

// Error
{ error: { code: string, message: string, details?: any } }
```

## Schema de base de datos (Drizzle + SQLite)

```typescript
// Tabla: audits
{
  id: string (cuid2),
  name: string,                    // nombre editable por usuario
  targetUrl: string,
  targetScope: string[],           // JSON array de URLs en scope
  status: "queued" | "running" | "paused" | "completed" | "failed" | "archived",
  sessionId: string | null,        // ID de sesión en ChromaDB
  createdBy: string,               // FK → users.id
  createdAt: Date,
  updatedAt: Date,
  startedAt: Date | null,
  completedAt: Date | null,
  notes: string | null,
  totalFindings: number,           // cached count
  criticalCount: number,
  highCount: number,
  mediumCount: number,
  lowCount: number
}

// Tabla: reports
{
  id: string,
  auditId: string,                 // FK → audits.id
  generatedBy: string,             // FK → users.id
  format: "docx" | "pdf" | "md",
  filePath: string,                // ruta en servidor
  fileSize: number,                // bytes
  templateUsed: string,
  generatedAt: Date
}

// Tabla: hitl_reviews
{
  id: string,
  auditId: string,
  agentName: string,               // "exploiter", "analyst"
  action: string,                  // acción pendiente de aprobación
  context: string,                 // JSON con contexto del agente
  status: "pending" | "approved" | "rejected",
  reviewedBy: string | null,
  reviewedAt: Date | null,
  createdAt: Date
}
```

## Endpoints de Auditorías

```
GET    /api/audits                → Lista todas las auditorías (paginado, filtrado)
POST   /api/audits                → Crea nueva auditoría (inicia sesión en ChromaDB)
GET    /api/audits/:id            → Detalle de auditoría
PATCH  /api/audits/:id            → Actualizar nombre, notas, estado
DELETE /api/audits/:id            → Archivar (soft delete) — solo admin

GET    /api/audits/:id/findings   → Hallazgos de la auditoría (desde ChromaDB)
GET    /api/audits/:id/timeline   → Timeline de eventos de la auditoría
POST   /api/audits/:id/start      → Iniciar auditoría (envía tarea a Supervisor)
POST   /api/audits/:id/pause      → Pausar auditoría
POST   /api/audits/:id/resume     → Reanudar auditoría
```

### Queries soportadas en GET /api/audits
```
?status=running,completed    → filtrar por estado (múltiple)
?search=nombre               → búsqueda por nombre y URL
?sortBy=createdAt&order=desc → ordenar
?page=1&limit=20             → paginación
?createdBy=userId            → filtrar por usuario
```

## Endpoints de Findings (proxy a ChromaDB)

```
GET  /api/findings/:auditId             → Todos los findings de una auditoría
GET  /api/findings/:auditId/:findingId  → Detalle de un finding
GET  /api/findings/:auditId/stats       → Estadísticas (por severidad, tipo, agente)
PATCH /api/findings/:findingId          → Marcar como false positive, añadir nota
```

### Query params para findings
```
?severity=critical,high     → filtrar por severidad
?type=vulnerability,cred    → filtrar por tipo
?agent=exploiter            → filtrar por agente que lo encontró
?search=sqli                → búsqueda semántica en ChromaDB
```

## Endpoints de Agentes

```
GET  /api/agents/status          → Estado actual de los 4 agentes
GET  /api/agents/:name/status    → Estado de un agente específico
POST /api/agents/:name/ping      → Ping de salud (llama a gateway)
GET  /api/sse/agents             → Stream SSE de estado en tiempo real
```

### Respuesta de estado de agente
```typescript
{
  name: "supervisor" | "explorer" | "analyst" | "exploiter",
  status: "online" | "offline" | "busy" | "error",
  currentTask: string | null,
  currentAuditId: string | null,
  findingsCount: number,
  lastActivityAt: Date,
  model: string,
  uptime: number           // segundos
}
```

## Endpoints de Informes

```
POST /api/reports/generate     → Genera informe Word para una auditoría
GET  /api/reports/:auditId     → Lista informes de una auditoría
GET  /api/reports/download/:id → Descarga el archivo
DELETE /api/reports/:id        → Elimina informe generado
```

### Lógica de generación
1. Recibe `{ auditId, template: "executive" | "technical" | "full" }`
2. Llama a ChromaDB para obtener todos los findings del `auditId`
3. Ejecuta `python3 pentester/skills/save_report/scripts/save_report.py`
4. Devuelve path del `.docx` generado
5. Registra en tabla `reports`

## Endpoints de HITL Reviews

```
GET   /api/hitl/:auditId          → Reviews pendientes de una auditoría
POST  /api/hitl/:id/approve       → Aprobar acción del agente
POST  /api/hitl/:id/reject        → Rechazar acción del agente
```

## Endpoints de Usuario / Settings

```
GET  /api/user/me                 → Perfil del usuario autenticado
PATCH /api/user/me                → Actualizar nombre, avatar
POST /api/user/me/password        → Cambiar contraseña
POST /api/user/me/api-key         → Generar nueva API key
DELETE /api/user/me/api-key       → Revocar API key
POST /api/user/me/2fa/setup       → Iniciar setup 2FA (devuelve QR)
POST /api/user/me/2fa/verify      → Verificar y activar 2FA
DELETE /api/user/me/2fa           → Desactivar 2FA

GET  /api/admin/users             → (admin) Lista usuarios
POST /api/admin/users             → (admin) Crear usuario
PATCH /api/admin/users/:id        → (admin) Editar usuario, cambiar rol
DELETE /api/admin/users/:id       → (admin) Desactivar usuario
```

## Integración con OpenClaw Gateway

```typescript
// lib/openclaw.ts
const GATEWAY = process.env.OPENCLAW_GATEWAY_URL // http://localhost:3000

async function startAudit(auditId: string, target: AuditTarget) {
  return fetch(`${GATEWAY}/agents/supervisor/tasks`, {
    method: "POST",
    body: JSON.stringify({
      task: `Iniciar auditoría de ${target.url}`,
      context: { auditId, target }
    })
  })
}
```

## Integración con ChromaDB (findings)

```typescript
// lib/chromadb.ts
// Usa los scripts Python ya implementados vía child_process
// O conecta directamente vía HTTP a ChromaDB en puerto 8000

async function getFindings(sessionId: string, filters?: FindingFilters) {
  const result = await execPython(
    "pentester/skills/query_attack_surface/scripts/query.py",
    ["--session-id", sessionId, "--format", "json", ...filterArgs]
  )
  return JSON.parse(result.stdout)
}
```
