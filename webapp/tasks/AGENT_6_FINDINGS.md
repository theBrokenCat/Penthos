# AGENT_6_FINDINGS — Detalle de Findings & Vulnerabilidades

## Misión
Implementar el panel de findings dentro del detalle de auditoría: lista filtrável de hallazgos, vista detallada de cada finding con evidencias, acciones (falso positivo, notas, resolver) y estadísticas visuales.

## Prerrequisitos
- AGENT_5_AUDITS ✅ (la página `/audits/[id]` con su tab "Findings" ya existe como placeholder)
- AGENT_2_BACKEND ✅ (rutas /api/findings funcionando)
- Leer: `webapp/specs/06_FINDINGS.md`

## Entregables

### 1. Componente principal `<FindingsPanel>` (`src/components/findings/FindingsPanel.tsx`)
Panel dividido en dos columnas (35/65):
- Columna izquierda: `<FindingsList>`
- Columna derecha: `<FindingDetail>` (o `<FindingsStats>` si está activo ese toggle)
- Toggle en la parte superior: "Hallazgos" / "Estadísticas"
- State del finding seleccionado mantenido en el componente padre

### 2. Componente `<FindingsList>` (`src/components/findings/FindingsList.tsx`)
**Filtros superiores:**
- Chips de severidad con contadores: `Todos (24) | Crítico (3) | Alto (4) | ...`
- Toggle: No resueltos / Resueltos / Falsos positivos
- Filtros adicionales en un `<Popover>`: tipo, agente
- Ordenación: Severidad, Fecha, Tipo

**Tarjeta de finding:**
```
┌──────────────────────────────────────┐
│ 🔴 CRÍTICO                            │
│ SQL Injection — UNION-based          │
│ /rest/products/search?q=             │
│ 🤖 Exploiter · hace 2h               │
│ ✅ Confirmado                         │
└──────────────────────────────────────┘
```
- Borde izquierdo de 3px con color de severidad
- Estado visual: confirmado, falso positivo, resuelto (iconos + texto)
- Fondo ligeramente más claro al estar seleccionado
- Usar virtualización si >100 findings (react-virtual o scroll normal con limit inicial)

### 3. Componente `<FindingDetail>` (`src/components/findings/FindingDetail.tsx`)
Secciones colapsables:

**Header:**
- Badge de severidad + CVSS score
- Título del finding
- Meta: agente, fecha, tipo

**Descripción:** markdown renderizado (usar `react-markdown` o simplemente `prose` de Tailwind)

**Endpoint afectado:**
- Chips de método HTTP (coloreados: GET=verde, POST=azul, PUT=naranja, DELETE=rojo)
- URL copiable (botón de copiar)
- Parámetro afectado

**Evidencia** (tabs internos con `<Tabs>`):
- Request: código con syntax highlighting (`<pre>` + clase `font-mono`)
- Response: código con diff highlights en las líneas relevantes
- Payload: si existe, mostrado en caja destacada

**CVSS Score** (si disponible):
- Número grande (ej: 9.8) + badge "Critical"
- Vector string en `font-mono` pequeño

**Recomendación:** markdown renderizado en caja verde/teal suave

**Referencias:** lista de links externos (OWASP, CVE, CWE)

**Acciones:**
```
[✅ Marcar resuelto]  [🚫 Falso positivo]  [💬 Añadir nota]  [⬇️ Exportar]
```

### 4. Modal "Marcar como resuelto" (`src/components/findings/ResolveModal.tsx`)
- Textarea: "¿Cómo se resolvió?" (requerido)
- Botón confirmar → PATCH /api/findings/:auditId/:findingId `{ isResolved: true, resolution: "..." }`

### 5. Modal "Falso positivo" (`src/components/findings/FalsePositiveModal.tsx`)
- Textarea: "¿Por qué es un falso positivo?" (requerido, min 10 chars)
- Alerta: "Esta acción excluirá el hallazgo del informe final"
- Botón confirmar → PATCH /api/findings/:auditId/:findingId `{ isFalsePositive: true, fpReason: "..." }`

### 6. Modal "Añadir nota" (`src/components/findings/AddNoteModal.tsx`)
- Textarea markdown
- Preview del markdown en tiempo real (toggle)
- PATCH /api/findings/:auditId/:findingId `{ notes: "..." }`

### 7. Banner de HITL pendiente
Si el finding tiene una HITL review asociada y pendiente:
```typescript
// Encima de la descripción del finding:
<HitlBanner
  review={hitlReview}
  onApprove={() => approveHitl(review.id)}
  onReject={() => rejectHitl(review.id)}
/>
```

### 8. Componente `<FindingsStats>` (`src/components/findings/FindingsStats.tsx`)
Vista alternativa con:
- BarChart (recharts): findings por severidad
- PieChart (recharts): findings por tipo
- LineChart (recharts): findings por hora de descubrimiento
- Tabla: top 5 endpoints con más findings

## Criterios de aceptación
- [ ] La lista carga findings reales desde ChromaDB
- [ ] Los filtros de severidad actualizan la lista inmediatamente
- [ ] Seleccionar un finding muestra su detalle en el panel derecho
- [ ] La evidencia (request/response) se muestra en monospace legible
- [ ] Las acciones (resolver, FP, nota) persisten en el backend
- [ ] El toggle de estadísticas muestra los gráficos correctamente
- [ ] Funciona con 0 findings (estado vacío elegante)
- [ ] Funciona con 200+ findings sin degradar el rendimiento
