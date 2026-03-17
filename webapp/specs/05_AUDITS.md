# Spec 05 — Gestión de Auditorías

## Pantallas involucradas

1. `/audits` — Lista de todas las auditorías
2. `/audits/new` — Modal/página de creación
3. `/audits/[id]` — Detalle de auditoría (tab principal)

---

## Lista de Auditorías (`/audits`)

### Controles superiores
- **Búsqueda**: input con placeholder "Buscar por nombre o URL..."
- **Filtros** (chips seleccionables):
  - Por estado: `Todas | En ejecución | Completadas | Pausadas | Archivadas`
  - Por severidad máxima: `Tiene críticos | Tiene altos`
  - Por fecha: `Hoy | Esta semana | Este mes | Rango personalizado`
- **Ordenar**: Creación (desc/asc), Nombre (A-Z), Findings, Última actividad
- **Botón "Nueva auditoría"** — derecha superior

### Tabla de auditorías

```
[ ] Nombre            URL               Estado      Findings          Creada       Acciones
──────────────────────────────────────────────────────────────────────────────────────────
[ ] Juice Shop v2     localhost:3000    ● Completa  3🔴 2🟠 7🟡 12🔵  17 Mar 2026  ···
[ ] DVWA Producción   192.168.1.50     🔄 Corriendo ─               17 Mar 2026  ···
[ ] WebGoat Enero     webgoat.local    ⏸ Pausada   0🔴 1🟠 5🟡      14 Mar 2026  ···
```

**Columna Acciones** (menú `···`):
- ✏️ Renombrar
- ▶️ Reanudar / ⏸ Pausar
- 📄 Generar informe
- 📋 Duplicar configuración (nueva auditoría con mismo target)
- 🗃️ Archivar
- 🗑️ Eliminar (solo admin, con confirmación)

**Selección múltiple**: checkbox para operaciones en bulk (archivar varias)

### Vista de cards alternativa (toggle)
Opción de ver como tarjetas en grid de 3 columnas:
```
┌─────────────────────┐
│ 🔴 3 críticos        │
│ Juice Shop v2       │
│ localhost:3000      │
│ ● Completa          │
│ 47 endpoints · 12 f.│
│ Hace 2 horas        │
└─────────────────────┘
```

---

## Modal de creación de auditoría

Wizard de 2 pasos:

### Paso 1: Objetivo
- **Nombre** (requerido): "Juice Shop v2", autosugerido como `Target - fecha`
- **URL objetivo** (requerido): input con validación de URL
- **Scope URLs** (opcional): textarea con una URL por línea
- **Notas previas** (opcional): contexto para los agentes

### Paso 2: Configuración de agentes
- **Modo**: `Completo (recomendado)` | `Solo reconocimiento` | `Solo análisis` | `Personalizado`
- **Agentes a usar**: checkboxes (Supervisor, Explorer, Analyst, Exploiter)
- **Requerir aprobación HITL para**: checkboxes (escaneo activo, explotación)
- **Modelo LLM**: selector (Anthropic Haiku, Ollama Qwen, Gemini Flash)
- **Credenciales de prueba** (opcional): usuario/contraseña de la app a auditar

Botón **"Iniciar auditoría"** — crea la auditoría y envía tarea al Supervisor.

---

## Detalle de Auditoría (`/audits/[id]`)

### Header del detalle
```
← Volver    Juice Shop v2    [Renombrar]
            localhost:3000
            ● En ejecución · Iniciada hace 2h · 47 endpoints
                                              [Pausar] [Generar informe]
```

### Tabs del detalle

**Tab 1: Resumen**
- Barra de progreso de las fases (Recon → Análisis → Explotación)
- Cards de findings por severidad (clicables para filtrar)
- Timeline visual de la auditoría
- Notas de la auditoría (editables)

**Tab 2: Findings** → Ver spec 06

**Tab 3: Endpoints**
- Tabla de todos los endpoints descubiertos
- Columnas: URL, Método, Status, Tech stack, En scope
- Filtros por método (GET/POST/etc.) y status code

**Tab 4: Revisiones HITL**
- Lista de solicitudes de revisión humana pendientes/históricas
- Cada ítem muestra: agente solicitante, acción propuesta, contexto
- Botones Aprobar / Rechazar con campo de nota opcional

**Tab 5: Configuración**
- Muestra la config con que se lanzó la auditoría
- Botón "Re-lanzar con esta config" (crea nueva auditoría)

### Indicador de actividad en tiempo real
Pequeño log en vivo en la esquina inferior de la pantalla (expandible):
```
🕷️ Explorer [17:45:02] Crawling /api/products → 15 nuevos endpoints
🔬 Analyst  [17:45:18] Capturado tráfico ZAP — 24 mensajes
```
Alimentado por SSE desde `/api/sse/audit/:id`

---

## Estados de auditoría y transiciones

```
queued → running → completed
                 ↓
               paused → running
                 ↓
               failed
running/paused/failed → archived
```

| Estado | Badge | Acciones disponibles |
|---|---|---|
| queued | 🕐 En cola (gris) | Cancelar |
| running | 🔄 Corriendo (verde, animado) | Pausar |
| paused | ⏸ Pausada (naranja) | Reanudar, Cancelar |
| completed | ✅ Completada (verde sólido) | Generar informe, Archivar |
| failed | ❌ Fallida (rojo) | Ver error, Reintentar |
| archived | 🗃️ Archivada (gris) | Restaurar, Eliminar |
