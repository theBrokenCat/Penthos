# AGENT_9_SETTINGS — Perfil de Usuario & Configuración

## Misión
Implementar la pantalla `/settings` con todas sus secciones: perfil del usuario, cambio de contraseña, 2FA, API keys, notificaciones, apariencia y (para admins) gestión de usuarios, audit log del sistema y configuración técnica.

## Prerrequisitos
- AGENT_1_AUTH ✅ (DB schema con users, audit_log, sesiones)
- AGENT_2_BACKEND ✅ (rutas /api/user/me/*, /api/admin/users/*)
- AGENT_3_FRONTEND ✅ (layout y design system)
- Leer: `webapp/specs/09_USER_SETTINGS.md`

## Entregables

### 1. Página principal de settings (`src/app/(dashboard)/settings/page.tsx`)
Layout con menú lateral interno + área de contenido:
```
┌──────────────────┬────────────────────────────────┐
│ Perfil           │  [Contenido de la sección]     │
│ Seguridad        │                                │
│ API Keys         │                                │
│ Notificaciones   │                                │
│ Apariencia       │                                │
│ ─────────────── │                                │
│ Administración   │                                │
│   └ Usuarios     │                                │
│   └ Audit Log    │                                │
│   └ Sistema      │                                │
└──────────────────┴────────────────────────────────┘
```
- "Administración" solo visible para usuarios con `role === "admin"`
- Menú activo resaltado
- En móvil: menú arriba como select/tabs

### 2. Sección Perfil (`src/components/settings/ProfileSection.tsx`)
- Avatar clickable → input file oculto → upload `POST /api/user/me/avatar`
- Nombre: input controlado + guardado con `PATCH /api/user/me`
- Email: readonly, badge con el rol actual
- Metadatos: "Miembro desde" + "Último acceso con IP"
- Botón "Guardar cambios" con estado loading y confirmación toast

### 3. Sección Seguridad (`src/components/settings/SecuritySection.tsx`)

**Cambio de contraseña:**
- 3 campos (actual, nueva, confirmar) con toggle show/hide
- Validación cliente: requisitos de contraseña en tiempo real (checkmarks)
- `POST /api/user/me/password`
- Limpiar campos tras éxito

**2FA TOTP:**
- Si desactivado: botón "Activar 2FA"
  - Abre modal: genera QR con `qrcode` npm + `otplib`
  - `POST /api/user/me/2fa/setup` → devuelve `{ qrDataUrl, secret }`
  - Usuario escanea con Authenticator
  - Input de verificación del código de 6 dígitos
  - `POST /api/user/me/2fa/verify` → activa si el código es correcto
- Si activado: badge "Activa" + botón "Desactivar" (requiere contraseña actual)

**Sesiones activas:**
- `GET /api/user/me/sessions` → lista de sesiones
- Badge "Esta sesión" en la sesión actual
- Botón "Cerrar todas las demás" → `DELETE /api/user/me/sessions/others`

### 4. Sección API Keys (`src/components/settings/ApiKeysSection.tsx`)

**Lista de keys existentes:**
- Mostrar: nombre, primeros/últimos 8 chars (el resto con •), scopes, fecha creación, último uso
- Botón revocar → `DELETE /api/user/me/api-key` con confirmación

**Modal crear nueva key:**
- Input nombre
- Checkboxes de scopes (audits:read, audits:write, reports:read, reports:write)
- Select expiración
- `POST /api/user/me/api-key`

**Modal "tu nueva API key":**
- Mostrar la key real completa (SOLO una vez)
- Botón "Copiar al portapapeles" (con feedback visual)
- Advertencia visual prominente
- No se puede cerrar accidentalmente (requiere click en "He copiado mi clave")

### 5. Sección Notificaciones (`src/components/settings/NotificationsSection.tsx`)
- Toggle switches para cada tipo de notificación
- `PATCH /api/user/me/preferences { notifications: {...} }`
- Sin backend de email por ahora (toggles solo para UI/SSE notifications)

### 6. Sección Apariencia (`src/components/settings/AppearanceSection.tsx`)
- **Tema**: 3 cards clicables (Oscuro / Claro / Sistema) — usar ThemeProvider de next-themes
- **Idioma**: select (Español / English) — solo visual por ahora, i18n en Fase 2
- **Densidad**: radio buttons → añadir clase CSS al `<html>` (compact/normal/comfortable)
- **Vista auditorías**: radio → guarda en localStorage
- **Items por página**: select → guarda en localStorage
- Todos los cambios de apariencia son instantáneos (sin botón guardar)

### 7. Sección Admin — Usuarios (`src/components/settings/admin/UsersSection.tsx`)
Solo visible para `role === "admin"`.

**Tabla de usuarios:**
- Columnas: Avatar+Nombre, Email, Rol (badge), Estado, Último acceso, Acciones
- Acciones: `<DropdownMenu>` con Cambiar rol, Activar/Desactivar, Forzar logout, Eliminar

**Modal crear usuario:**
- Nombre, email, rol, contraseña (o toggle "Generar contraseña temporal")
- `POST /api/admin/users`

**Modal cambiar rol:**
- Select con los 3 roles disponibles
- Warning: "Cambiar a admin dará acceso completo al sistema"
- `PATCH /api/admin/users/:id { role: "..." }`

### 8. Sección Admin — Audit Log (`src/components/settings/admin/AuditLogSection.tsx`)
- Tabla paginada con `GET /api/audit-log`
- Filtros: usuario (select), tipo de acción (select), rango de fechas (DateRangePicker)
- Columnas: Timestamp, Usuario, Acción, Detalles, IP
- Exportar a CSV: botón que genera y descarga el CSV de la vista actual

### 9. Sección Admin — Sistema (`src/components/settings/admin/SystemSection.tsx`)
- Inputs para URLs de servicios (Gateway, ChromaDB, ZAP) con botón "Probar conexión"
- Al click en "Probar": llama a `/api/system/status` y muestra ✅ o ❌ junto al input
- Select modelo LLM por defecto
- Selects de retención de informes y tamaño máximo
- `POST /api/admin/settings/system` al guardar

## Criterios de aceptación
- [ ] El menú lateral navega entre secciones sin reload de página
- [ ] El avatar se puede subir y se muestra actualizado
- [ ] Cambio de contraseña funciona y limpia los campos tras éxito
- [ ] La sección 2FA muestra QR real (aunque no haya autenticador disponible)
- [ ] El modal de nueva API Key muestra la key real UNA sola vez
- [ ] El toggle de tema cambia el tema inmediatamente
- [ ] La sección de administración solo aparece para admins
- [ ] La tabla de usuarios carga datos reales
- [ ] El audit log se puede filtrar y paginar
- [ ] El test de conexión de servicios muestra resultado visual
