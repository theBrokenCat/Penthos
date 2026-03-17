# Spec 04 — Dashboard

## Propósito

Primera pantalla que ve el usuario tras el login. Ofrece una visión global instantánea del estado del sistema: cuántas auditorías hay, en qué estado, cuántos hallazgos críticos, y si los agentes están activos.

---

## Composición de la pantalla

### Fila superior: Tarjetas de estadísticas (4 cards)

| Card | Valor | Icono | Color |
|---|---|---|---|
| **Total Auditorías** | N (todas) | `FolderSearch` | Azul |
| **En Ejecución** | N (status=running) | `Activity` | Verde con pulso |
| **Findings Críticos** | N (sin resolver) | `ShieldAlert` | Rojo |
| **Pendientes HITL** | N (reviews pendientes) | `UserCheck` | Naranja |

Cada card es clickable: lleva a la sección correspondiente con el filtro aplicado.

---

### Bloque central izquierdo (60%): Últimas Auditorías

Tabla compacta con las 5-10 auditorías más recientes:

```
Nombre         Target URL           Estado      Findings    Fecha
──────────────────────────────────────────────────────────────────
Juice Shop v2  localhost:3000/      ● Completa  12 (3 crit) 17 Mar
DVWA Test      192.168.1.50/dvwa   ● Corriendo  5 (1 crit)  17 Mar
WebGoat Jan    webgoat.local/       ○ Pausada    8           14 Mar
```

- Badge de estado con color semántico
- Columna de severidad: `3🔴 2🟠 7🟡` (mini chips)
- Click en fila → navega a detalle de auditoría
- Botón "Ver todas" → `/audits`

---

### Bloque central derecho (40%): Estado de Agentes

Mini-panel con los 4 agentes en lista vertical:

```
🧠 Supervisor   ● Online    —  Coordinando Juice Shop v2
🕷️ Explorer     ● Busy      🔄  Crawling /rest/products/...
🔬 Analyst      ● Online    —  En espera
💥 Exploiter    ● Offline   —  —
```

- Punto de color: verde=online, azul=busy, gris=offline, rojo=error
- Animación de pulso si está "busy"
- Click en agente → `/agents` (monitor completo)
- Botón "Monitor completo" abajo

---

### Fila inferior: Gráfico de actividad + Feed de eventos

**Izquierda (50%): Gráfico de hallazgos por día (últimos 14 días)**
- `recharts` AreaChart
- Series: Critical (rojo), High (naranja), Medium (amarillo), Low (azul)
- Tooltip con desglose al hover

**Derecha (50%): Feed de actividad reciente**
Lista de los últimos 20 eventos del audit_log:
```
🔴 [17:32] Exploiter confirmó SQLi en /rest/products/search
🟠 [17:28] Analyst completó escaneo activo — 4 alertas
🟢 [17:15] Explorer finalizó spider — 47 endpoints
🔵 [16:45] Arturo inició auditoría "Juice Shop v2"
```

---

## Interacciones

- **"Nueva Auditoría"** — botón prominente en el header → abre modal de creación
- **Refresh automático**: El estado de agentes y estadísticas se refresca cada 5 segundos (SWR con revalidation)
- **Notificaciones**: Toast si llega una HITL review pendiente (SSE trigger)
- **Click tarjeta críticos**: Va a `/audits?severity=critical&resolved=false`

---

## API calls del Dashboard

```typescript
// Estado general (refresca cada 5s)
GET /api/audits?limit=10&sortBy=updatedAt&order=desc

// Estadísticas globales
GET /api/audits/stats → { total, running, completed, criticalFindings, hitlPending }

// Estado agentes (via SSE o polling)
GET /api/agents/status

// Activity feed
GET /api/audit-log?limit=20

// Datos del gráfico
GET /api/audits/findings-chart?days=14
```

---

## Componentes reutilizables de este módulo

- `<StatCard>` — tarjeta de estadística con icono, valor y tendencia
- `<AgentStatusBadge>` — chip de estado con color y animación
- `<AuditRow>` — fila de auditoría con badges de severidad
- `<ActivityFeedItem>` — ítem del feed con icono por tipo de evento
- `<FindingsChart>` — área chart de recharts
