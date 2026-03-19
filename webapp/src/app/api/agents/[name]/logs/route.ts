import { NextRequest, NextResponse } from "next/server"

interface LogEntry {
  timestamp: string
  level: "DEBUG" | "INFO" | "WARN" | "ERROR"
  message: string
}

// Simulamos un almacenamiento de logs en memoria
// En producción, esto vendría de un servicio real (CloudWatch, ELK, etc.)
const logsStorage: Record<string, LogEntry[]> = {
  supervisor: [
    { timestamp: "10:23:45", level: "INFO", message: "Supervisor iniciado" },
    { timestamp: "10:23:46", level: "INFO", message: "Esperando tareas..." },
  ],
  explorer: [
    { timestamp: "10:23:47", level: "INFO", message: "Iniciando crawl de /rest/products" },
    { timestamp: "10:23:48", level: "DEBUG", message: "Encontrado endpoint: GET /rest/categories" },
    { timestamp: "10:23:49", level: "INFO", message: "23 endpoints descubiertos" },
  ],
  analyst: [
    { timestamp: "10:23:50", level: "INFO", message: "Analizando endpoints..." },
    { timestamp: "10:23:51", level: "WARN", message: "Endpoint sin autenticación: /admin" },
  ],
  exploiter: [
    { timestamp: "10:23:52", level: "INFO", message: "Esperando vulnerabilidades..." },
  ],
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    const limit = req.nextUrl.searchParams.get("limit") || "100"
    const limitNum = Math.min(parseInt(limit), 500)

    const logs = logsStorage[name] || []
    const recentLogs = logs.slice(-limitNum)

    return NextResponse.json({
      data: {
        agent: name,
        logs: recentLogs,
        total: logs.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: error.message } },
      { status: 500 }
    )
  }
}
