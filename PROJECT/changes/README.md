# Registro de Cambios

> Actualizar este directorio **siempre que se haga un cambio**, sea de modelo, código, config o infraestructura.

## Estructura

| Archivo | Contenido |
|---|---|
| `models.md` | Cambios de modelo LLM y proveedor (Anthropic → Gemini → Ollama, etc.) |
| `config.md` | Cambios en los `openclaw.json` de los agentes (timeouts, tokens, subagents, etc.) |
| `code.md` | Cambios en scripts Python/TypeScript de las skills y el MCP server |
| `infrastructure.md` | Cambios en Docker (compose, Dockerfile, puertos, volúmenes, servicios) |
| `prompts.md` | Cambios en SOUL.md de los agentes (instrucciones, flujos, reglas) |

## Formato de cada entrada

```
## YYYY-MM-DD — Título corto del cambio

**Qué:** descripción de qué se cambió
**Por qué:** motivo o problema que lo provocó
**Efecto:** resultado esperado o verificado
**Archivos:** lista de archivos modificados
```

## Regla

Si un cambio no funciona y se revierte, documentarlo igual con estado `[REVERTIDO]`.
