# OpenClaw Pentester — Project Hub

> Base de conocimiento y tracker de desarrollo de la plataforma de auditoría multi-agente.

## Propósito

Construir una plataforma de pentesting web autónoma basada en OpenClaw, con agentes colaborativos que se especializan en diferentes fases de la auditoría. El objetivo final es operar como core tecnológico de una consultora de ciberseguridad.

## Navegación rápida

| Archivo / Carpeta | Contenido |
|---|---|
| `ARCHITECTURE.md` | Diseño técnico completo, stack, flujo de datos |
| `PROGRESS.md` | Estado actual del desarrollo, tareas pendientes |
| `agents/` | Especificación de cada agente (rol, skills, prompts) |
| `skills/` | Documentación de cada skill implementada |
| `stack/` | Decisiones tecnológicas y justificación |
| `references/` | Repos de referencia, APIs, documentación externa |
| `sessions/` | Log de sesiones de trabajo con Claude |

## Visión del sistema

```
Cliente solicita auditoría (dominio + scope)
              ↓
     [Agente Supervisor]
     Orquesta, asigna, consolida
              ↓
  ┌───────────────────────────┐
  │  [Agente Explorador]      │  → Spidering, formularios, sesiones
  │  [Agente Analista]        │  → Proxy HTTP/S, anomalías, endpoints
  │  [Agente Explotador]      │  → Payloads XSS/SQLi/IDOR/JWT...
  └───────────────────────────┘
              ↓
     [Agente Reporter]
     Genera informe profesional
```

## Principios de diseño

1. **No reinventar la rueda** — Los agentes delegan el escaneo pesado a Burp Suite / ZAP vía API
2. **Memoria compartida** — Vector DB compartida entre agentes para no duplicar trabajo
3. **HITL en puntos críticos** — Human-in-the-loop antes de acciones destructivas
4. **OpenClaw como plataforma** — Skills, gateway, multi-canal, orquestación
5. **Validación iterativa** — Labs de PortSwigger como banco de pruebas

## Estado actual

Ver `PROGRESS.md`
