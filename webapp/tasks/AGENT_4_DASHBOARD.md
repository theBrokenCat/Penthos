# AGENT_4_DASHBOARD — Pantalla de Dashboard

## Misión
Implementar la pantalla principal del portal (ruta `/`). Estadísticas globales, últimas auditorías, estado de agentes y gráfico de actividad. Alimentado por la API de AGENT_2 y actualizado en tiempo real.

## Prerrequisitos
- AGENT_1_AUTH ✅ (auth funcional)
- AGENT_2_BACKEND ✅ (rutas /api/audits/stats, /api/agents/status, /api/audit-log)
- AGENT_3_FRONTEND ✅ (layout, componentes base)
- Leer: `webapp/specs/04_DASHBOARD.md`

## Entregables

### 1. Página principal (`src/app/(dashboard)/page.tsx`)
Server Component que carga los datos iniciales (SSR). Pasar datos a componentes cliente para revalidación.

### 2. Componente `<StatCard>` (`src/components/dashboard/StatCard.tsx`)
```typescript
interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: "blue" | "green" | "red" | "orange"
  href?: string           // si es clickable
  trend?: { value: number, label: string }  // ej: "+3 hoy"
  pulse?: boolean         // animación si hay actividad
}
```
Cuatro instancias:
- Total Auditorías → azul, icono FolderSearch, href="/audits"
- En Ejecución → verde con pulso si >0, icono Activity
- Findings Críticos → rojo, icono ShieldAlert, href="/audits?severity=critical"
- Revisiones HITL → naranja, icono UserCheck, href="/audits?tab=hitl"

### 3. Componente `<RecentAudits>` (`src/components/dashboard/RecentAudits.tsx`)
Tabla compacta de las últimas 10 auditorías.
Columnas: Nombre, URL, Estado, Findings (chips por severidad), Fecha.
- Usar SWR con `refreshInterval: 5000`
- Click en fila → navega a `/audits/[id]`
- Botón "Ver todas" → `/audits`

### 4. Componente `<AgentsSummary>` (`src/components/dashboard/AgentsSummary.tsx`)
Lista vertical de 4 agentes con estado en tiempo real.
Conectar al SSE de `/api/sse/agents`:
```typescript
"use client"
const [agents, setAgents] = useState<AgentsStatus>({})
useEffect(() => {
  const sse = new EventSource("/api/sse/agents")
  sse.onmessage = (e) => setAgents(JSON.parse(e.data))
  return () => sse.close()
}, [])
```
- Mostrar: nombre con emoji, punto de estado animado, tarea actual (truncada a 40 chars)
- Botón "Monitor completo" → `/agents`

### 5. Componente `<FindingsChart>` (`src/components/dashboard/FindingsChart.tsx`)
AreaChart de recharts con los últimos 14 días.
```typescript
// Llamar GET /api/audits/findings-chart?days=14
// Datos: [{ date: "2026-03-17", critical: 2, high: 3, medium: 5, low: 8 }]
```
- Series: critical(rojo), high(naranja), medium(amarillo), low(azul)
- Tooltip customizado con desglose por severidad
- Responsive (ResponsiveContainer)
- Añadir ruta `src/app/api/audits/findings-chart/route.ts` si AGENT_2 no la creó

### 6. Componente `<ActivityFeed>` (`src/components/dashboard/ActivityFeed.tsx`)
Lista de los últimos 20 eventos del audit_log.
- Icono y color según tipo de evento
- Timestamp relativo ("hace 2 minutos")
- Actualización cada 10s con SWR
- Scroll interno si hay muchos ítems

### 7. Botón "Nueva Auditoría" prominente en el header del dashboard
Abre el modal de creación. El modal de creación puede ser un componente compartido que también usan otras páginas:
`src/components/audits/CreateAuditModal.tsx`
- Wizard de 2 pasos (ver spec 05_AUDITS)
- Validación con Zod en cliente
- Envía POST /api/audits al confirmar

## Criterios de aceptación
- [ ] El dashboard carga en menos de 2 segundos (SSR)
- [ ] Las 4 stat cards muestran datos reales (o 0 si no hay datos)
- [ ] El estado de los agentes se actualiza en tiempo real (SSE)
- [ ] El gráfico renderiza aunque no haya datos (línea en cero)
- [ ] Las últimas auditorías se revalidan cada 5s con SWR
- [ ] El modal de nueva auditoría abre y cierra sin errores
- [ ] Todos los links de navegación funcionan correctamente
