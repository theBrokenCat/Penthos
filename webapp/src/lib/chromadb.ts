import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import type { Finding } from "@/types"

const execFileAsync = promisify(execFile)

// Base path para los scripts del pentester
const PENTESTER_BASE = path.join(process.cwd(), "..", "pentester")
const SCRIPTS_BASE = path.join(PENTESTER_BASE, "skills")

export interface FindingFilters {
  severity?: string[]
  type?: string[]
  agent?: string
  search?: string
}

export async function getFindings(
  sessionId: string | null,
  filters?: FindingFilters
): Promise<Finding[]> {
  if (!sessionId) {
    return []
  }

  try {
    const queryScriptPath = path.join(
      SCRIPTS_BASE,
      "query_attack_surface",
      "scripts",
      "query.py"
    )

    const args: string[] = ["--session-id", sessionId, "--format", "json"]

    if (filters?.severity && filters.severity.length > 0) {
      args.push("--severity", filters.severity.join(","))
    }
    if (filters?.type && filters.type.length > 0) {
      args.push("--type", filters.type.join(","))
    }
    if (filters?.agent) {
      args.push("--agent", filters.agent)
    }
    if (filters?.search) {
      args.push("--search", filters.search)
    }

    const { stdout } = await execFileAsync("python3", [queryScriptPath, ...args], {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    })

    const data = JSON.parse(stdout)
    return Array.isArray(data) ? data : data.findings || []
  } catch (error: any) {
    console.error("ChromaDB getFindings error:", error.message)
    return []
  }
}

export async function getFindingById(sessionId: string | null, findingId: string): Promise<Finding | null> {
  if (!sessionId) {
    return null
  }

  try {
    const findings = await getFindings(sessionId)
    return findings.find((f) => f.id === findingId) || null
  } catch (error: any) {
    console.error("ChromaDB getFindingById error:", error.message)
    return null
  }
}

export async function getFindingsStats(
  sessionId: string | null
): Promise<{
  total: number
  bySeverity: Record<string, number>
  byType: Record<string, number>
}> {
  if (!sessionId) {
    return { total: 0, bySeverity: {}, byType: {} }
  }

  try {
    const findings = await getFindings(sessionId)
    const stats = {
      total: findings.length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    }

    for (const finding of findings) {
      stats.bySeverity[finding.severity] = (stats.bySeverity[finding.severity] || 0) + 1
      stats.byType[finding.type] = (stats.byType[finding.type] || 0) + 1
    }

    return stats
  } catch (error: any) {
    console.error("ChromaDB getFindingsStats error:", error.message)
    return { total: 0, bySeverity: {}, byType: {} }
  }
}

export async function updateFinding(
  findingId: string,
  patch: {
    isFalsePositive?: boolean
    isResolved?: boolean
    resolution?: string
    fpReason?: string
    notes?: string
  }
): Promise<void> {
  // La actualización de findings se hace a través de la tabla finding_overrides en SQLite
  // Esta función es un placeholder para futuras integraciones con ChromaDB
  // El almacenamiento real ocurre en las rutas API

  try {
    const storeScriptPath = path.join(
      SCRIPTS_BASE,
      "store_finding_in_vector_db",
      "scripts",
      "store.py"
    )

    const args: string[] = ["--finding-id", findingId, "--format", "json"]

    if (patch.notes) {
      args.push("--notes", patch.notes)
    }
    if (patch.isFalsePositive !== undefined) {
      args.push("--false-positive", patch.isFalsePositive ? "true" : "false")
    }

    await execFileAsync("python3", [storeScriptPath, ...args], {
      timeout: 15000,
    })
  } catch (error: any) {
    console.error("ChromaDB updateFinding error:", error.message)
    // No lanzar excepción, solo registrar
  }
}
