# AGENT_7_REPORTS — Generación de Informes Word

## Misión
Implementar el flujo completo de generación de informes: modal de configuración, llamada al backend que invoca el script Python de save_report, descarga del .docx y gestión del historial de informes.

## Prerrequisitos
- AGENT_2_BACKEND ✅ (rutas /api/reports/*)
- AGENT_5_AUDITS ✅ (botón "Generar informe" existe en el header del detalle)
- Leer: `webapp/specs/07_REPORTS.md`

## Entregables

### 1. Modal de generación (`src/components/reports/GenerateReportModal.tsx`)
Modal con los campos descritos en spec 07:
- Plantilla: radio buttons (Ejecutivo / Técnico / Completo)
- Checkboxes de contenido a incluir
- Campos del cliente (empresa, auditor, fecha)
- Idioma: radio buttons

Al confirmar:
1. Mostrar estado "Generando informe..." con spinner
2. POST /api/reports/generate con la config
3. Polling hasta que el informe esté listo (o webhook/SSE si está implementado)
4. Toast de éxito con botón "Descargar ahora"
5. Actualizar la lista de informes en la pestaña

### 2. Actualizar script Python `save_report.py`
El script actual genera Markdown. Debe generar `.docx` con `python-docx`.

Instalar dependencia:
```bash
pip3 install python-docx --break-system-packages
```

Actualizar `pentester/skills/save_report/scripts/save_report.py`:

**Estructura del .docx generado:**
- Portada (título, empresa, auditor, fecha, "CONFIDENCIAL")
- Tabla de contenidos
- Resumen ejecutivo (si plantilla != técnico)
- Sección por cada finding (ordenado por severidad)
  - Encabezado H2 con título y badge de severidad en el texto
  - Descripción
  - Tabla de detalles técnicos (Endpoint, Método, Parámetro, CVSS)
  - Bloques de código para request/response (fuente Courier New, fondo gris)
  - Recomendación
- Estadísticas finales
- Tabla resumen de todos los hallazgos

**Argumentos del script:**
```
python3 save_report.py \
  --session-id <id> \
  --output <ruta.docx> \
  --template executive|technical|full \
  --client-name "ACME" \
  --auditor-name "Arturo" \
  --lang es|en \
  --include-evidence true|false \
  --include-fp false|true
```

### 3. Tab "Informes" en el detalle de auditoría
Añadir un nuevo tab (o sección dentro de "Configuración") al detalle de auditoría.

**Componente `<ReportsList>`** (`src/components/reports/ReportsList.tsx`):
```
Informes generados (2)
──────────────────────────────────────────────────
📄 Informe Técnico    17 Mar 18:02   2.4 MB  [⬇️] [🗑️]
📄 Informe Ejecutivo  17 Mar 16:30   840 KB  [⬇️] [🗑️]
──────────────────────────────────────────────────
                              [+ Generar nuevo informe]
```

### 4. Ruta de descarga
Al click en [⬇️]:
```typescript
// Navegar a /api/reports/download/:id
// El API sirve el archivo con:
// Content-Disposition: attachment; filename="informe-juice-shop-v2.docx"
// Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### 5. Generación de imagen de estadísticas (opcional pero recomendado)
Para incluir un gráfico visual en la portada/resumen ejecutivo del .docx:

```python
# En save_report.py, generar con matplotlib:
import matplotlib.pyplot as plt
import io

def generate_severity_chart(findings):
    # Gráfico de barras por severidad
    # Guardar a BytesIO
    # Insertar en el .docx con doc.add_picture()
```

Si matplotlib no está disponible, omitir la imagen y usar una tabla de texto.

### 6. Manejo de errores en la generación
- Si ChromaDB no tiene findings → generar informe con nota "Sin hallazgos registrados"
- Si el script Python falla → mostrar error detallado en la UI con el stderr del proceso
- Si el informe supera 50MB → truncar findings y añadir nota

## Criterios de aceptación
- [ ] El modal de generación se abre desde el botón en el header de auditoría
- [ ] La generación muestra spinner mientras procesa
- [ ] El .docx descargado es un documento Word válido (abre en LibreOffice/Word)
- [ ] El documento incluye: portada, findings ordenados por severidad, recomendaciones
- [ ] Los bloques de código en el .docx usan fuente monoespaciada
- [ ] La lista de informes se actualiza tras generar uno nuevo
- [ ] La descarga funciona correctamente (headers correctos)
- [ ] Si no hay findings, el informe se genera igualmente con mensaje apropiado

## Nota sobre python-docx
Instalar en el sistema si no está:
```bash
pip3 install python-docx --break-system-packages
pip3 install matplotlib --break-system-packages  # para el gráfico
```
