# Spec 02 — Autenticación & Seguridad

## Modelo de usuarios

```typescript
// Tabla: users
{
  id: string (cuid2),
  email: string (unique),
  name: string,
  passwordHash: string,        // bcrypt, rounds=12
  role: "admin" | "analyst" | "viewer",
  avatarUrl: string | null,
  totpSecret: string | null,   // TOTP 2FA (null = deshabilitado)
  totpEnabled: boolean,
  apiKey: string | null,       // SHA-256 hash de la API key real
  apiKeyCreatedAt: Date | null,
  lastLoginAt: Date | null,
  createdAt: Date,
  updatedAt: Date,
  isActive: boolean            // soft-delete / suspend
}
```

## Roles y permisos (RBAC)

| Acción | admin | analyst | viewer |
|---|---|---|---|
| Ver auditorías | ✅ | ✅ | ✅ |
| Crear auditoría | ✅ | ✅ | ❌ |
| Renombrar/archivar auditoría | ✅ | ✅ (propias) | ❌ |
| Eliminar auditoría | ✅ | ❌ | ❌ |
| Ver findings | ✅ | ✅ | ✅ |
| Aprobar HITL review | ✅ | ✅ | ❌ |
| Generar informe | ✅ | ✅ | ❌ |
| Ver monitor agentes | ✅ | ✅ | ❌ |
| Iniciar/detener agentes | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Ver audit log | ✅ | ❌ | ❌ |
| Cambiar settings propios | ✅ | ✅ | ✅ |

## Flujos de autenticación

### Login
1. Usuario envía `POST /api/auth/signin` con `{email, password}`
2. Auth.js verifica credentials con bcrypt
3. Si `totpEnabled: true` → redirigir a pantalla 2FA (`/login/2fa`)
4. Verificar TOTP code con `otplib`
5. Emitir JWT en httpOnly cookie `(name: __pentest_session)`
6. Registrar `lastLoginAt` y entrada en `audit_log`

### Logout
- `POST /api/auth/signout` — invalida sesión, borra cookie

### 2FA Setup (desde Settings)
1. Generar `totpSecret` con `otplib.authenticator.generateSecret()`
2. Mostrar QR code para escanear con Google Authenticator / Authy
3. Usuario verifica con código TOTP antes de activar
4. Guardar `totpSecret` encriptado en DB

### API Key Auth
- Header: `Authorization: Bearer <api_key>`
- La key real NUNCA se almacena — solo su SHA-256 hash
- Mostrar la key real SOLO una vez al crearla
- Scopes disponibles: `audits:read`, `audits:write`, `reports:read`

## Seguridad HTTP

### Headers (via next.config.js)
```javascript
headers: [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: "default-src 'self'; ..." }
]
```

### Rate Limiting
- Librería: `@upstash/ratelimit` con in-memory store (o custom middleware con Map)
- Límites:
  - `/api/auth/signin`: 5 intentos / 15 minutos por IP
  - `/api/*`: 100 req / 60 segundos por IP
  - `/api/reports/generate`: 10 req / hora por usuario

### Audit Log
```typescript
// Tabla: audit_log
{
  id: string,
  userId: string,
  action: string,        // "audit.create", "audit.delete", "user.login", etc.
  targetType: string,    // "audit" | "user" | "agent" | "report"
  targetId: string | null,
  metadata: string,      // JSON stringificado
  ipAddress: string,
  userAgent: string,
  createdAt: Date
}
```

## Middleware de Next.js

```typescript
// middleware.ts
// Protege todas las rutas excepto /login y /api/auth/*
// Verifica JWT en cookie
// Inyecta user en request headers para uso en Server Components
```

## Pantalla de login

- Email + Password
- Toggle show/hide password
- "Recordarme" (extiende sesión a 30 días)
- Enlace "Olvidé mi contraseña" (reset vía email — Fase 2)
- Si 2FA: segundo paso con campo numérico de 6 dígitos
- Branding: logo OpenClaw + nombre portal
- Dark mode por defecto

## Setup inicial (primer arranque)

Si no hay usuarios en la DB → redirigir a `/setup`:
- Crear primer usuario admin
- Configurar URL del OpenClaw gateway
- Test de conexión con los agentes
- Crear `.env` local con variables generadas

## Variables de entorno requeridas para este módulo

```env
NEXTAUTH_SECRET=              # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:4000
DATABASE_URL=file:./src/lib/db/webapp.db
```
