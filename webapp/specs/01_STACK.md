# Spec 01 — Stack & Configuración Base

## Decisiones de stack

### Next.js 15 con App Router
- **Por qué**: Un solo proyecto gestiona frontend + API routes. No necesitamos un backend separado para empezar.
- **Renderizado**: Server Components por defecto para páginas que leen datos. Client Components solo para interactividad (formularios, dropdowns, SSE).
- **Puerto**: El portal correrá en `localhost:4000` para no colisionar con OpenClaw (3000) ni ZAP (8080).

### SQLite + Drizzle ORM
- **Por qué SQLite**: No requiere infraestructura adicional. Perfecto para el historial de auditorías, usuarios y settings. El volumen de datos no justifica Postgres.
- **Por qué Drizzle**: Migraciones en TypeScript, type-safe queries, muy ligero.
- **Archivo DB**: `webapp/src/lib/db/webapp.db` (no versionar, añadir a .gitignore)

### Auth.js (NextAuth v5)
- **Estrategia principal**: Credentials (email + contraseña bcrypt)
- **Sesiones**: JWT almacenado en httpOnly cookie
- **Duración**: 8 horas por defecto, renovación automática al 50% del tiempo
- **2FA**: TOTP con `otplib` — opcional por usuario, activable desde Settings

### shadcn/ui + Tailwind CSS 3
- **Por qué shadcn/ui**: Componentes sin dependencia en runtime, customizables, accesibles (Radix UI debajo). No instala un paquete npm — copia el código al repo.
- **Tema**: Dark mode por defecto (apropiado para herramienta de seguridad). Toggle claro/oscuro disponible.
- **Colores base**: Zinc/Slate para fondo, Red/Orange para severidad crítica, Green para éxito.

### Server-Sent Events (SSE) para real-time
- **Por qué SSE en vez de WebSockets**: Unidireccional (servidor → cliente) es suficiente para monitorizar agentes. Más simple, funciona sobre HTTP/2, no requiere biblioteca extra.
- **Ruta SSE**: `GET /api/sse/agents` — emite estado de cada agente cada 3 segundos.

---

## Configuración del proyecto

### Estructura de paquetes
```json
{
  "dependencies": {
    "next": "15.x",
    "react": "19.x",
    "react-dom": "19.x",
    "next-auth": "5.x",
    "drizzle-orm": "latest",
    "better-sqlite3": "latest",
    "zod": "latest",
    "bcryptjs": "latest",
    "swr": "latest",
    "lucide-react": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  },
  "devDependencies": {
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "drizzle-kit": "latest",
    "vitest": "latest",
    "@testing-library/react": "latest"
  }
}
```

### tsconfig.json (puntos clave)
```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Integración con docker-compose del proyecto
Añadir servicio al `docker-compose.yml` raíz:
```yaml
portal:
  build: ./webapp
  ports:
    - "4000:4000"
  environment:
    - OPENCLAW_GATEWAY_URL=http://openclaw:3000
    - CHROMADB_HOST=chromadb
  depends_on:
    - openclaw
    - chromadb
  volumes:
    - webapp-db:/app/db
```
