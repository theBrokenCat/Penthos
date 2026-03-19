# AGENT_3_FRONTEND — Scaffold Frontend, Layout & Design System

## Misión
Construir la estructura base del frontend: instalar y configurar shadcn/ui, crear el layout principal con sidebar y topbar, y definir los componentes de navegación reutilizables. Este agente NO implementa páginas de contenido — solo las "paredes y pasillos" del portal.

## Prerrequisito
- AGENT_1_AUTH debe haber creado el proyecto Next.js y la autenticación
- Leer: `webapp/PLAN.md`, `webapp/specs/01_STACK.md`

## Entregables

### 1. Instalar y configurar shadcn/ui
```bash
cd webapp/src
pnpm dlx shadcn@latest init
# Elegir: Dark theme, zinc, CSS variables: yes
```

Instalar los siguientes componentes:
```bash
pnpm dlx shadcn@latest add button input label badge card dropdown-menu
pnpm dlx shadcn@latest add dialog sheet tabs toast avatar separator
pnpm dlx shadcn@latest add table select checkbox textarea tooltip
pnpm dlx shadcn@latest add progress skeleton alert command popover
```

Instalar recharts para gráficos:
```bash
pnpm add recharts
```

### 2. Layout de la aplicación autenticada

**`src/app/(dashboard)/layout.tsx`**
Layout que envuelve todas las páginas del portal (excepto login).
Estructura:
```
┌─────────────────────────────────────────────────┐
│  TOPBAR (header fijo)                           │
├────────────────┬────────────────────────────────┤
│  SIDEBAR       │  CONTENIDO PRINCIPAL           │
│  (fijo, 240px) │  (scrollable, flex-1)          │
│                │                                │
│                │  {children}                    │
└────────────────┴────────────────────────────────┘
```

### 3. Sidebar (`src/components/layout/Sidebar.tsx`)
Navegación vertical fija con:
```
OPENCLAW PENTESTER
── logo + nombre ──

🏠 Dashboard          /
📁 Auditorías         /audits
🤖 Agentes            /agents
──────────────────
⚙️  Configuración     /settings

──────────────────
[Avatar] Arturo
         Admin
         [Cerrar sesión]
```

- Ítem activo: resaltado con fondo + color primario
- Colapsable en móvil (drawer)
- Indicador de HITL reviews pendientes en el ítem "Auditorías" (badge rojo con número)
- Indicador de agentes con error en el ítem "Agentes" (punto rojo)

### 4. Topbar (`src/components/layout/Topbar.tsx`)
Header fijo con:
```
[≡ Menú]   OpenClaw Pentester    [🔔 Notificaciones]  [Avatar ▼]
```

- Menú hamburguesa para móvil
- Dropdown de notificaciones (HITL pendientes, auditorías completadas)
- Dropdown de usuario: "Mi perfil", "Configuración", "Cerrar sesión"

### 5. Componentes base del design system

**`src/components/ui/status-badge.tsx`**
```typescript
// <StatusBadge status="running" /> → chip verde animado "Corriendo"
// Estados: running, completed, paused, failed, archived, queued
```

**`src/components/ui/severity-badge.tsx`**
```typescript
// <SeverityBadge severity="critical" /> → chip rojo "Crítico"
// Severidades: critical, high, medium, low, info
```

**`src/components/ui/agent-status-dot.tsx`**
```typescript
// <AgentStatusDot status="busy" /> → punto azul con pulso
// Estados: online, offline, busy, error, starting
```

**`src/components/ui/empty-state.tsx`**
```typescript
// <EmptyState icon={...} title="No hay auditorías" description="..." action={...} />
```

**`src/components/ui/page-header.tsx`**
```typescript
// <PageHeader title="Auditorías" description="..." actions={...} />
```

**`src/components/ui/loading-spinner.tsx`**

### 6. Estructura de rutas base (páginas vacías con placeholder)

Crear las siguientes páginas con solo el esqueleto (título + "En construcción"):
```
src/app/(dashboard)/page.tsx              → Dashboard (placeholder)
src/app/(dashboard)/audits/page.tsx       → Lista auditorías (placeholder)
src/app/(dashboard)/audits/[id]/page.tsx  → Detalle auditoría (placeholder)
src/app/(dashboard)/agents/page.tsx       → Monitor agentes (placeholder)
src/app/(dashboard)/settings/page.tsx     → Configuración (placeholder)
src/app/not-found.tsx                     → Página 404
src/app/error.tsx                         → Página de error global
```

### 7. Providers (`src/app/layout.tsx` raíz)
- SessionProvider de Auth.js
- Toaster de shadcn/ui
- ThemeProvider (dark/light)

### 8. Utilidades CSS
**`src/lib/utils.ts`** — función `cn()` para merge de clases Tailwind
**`src/styles/globals.css`** — variables CSS del tema oscuro

### 9. Tipos globales (`src/types/index.ts`)
```typescript
export type UserRole = "admin" | "analyst" | "viewer"
export type AuditStatus = "queued" | "running" | "paused" | "completed" | "failed" | "archived"
export type Severity = "critical" | "high" | "medium" | "low" | "info"
export type AgentStatus = "online" | "offline" | "busy" | "error" | "starting"
export type AgentName = "supervisor" | "explorer" | "analyst" | "exploiter"

export interface Audit { id, name, targetUrl, status, createdAt, ... }
export interface Finding { id, title, severity, type, url, agent, ... }
export interface AgentInfo { name, status, currentTask, findingsCount, uptime, model }
```

## Criterios de aceptación
- [ ] `pnpm dev -p 4000` arranca sin errores TypeScript
- [ ] El login redirige al dashboard (layout con sidebar visible)
- [ ] Sidebar navega correctamente entre las 4 secciones
- [ ] El layout es responsivo (sidebar colapsa en pantallas < 768px)
- [ ] Los componentes de badge se renderizan con el color correcto para cada estado/severidad
- [ ] El tema oscuro está activo por defecto
- [ ] No hay errores en consola del navegador

## Paleta de colores (Tailwind)
```
Background principal: zinc-950
Surface/Card:         zinc-900
Border:               zinc-800
Texto primario:       zinc-100
Texto secundario:     zinc-400

Crítico:  red-500
Alto:     orange-500
Medio:    yellow-500
Bajo:     blue-400
Info:     zinc-500

Online/Éxito: green-500
Busy:         blue-500
Error:        red-500
Advertencia:  yellow-500
```
