# AGENT_1_AUTH — Autenticación & Seguridad

## Misión
Implementar todo el sistema de autenticación del portal web: base de datos de usuarios, login, sesiones JWT, middleware de protección de rutas, roles (RBAC) y audit log.

## Prerrequisito
Leer antes de empezar:
- `webapp/PLAN.md`
- `webapp/specs/01_STACK.md`
- `webapp/specs/02_AUTH.md`

## Entregables (qué debes crear)

### 1. Scaffold del proyecto Next.js
```bash
cd /sessions/loving-busy-keller/mnt/openclaw-pentester/webapp
pnpm create next-app@latest src --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd src
pnpm add next-auth@beta drizzle-orm better-sqlite3 bcryptjs zod
pnpm add -D drizzle-kit @types/better-sqlite3 @types/bcryptjs
```

### 2. Schema de base de datos (`src/lib/db/schema.ts`)
Tablas requeridas:
- `users` (id, email, name, passwordHash, role, totpSecret, totpEnabled, apiKey, lastLoginAt, createdAt, updatedAt, isActive)
- `audit_log` (id, userId, action, targetType, targetId, metadata, ipAddress, userAgent, createdAt)
- `sessions` (si se necesita persistencia de sesiones)

### 3. Configuración Drizzle (`src/lib/db/index.ts` + `drizzle.config.ts`)
- Conexión SQLite a `./webapp.db`
- Script de migración: `pnpm drizzle-kit push`

### 4. Auth.js config (`src/lib/auth.ts`)
- Provider: Credentials (email + contraseña bcrypt)
- Sesiones JWT en httpOnly cookie
- Callbacks para inyectar `role` e `id` en el token
- Duración: 8 horas

### 5. Rutas de Auth (`src/app/api/auth/[...nextauth]/route.ts`)
- Handlers GET y POST de Auth.js

### 6. Middleware (`src/middleware.ts`)
- Proteger todas las rutas excepto `/login` y `/api/auth/*`
- Leer JWT de cookie, verificar validez
- Redirigir a `/login` si no autenticado

### 7. Pantalla de login (`src/app/login/page.tsx`)
- Formulario email + password con validación Zod
- Feedback de error claro
- Dark mode

### 8. Página de setup inicial (`src/app/setup/page.tsx`)
- Solo accesible si no hay usuarios en la DB
- Crear primer usuario admin
- Guardar URL del gateway de OpenClaw en un archivo `.env.local`

### 9. Helpers de autorización (`src/lib/auth-helpers.ts`)
```typescript
export function requireRole(role: "admin" | "analyst" | "viewer") { ... }
export function getCurrentUser(req: Request) { ... }
export async function logAuditEvent(action: string, ...) { ... }
```

### 10. Rate limiting middleware (`src/lib/rate-limit.ts`)
- In-memory Map con ventana deslizante
- 5 intentos de login por 15 min por IP
- 100 req/min por IP en rutas de API

## Criterios de aceptación
- [ ] `pnpm dev` arranca en puerto 4000 sin errores
- [ ] Login con email/password funciona correctamente
- [ ] Rutas protegidas redirigen a `/login` sin sesión
- [ ] Rutas con rol insuficiente devuelven 403
- [ ] El audit_log registra login, logout y acciones relevantes
- [ ] El middleware no afecta rutas públicas ni de auth
- [ ] Contraseñas almacenadas con bcrypt (rounds=12)

## Notas importantes
- El portal corre en puerto 4000 (`pnpm dev -p 4000`)
- Usar `NEXTAUTH_SECRET` generado con `openssl rand -base64 32`
- NO implementar 2FA en esta fase — dejar el campo `totpSecret` en el schema pero la lógica va en AGENT_9_SETTINGS
