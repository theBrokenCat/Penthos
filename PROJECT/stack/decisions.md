# Decisiones Tecnológicas

## Tomadas ✅

### Plataforma base: OpenClaw
**Decisión**: Usar OpenClaw como plataforma de agentes.
**Razón**: Ya tiene gateway, skills system, ACP (Agent Control Protocol), Playwright integrado, soporte multi-canal y Docker. Evita construir infraestructura desde cero.

### Lenguaje: TypeScript / Node.js
**Decisión**: Seguir el stack de OpenClaw (TypeScript ESM, Node.js 22+).
**Razón**: Coherencia con el proyecto base. El ecosistema de OpenClaw es TS-first.

### Interacción web: Playwright
**Decisión**: Usar Playwright (ya integrado en OpenClaw).
**Razón**: Soporte completo de navegadores, manejo de SPA y JS, gestión de sesiones.

---

## Pendientes 🟡

### Motor de pentesting: Burp Suite Enterprise vs OWASP ZAP

| Criterio | Burp Suite Enterprise | OWASP ZAP |
|---|---|---|
| Coste | ~$$$$ / año | Gratis (open-source) |
| API REST | Sí, completa | Sí, completa |
| Calidad de escaneo | Superior, industry-standard | Buena, mejorada con addons |
| MCP disponible | `six2dez/burp-ai-agent` | Integración directa vía REST |
| Ideal para | Consultora establecida | Fase inicial / MVP |
| Burp Collaborator | Sí (OOB payloads) | interactsh (alternativa) |

**Recomendación**: Empezar con **ZAP** para el MVP (sin coste, API completa). Migrar a Burp Suite cuando haya clientes reales.

---

### Vector DB para memoria compartida

| Criterio | ChromaDB | LanceDB (en OpenClaw) | pgvector |
|---|---|---|---|
| Setup | Docker, sencillo | Ya integrado en OpenClaw | Requiere PostgreSQL |
| Persistencia | Sí | Sí | Sí (más robusta) |
| Rendimiento | Bueno | Bueno | Excelente a escala |
| Multiagente | Sí (servidor) | Depende de config | Sí |
| Recomendación | ✅ MVP | Evaluar primero | Producción |

**Recomendación**: Evaluar si LanceDB de OpenClaw cubre la memoria compartida entre agentes. Si no, usar ChromaDB para el MVP.

---

### Orquestación: ACP de OpenClaw vs CrewAI

| Criterio | ACP (OpenClaw nativo) | CrewAI |
|---|---|---|
| Integración | Perfecta, es el sistema nativo | Requiere glue code |
| Flexibilidad | Depende de lo que OpenClaw exponga | Alta, muy configurable |
| Curva de aprendizaje | Hay que estudiar el código de OpenClaw | Buena documentación |
| Mantenimiento | Un solo sistema | Dos sistemas |

**Recomendación**: Intentar con **ACP nativo de OpenClaw** primero. Solo añadir CrewAI si hay limitaciones concretas.

---

## Referencias

Ver `references/repos.md` para repos de GitHub relevantes.
