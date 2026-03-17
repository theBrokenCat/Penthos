# Spec 07 — Generación de Informes

## Objetivo

Generar informes profesionales de auditoría en formato Word (.docx) que puedan entregarse al cliente final. El portal invoca la skill `save_report` ya implementada en `pentester/skills/save_report/`.

---

## Tipos de informe

| Plantilla | Audiencia | Contenido |
|---|---|---|
| **Ejecutivo** | Dirección / Cliente no técnico | Resumen ejecutivo, estadísticas, criticidades, impacto de negocio |
| **Técnico** | Equipo de desarrollo / Sysadmin | Todos los findings con evidencias completas, request/response, PoC |
| **Completo** | CISO / Director de seguridad | Ejecutivo + Técnico + metodología + referencias |

---

## Flujo de generación

1. Usuario hace click en **"Generar informe"** desde la auditoría o el header
2. Modal de configuración (ver más abajo)
3. Se llama a `POST /api/reports/generate`
4. El API ejecuta el script Python con los datos de ChromaDB
5. El `.docx` generado se guarda en `/webapp/generated-reports/`
6. Se notifica al usuario con un toast + botón de descarga
7. El informe aparece en la lista de informes de la auditoría

---

## Modal de configuración del informe

```
┌────────────────────────────────────────┐
│  Generar Informe de Seguridad          │
│                                        │
│  Auditoría: Juice Shop v2              │
│                                        │
│  Plantilla:                            │
│  ○ Ejecutivo  ● Técnico  ○ Completo   │
│                                        │
│  Incluir:                              │
│  ☑ Findings críticos y altos          │
│  ☑ Evidencias (request/response)      │
│  ☑ Recomendaciones de mitigación      │
│  ☐ Findings informativos              │
│  ☑ Falsos positivos (marcados como FP)│
│                                        │
│  Datos del cliente (portada):          │
│  Empresa: [___________________]        │
│  Auditor: [Arturo Salvador    ]        │
│  Fecha:   [17 de marzo de 2026]        │
│                                        │
│  Idioma: ● Español ○ English           │
│                                        │
│          [Cancelar]  [Generar →]       │
└────────────────────────────────────────┘
```

---

## Estructura del informe Word generado

### Portada
- Logo (OpenClaw / consultora)
- Título: "Informe de Auditoría de Seguridad Web"
- Empresa auditada + URL objetivo
- Nombre del auditor
- Fecha
- Nivel de confidencialidad: "CONFIDENCIAL"

### 1. Resumen Ejecutivo
- Descripción del objetivo y alcance
- Metodología utilizada (agentes autónomos)
- Estadísticas de hallazgos (tabla: Crítico/Alto/Medio/Bajo)
- Gráfico de severidad (insertar imagen generada con matplotlib)
- Puntuación global de riesgo
- Top 3 hallazgos más críticos (descripción de impacto no técnica)
- Recomendaciones clave (lista de 5)

### 2. Metodología
- Fases: Reconocimiento → Análisis → Explotación
- Herramientas usadas (ZAP, Playwright, interactsh)
- Agentes y sus roles

### 3. Hallazgos Detallados (plantilla técnica/completa)
Para cada finding ordenado por severidad:
```
3.1 SQL Injection — UNION-based                           [CRÍTICO]
────────────────────────────────────────────────────────────────
Descripción:    Texto detallado del hallazgo
Endpoint:       POST /rest/products/search
Parámetro:      q
CVSSv3:         9.8 — AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H

Evidencia:
  Request:      [código formateado]
  Response:     [código formateado]
  Payload:      1' UNION SELECT null,email,password...

Impacto:        Extracción completa de credenciales de usuarios
Recomendación:  Usar prepared statements / ORM
Referencias:    CWE-89, OWASP A03:2021
```

### 4. Estadísticas y Métricas
- Tabla resumen de todos los hallazgos
- Cobertura de endpoints
- Tiempo total de auditoría

### 5. Conclusiones y Próximos Pasos
- Valoración global
- Acciones prioritarias por urgencia
- Recomendaciones de seguimiento

---

## Vista de informes generados (en detalle de auditoría)

```
Informes generados (3)
─────────────────────────────────────────────────────────
📄 Informe Técnico — 17 Mar 2026 18:02    2.4 MB  [Descargar] [🗑️]
📄 Informe Ejecutivo — 17 Mar 2026 16:30  840 KB  [Descargar] [🗑️]
📄 Informe Completo — 14 Mar 2026 11:00   4.1 MB  [Descargar] [🗑️]
```

---

## Integración técnica con save_report

```python
# El API route llama a este script con argumentos:
python3 pentester/skills/save_report/scripts/save_report.py \
  --session-id <chromadb_session_id> \
  --template technical \
  --output /webapp/generated-reports/<report_id>.docx \
  --client-name "ACME Corp" \
  --auditor-name "Arturo Salvador" \
  --include-evidence true
```

Si el script de save_report aún genera solo Markdown, el agente de desarrollo deberá:
1. Actualizar `save_report.py` para generar `.docx` usando `python-docx`
2. O crear un nuevo script `generate_docx.py` que convierta el Markdown a Word

---

## Variables de entorno para este módulo

```env
REPORTS_OUTPUT_DIR=./generated-reports
REPORTS_BASE_URL=http://localhost:4000/reports
MAX_REPORT_SIZE_MB=50
```
