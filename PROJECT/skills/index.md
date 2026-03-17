# Skills Index

Lista de todas las skills a implementar, agrupadas por categoría.

## Estado: 🔴 = Pendiente | 🟡 = En progreso | ✅ = Implementada

---

## Proxy y Burp Suite / ZAP

| Skill | Agente | Estado | Descripción |
|---|---|---|---|
| `get_proxy_history` | Analista | 🔴 | Extraer tráfico HTTP/S capturado en el proxy |
| `replay_modified_request` | Explotador | 🔴 | Alterar y reenviar peticiones del historial |
| `trigger_active_scan` | Analista | 🔴 | Enviar endpoint al escáner activo de Burp/ZAP |
| `parse_scan_issues` | Analista | 🔴 | Parsear y estructurar hallazgos del escáner |

## Reconocimiento (Recon)

| Skill | Agente | Estado | Descripción |
|---|---|---|---|
| `spider_endpoint` | Explorador | 🔴 | Rastrear URLs, formularios y rutas de la app |
| `extract_js_secrets` | Explorador | 🔴 | Buscar tokens, API keys y endpoints en JS |
| `analyze_tech_stack` | Explorador | 🔴 | Detectar frameworks, servidor, CMS, versiones |

## Análisis y Explotación

| Skill | Agente | Estado | Descripción |
|---|---|---|---|
| `fuzz_parameters` | Explotador | 🔴 | Fuerza bruta en directorios y parámetros |
| `test_auth_bypass` | Explotador | 🔴 | Manipular JWT, evadir controles de autenticación |
| `generate_oob_payload` | Explotador | 🔴 | Crear payloads Out-of-Band (Collaborator/interactsh) |
| `bypass_client_controls` | Explotador | 🔴 | Modificar cabeceras y validaciones del cliente |

## Memoria y Control

| Skill | Agente | Estado | Descripción |
|---|---|---|---|
| `store_finding_in_vector_db` | Todos | 🔴 | Guardar hallazgos en la memoria compartida |
| `query_attack_surface` | Supervisor / Todos | 🔴 | Consultar URLs, endpoints y findings ya explorados |
| `request_human_review` | Supervisor / Explotador | 🔴 | Pausar y pedir confirmación humana (HITL) |

---

## Prioridad de implementación

1. `spider_endpoint` + `store_finding_in_vector_db` + `query_attack_surface` — base del sistema
2. `get_proxy_history` + `parse_scan_issues` — integración con proxy
3. `replay_modified_request` + `fuzz_parameters` — capacidad de explotación básica
4. Resto de skills avanzadas
