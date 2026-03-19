# AGENT_2_BACKEND — API Routes & Integración con OpenClaw

## Misión
Implementar todas las rutas de la API de Next.js: auditorías, findings (proxy a ChromaDB), estado de agentes, informes y HITL reviews. También crear los clientes TypeScript para comunicarse con OpenClaw gateway y ChromaDB.

## Prerrequisito
- AGENT_1_AUTH debe haber completado su trabajo (DB schema, auth helpers)
- Leer: `webapp/specs/03_API.md`

## Entregables

### 1. Schema DB adicional (`src/lib/db/schema.ts` — ampliar el de AGENT_1)
Añadir tablas:
- `audits` (ver spec 03)
- `reports`
- `hitl_reviews`

### 2. Cliente OpenClaw (`src/lib/openclaw.ts`)
```typescript
// Funciones a implementar:
getGatewayStatus()
startAudit(auditId, target, config)
pauseAudit(auditId)
resumeAudit(auditId)
getAgentStatus(agentName: "supervisor"|"explorer"|"analyst"|"exploiter")
getAllAgentsStatus()
pingAgent(agentName, port)
```
Usar fetch con timeout de 5s. Si el gateway no responde, devolver `{ status: "offline" }` sin lanzar excepción.

### 3. Cliente ChromaDB (`src/lib/chromadb.ts`)
```typescript
// Funciones a implementar:
getFindings(sessionId, filters?)
getFindingById(sessionId, findingId)
getFindingsStats(sessionId)
updateFinding(findingId, patch)   // marcar FP, añadir nota
```
Invocar los scripts Python existentes via `child_process.execFile`:
- `pentester/skills/query_attack_surface/scripts/query.py`
- `pentester/skills/store_finding_in_vector_db/scripts/store.py`

Ruta absoluta de los scripts: `/sessions/loving-busy-keller/mnt/openclaw-pentester/pentester/skills/...`

### 4. Rutas API — Auditorías
```
src/app/api/audits/route.ts              → GET (lista) + POST (crear)
src/app/api/audits/stats/route.ts        → GET (stats globales)
src/app/api/audits/[id]/route.ts         → GET + PATCH + DELETE
src/app/api/audits/[id]/start/route.ts   → POST
src/app/api/audits/[id]/pause/route.ts   → POST
src/app/api/audits/[id]/resume/route.ts  → POST
src/app/api/audits/[id]/timeline/route.ts → GET
```

### 5. Rutas API — Findings
```
src/app/api/findings/[auditId]/route.ts             → GET (lista)
src/app/api/findings/[auditId]/stats/route.ts       → GET
src/app/api/findings/[auditId]/[findingId]/route.ts → GET + PATCH
```

### 6. Rutas API — Agentes
```
src/app/api/agents/status/route.ts       → GET (todos)
src/app/api/agents/[name]/status/route.ts → GET
src/app/api/agents/[name]/ping/route.ts   → POST
src/app/api/sse/agents/route.ts           → GET (SSE stream)
```

El SSE debe emitir cada 3 segundos. Formato:
```
data: {"supervisor":{"status":"online",...},"explorer":{...},...}\n\n
```

### 7. Rutas API — Informes
```
src/app/api/reports/generate/route.ts      → POST
src/app/api/reports/[auditId]/route.ts     → GET (lista)
src/app/api/reports/download/[id]/route.ts → GET (stream del archivo)
src/app/api/reports/[id]/route.ts          → DELETE
```

La generación invoca:
```typescript
execFile("python3", [
  "/ruta/a/pentester/skills/save_report/scripts/save_report.py",
  "--session-id", audit.sessionId,
  "--output", outputPath,
  "--template", template,
  // ...resto de args
])
```

### 8. Rutas API — HITL Reviews
```
src/app/api/hitl/[auditId]/route.ts   → GET
src/app/api/hitl/[id]/approve/route.ts → POST
src/app/api/hitl/[id]/reject/route.ts  → POST
```

### 9. Rutas API — Audit Log
```
src/app/api/audit-log/route.ts    → GET (solo admin)
```

### 10. Validaciones Zod (`src/lib/validations/`)
Crear schemas para:
- `createAuditSchema` — validar body de POST /api/audits
- `updateAuditSchema` — validar body de PATCH /api/audits/:id
- `generateReportSchema` — validar body de POST /api/reports/generate

## Criterios de aceptación
- [ ] GET /api/audits devuelve lista paginada correctamente
- [ ] POST /api/audits crea auditoría y devuelve ID
- [ ] GET /api/agents/status responde aunque los agentes estén offline
- [ ] SSE /api/sse/agents emite sin errores durante 30s
- [ ] GET /api/findings/:auditId llama al script Python sin crashes
- [ ] Todas las rutas protegidas devuelven 401 sin sesión válida
- [ ] Rutas de admin devuelven 403 a usuarios con rol viewer/analyst

## Notas
- Manejar siempre el caso en que OpenClaw gateway no esté disponible (timeout, no crash)
- Los scripts Python pueden tardar: usar timeout de 30s en `execFile`
- Directorio de informes: crear `webapp/generated-reports/` si no existe
