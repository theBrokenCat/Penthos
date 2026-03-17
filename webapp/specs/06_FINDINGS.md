# Spec 06 — Detalle de Auditoría: Findings & Hallazgos

## Contexto

Accesible desde `/audits/[id]` como Tab "Findings". También accesible directamente desde el Dashboard al hacer click en un finding crítico.

---

## Layout general

Dos paneles horizontales:

```
┌─────────────────────┬─────────────────────────────────┐
│ LISTA DE FINDINGS   │ DETALLE DEL FINDING              │
│ (35%)               │ (65%)                            │
│                     │                                  │
│ [Filtros]           │ [Título + severidad]             │
│                     │ [Descripción]                    │
│ 🔴 SQL Injection    │ [Evidencia: request/response]    │
│ 🟠 JWT alg:none     │ [Recomendaciones]                │
│ 🟡 Info disclosure  │ [CVSS score]                     │
│ 🟡 Missing header   │ [Actions: FP | Nota | Exportar]  │
│ 🔵 Tech stack note  │                                  │
└─────────────────────┴─────────────────────────────────┘
```

---

## Panel izquierdo: Lista de Findings

### Filtros rápidos (chips en la parte superior)
- `Todos (24)` | `Crítico (3)` | `Alto (4)` | `Medio (8)` | `Bajo (9)`
- Toggle: `⚡ No resueltos` / `✅ Resueltos` / `🚫 Falsos positivos`
- Filtro por tipo: `Vulnerabilidad | Credencial | Endpoint | Tecnología | Nota`
- Filtro por agente: `Explorer | Analyst | Exploiter`
- Ordenar: Severidad (desc), Fecha (desc/asc), Tipo

### Tarjeta de finding en la lista

```
┌─────────────────────────────────┐
│ 🔴 CRÍTICO                       │
│ SQL Injection — UNION-based     │
│ /rest/products/search?q=        │
│ 🤖 Exploiter · 17 Mar 17:45     │
│ ✅ Confirmado con PoC            │
└─────────────────────────────────┘
```

- Click → carga detalle en panel derecho (sin navegar a otra página)
- Borde izquierdo de color según severidad

---

## Panel derecho: Detalle del Finding

### Header del finding
```
🔴 CRÍTICO — CVSSv3: 9.8
SQL Injection (UNION-based)
Encontrado por: Exploiter · 17 Mar 2026 17:45
```

### Sección: Descripción
Texto del hallazgo generado por el agente, en markdown renderizado.

### Sección: Endpoint afectado
```
Método:  POST
URL:     http://localhost:3000/rest/products/search
Param:   ?q= (GET parameter)
```

### Sección: Evidencia
Tabs entre Request / Response / Payload:

**Request**:
```http
GET /rest/products/search?q=1' UNION SELECT null,email,password,null,null,null,null,null,null FROM Users-- HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJ...
```

**Response** (con diff highlights):
```
HTTP/1.1 200 OK
[{"id":1,"name":"admin","description":"aRMiOMgdCc..."}]
```

**Payload usado**:
```
1' UNION SELECT null,email,password,null,null,null,null,null,null FROM Users--
```

### Sección: CVSS Score
- Visualización de las métricas CVSSv3
- Score numérico (ej: 9.8 Critical)
- Vector string: `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`

### Sección: Recomendaciones
Texto de mitigación generado por el agente (markdown).

### Sección: Referencias
Links a OWASP, CVE, CWE si el agente los proporcionó.

### Acciones del finding

```
[Marcar como resuelto]  [Falso positivo]  [Añadir nota]  [Exportar]
```

- **Marcar como resuelto**: abre campo de texto "Cómo se resolvió"
- **Falso positivo**: requiere nota obligatoria, pide confirmación
- **Añadir nota**: textarea con markdown, guarda en DB
- **Exportar**: copia finding formateado al portapapeles o descarga JSON

---

## Sección especial: Revisiones HITL pendientes

Si hay HITL reviews pendientes relacionadas con un finding, aparece un banner:

```
⚠️ Acción pendiente de aprobación
El agente Exploiter solicita ejecutar: extracción completa de la tabla Users
[Ver contexto completo]  [Aprobar]  [Rechazar]
```

---

## Vista estadística de findings

Toggle "Vista estadística" encima de la lista:

- **Gráfico de barras**: findings por severidad
- **Gráfico de dona**: findings por tipo (vuln, cred, endpoint, etc.)
- **Gráfico de timeline**: findings descubiertos por hora
- **Tabla**: Top 5 endpoints con más findings

---

## Schema de un finding (de ChromaDB)

```typescript
{
  id: string,
  sessionId: string,            // ID de la auditoría
  type: "vulnerability" | "credential" | "endpoint" | "tech_stack" | "anomaly",
  severity: "critical" | "high" | "medium" | "low" | "info",
  title: string,
  description: string,
  url: string,
  method: string | null,
  parameter: string | null,
  evidence: {
    request: string,
    response: string,
    payload: string | null
  },
  cvss: number | null,
  cvssVector: string | null,
  recommendation: string | null,
  references: string[],
  agent: string,                // agente que lo encontró
  confirmedByHuman: boolean,
  isFalsePositive: boolean,
  isResolved: boolean,
  notes: string | null,
  createdAt: string,
  metadata: Record<string, any>
}
```
