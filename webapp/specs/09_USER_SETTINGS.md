# Spec 09 — Perfil de Usuario & Configuración

## Ruta: `/settings`

Pantalla dividida en secciones accesibles desde un menú lateral interno:

```
Settings
├── Perfil
├── Seguridad
├── API Keys
├── Notificaciones
├── Apariencia
└── Administración (solo admin)
    ├── Usuarios
    ├── Audit Log
    └── Sistema
```

---

## Sección: Perfil

```
Avatar: [foto circular 96px]  [Cambiar foto]

Nombre completo:  [Arturo Salvador Mayor     ]
Email:            [salvadormayorarturo@gmail.com] (no editable)
Rol:              Administrador (badge, no editable por el usuario)
Miembro desde:    17 de marzo de 2026
Último acceso:    Hoy, 17:30 · IP: 192.168.1.5

                                        [Guardar cambios]
```

- El avatar puede cambiarse subiendo una imagen (max 2MB, .jpg/.png)
- Si no hay avatar: iniciales del nombre con fondo de color generado por hash

---

## Sección: Seguridad

### Cambiar contraseña
```
Contraseña actual:    [______________] 👁
Nueva contraseña:     [______________] 👁
Confirmar nueva:      [______________] 👁

Requisitos:
✅ Mínimo 8 caracteres
✅ Una mayúscula
✅ Un número
✅ Un símbolo

                              [Cambiar contraseña]
```

### Autenticación de dos factores (2FA)
```
Estado: ○ Desactivada

[Activar 2FA]  →  Modal con QR code para Google Authenticator
```

Si está activa:
```
Estado: ● Activa (TOTP)

Última verificación: Hoy, 17:30

[Desactivar 2FA]  [Ver códigos de recuperación]
```

### Sesiones activas
```
Dispositivo               Última actividad    IP
Chrome — macOS            Ahora              192.168.1.5  [Esta sesión]
Firefox — macOS           Ayer, 14:22        192.168.1.5
                                             [Cerrar todas las demás sesiones]
```

---

## Sección: API Keys

```
Tus API Keys (1)
──────────────────────────────────────────────────────
sk_live_•••••••••••••••••••••••••••••7f3a
Scopes: audits:read, reports:read
Creada: 10 Mar 2026  ·  Último uso: 17 Mar 2026
                                              [Revocar]
──────────────────────────────────────────────────────
                                    [+ Nueva API Key]
```

### Modal de nueva API key
```
Nombre de la key (para identificarla):
[CI/CD pipeline                      ]

Permisos:
☑ audits:read     — Leer auditorías y findings
☐ audits:write    — Crear y gestionar auditorías
☑ reports:read    — Descargar informes
☐ reports:write   — Generar informes
☐ admin           — Acceso completo (solo admins)

Expiración:
○ No expira  ● 90 días  ○ 1 año  ○ Personalizado

                          [Cancelar]  [Crear Key]
```

⚠️ Tras crear la key, se muestra UNA SOLA VEZ y no puede recuperarse:
```
Tu nueva API Key:
sk_live_a8f3d2e1c9b7f4e2a1d3c5e7f9b2d4f6

⚠️ Cópiala ahora. No podrás verla de nuevo.
                              [Copiar al portapapeles]  [Hecho]
```

---

## Sección: Notificaciones

```
Notificaciones en el portal

☑ HITL Review pendiente — agente solicita aprobación
☑ Auditoría completada
☑ Error en agente
☐ Nuevo finding crítico (en tiempo real)
☐ Informe generado y listo

Notificaciones por email (próximamente)
○ Desactivadas
```

---

## Sección: Apariencia

```
Tema:
● Oscuro (recomendado)   ○ Claro   ○ Sistema

Idioma de la interfaz:
● Español   ○ English

Densidad de la interfaz:
○ Compacta   ● Normal   ○ Confortable

Vista por defecto de auditorías:
○ Tabla   ● Cards

Número de items por página:
[20 ▼]
```

---

## Sección: Administración (solo admin)

### Gestión de usuarios

Tabla de todos los usuarios:
```
Nombre          Email                    Rol        Estado    Acciones
Arturo S.       arturo@...              Admin      ● Activo  [···]
María García    maria@...               Analyst    ● Activo  [···]
Juan Pérez      juan@...                Viewer     ○ Inactivo [···]
```

Acciones por usuario:
- Cambiar rol (admin/analyst/viewer)
- Activar / Desactivar
- Forzar logout (invalida todas sus sesiones)
- Enviar invitación (si aún no ha aceptado)
- Eliminar (requiere confirmación con nombre de usuario)

### Crear usuario
Modal con: Nombre, Email, Rol, "Enviar invitación por email" o "Establecer contraseña manual"

### Audit Log del sistema
```
Filtros: [Usuario ▼] [Tipo de acción ▼] [Rango de fechas ▼]

Timestamp          Usuario   Acción                    IP
17 Mar 17:45:02   Arturo    audit.create "Juice Shop"  192.168.1.5
17 Mar 17:44:50   Arturo    user.login                 192.168.1.5
17 Mar 16:30:11   Arturo    report.generate (exec)     192.168.1.5
17 Mar 14:22:30   María     finding.false_positive     10.0.0.3
```

### Configuración del sistema
```
OpenClaw Gateway URL:  [http://localhost:3000    ]  [Probar conexión ✅]
ChromaDB Host:         [localhost:8000           ]  [Probar conexión ✅]
ZAP API URL:           [http://localhost:8080    ]  [Probar conexión ❌]

Modelo LLM por defecto:  [claude-haiku-4-5 ▼]

Retención de informes: [90 días ▼]
Max tamaño informe:    [50 MB ▼]

                                              [Guardar configuración]
```
