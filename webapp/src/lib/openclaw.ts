import type { AgentInfo, AgentStatus } from "@/types"

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL ?? "http://localhost:3000"
const AGENT_PORTS: Record<string, number> = {
  supervisor: parseInt(process.env.OPENCLAW_SUPERVISOR_PORT ?? "3001"),
  explorer: parseInt(process.env.OPENCLAW_EXPLORER_PORT ?? "3002"),
  analyst: parseInt(process.env.OPENCLAW_ANALYST_PORT ?? "3003"),
  exploiter: parseInt(process.env.OPENCLAW_EXPLOITER_PORT ?? "3004"),
}

const TIMEOUT_MS = 5000

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("TIMEOUT")
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getGatewayStatus(): Promise<{ status: AgentStatus }> {
  try {
    const response = await fetchWithTimeout(`${GATEWAY_URL}/health`, {}, 2000)
    if (response.ok) {
      return { status: "online" }
    }
    return { status: "offline" }
  } catch {
    return { status: "offline" }
  }
}

export async function getAgentStatus(agentName: string): Promise<{ status: AgentStatus }> {
  const port = AGENT_PORTS[agentName]
  if (!port) {
    return { status: "offline" }
  }

  try {
    const response = await fetchWithTimeout(`http://localhost:${port}/health`, {}, 2000)
    if (response.ok) {
      return { status: "online" }
    }
    return { status: "offline" }
  } catch {
    return { status: "offline" }
  }
}

export async function getAllAgentsStatus(): Promise<Record<string, AgentInfo>> {
  const agents = ["supervisor", "explorer", "analyst", "exploiter"]
  const results: Record<string, AgentInfo> = {}

  const statuses = await Promise.all(agents.map((name) => getAgentStatus(name)))

  for (let i = 0; i < agents.length; i++) {
    const name = agents[i]
    const status = statuses[i].status

    results[name] = {
      name: name as any,
      status,
      currentTask: undefined,
      currentAuditId: undefined,
      findingsCount: 0,
      model: process.env.LLM_MODEL ?? "claude-haiku-4-5-20251001",
      port: AGENT_PORTS[name],
    }
  }

  return results
}

export async function pingAgent(agentName: string, timeout = 2000): Promise<boolean> {
  try {
    const result = await getAgentStatus(agentName)
    return result.status === "online"
  } catch {
    return false
  }
}

export async function startAudit(
  auditId: string,
  target: { url: string; scope?: string[] },
  config?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${GATEWAY_URL}/agents/supervisor/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: `Iniciar auditoría de ${target.url}`,
        context: {
          auditId,
          target,
          config,
        },
      }),
    })

    if (response.ok) {
      return { success: true }
    }
    return { success: false, error: `HTTP ${response.status}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function pauseAudit(auditId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${GATEWAY_URL}/audits/${auditId}/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    if (response.ok) {
      return { success: true }
    }
    return { success: false, error: `HTTP ${response.status}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function resumeAudit(auditId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetchWithTimeout(`${GATEWAY_URL}/audits/${auditId}/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    if (response.ok) {
      return { success: true }
    }
    return { success: false, error: `HTTP ${response.status}` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
