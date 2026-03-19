# AGENT_5_AUDITS — Gestión de Auditorías

## Misión
Implementar la lista de auditorías (`/audits`) con filtros, búsqueda y vista cards/tabla, y la página de detalle de auditoría (`/audits/[id]`) con sus tabs.

## Prerrequisitos
- AGENT_1_AUTH ✅, AGENT_2_BACKEND ✅, AGENT_3_FRONTEND ✅
- Leer: `webapp/specs/05_AUDITS.md`

## Entregables

### 1. Página lista de auditorías (`src/app/(dashboard)/audits/page.tsx`)
Server Component + Client Components para interactividad.

**Componente `<AuditsFilters>`** (`src/components/audits/AuditsFilters.tsx`)
- Input de búsqueda (debounce 300ms)
- Chips de estado (Todas / En ejecución / Completadas / Pausadas / Archivadas)
- Toggle vista tabla/cards
- Selector de ordenación
- Filtro de rango de fechas (DateRangePicker de shadcn)

**Componente `<AuditsTable>`** (`src/components/audits/AuditsTable.tsx`)
- Columnas: checkbox, Nombre, URL, Estado, Findings (chips), Creada, Acciones
- Row hover effect
- Menú de acciones (`<DropdownMenu>`) con: Renombrar, Pausar/Reanudar, Generar informe, Duplicar config, Archivar, Eliminar (admin)
- Selección múltiple → barra de acciones bulk en la parte inferior

**Componente `<AuditsGrid>`** (`src/components/audits/AuditsGrid.tsx`)
- Grid 3 columnas en desktop, 2 en tablet, 1 en móvil
- Tarjeta con: chips de severidad, nombre, URL, estado, fecha

**Paginación** (`src/components/ui/pagination.tsx`)
- Botones Anterior/Siguiente + páginas numeradas

### 2. Modal de renombrar (`src/components/audits/RenameAuditModal.tsx`)
- Input con el nombre actual prellenado
- Validación: min 3 chars, max 100 chars
- PATCH /api/audits/:id al confirmar

### 3. Modal de nueva auditoría (`src/components/audits/CreateAuditModal.tsx`)
Wizard 2 pasos:

**Paso 1 — Objetivo:**
- Nombre (input, autosugerido como `Auditoría - [fecha]`)
- URL objetivo (input, validación URL)
- Scope URLs (textarea, una por línea)
- Notas (textarea opcional)

**Paso 2 — Configuración:**
- Modo: radio buttons (Completo / Solo recon / Solo análisis / Personalizado)
- Agentes: checkboxes
- Requerir HITL: checkboxes (escaneo activo, explotación)
- Modelo LLM: select
- Credenciales de prueba: campos usuario/contraseña opcionales

Botón "Iniciar auditoría" → POST /api/audits + POST /api/audits/:id/start

### 4. Página detalle de auditoría (`src/app/(dashboard)/audits/[id]/page.tsx`)

**Header del detalle:**
- Botón volver
- Nombre de la auditoría (editable inline al hacer click en el lápiz)
- URL objetivo
- Badge de estado
- Stats inline: endpoints descubiertos, duración, fecha
- Botones de acción: Pausar/Reanudar, Generar informe

**Tabs** (usar `<Tabs>` de shadcn/ui):
- **Resumen**: barra de progreso de fases, cards de findings por severidad, notas editables
- **Findings**: componente `<FindingsPanel>` (lo implementa AGENT_6)
- **Endpoints**: tabla de endpoints con columnas URL, Método, Status, Tech
- **Revisiones HITL**: lista de reviews pendientes/históricas
- **Configuración**: config readonly + botón "Re-lanzar"

**Log en tiempo real** (componente `<AuditLiveFeed>`):
- Panel colapsable en la parte inferior
- SSE desde `/api/sse/audit/:id` (si está disponible)
- Si no hay SSE específico por auditoría, no mostrar

### 5. Confirmación de acciones destructivas
Usar `<AlertDialog>` de shadcn para:
- Archivar auditoría: "¿Archivar esta auditoría? Podrás restaurarla después."
- Eliminar auditoría: "Esta acción es permanente. Escribe el nombre para confirmar."

## Criterios de aceptación
- [ ] La lista carga con paginación correcta
- [ ] La búsqueda filtra en tiempo real (con debounce)
- [ ] Los filtros de estado funcionan y combinan correctamente
- [ ] El toggle tabla/cards funciona y persiste en localStorage
- [ ] Renombrar actualiza el nombre sin recargar la página
- [ ] El wizard de creación valida cada paso antes de avanzar
- [ ] El detalle de auditoría muestra los 5 tabs correctamente
- [ ] El tab Endpoints carga datos desde /api/findings/:id?type=endpoint
