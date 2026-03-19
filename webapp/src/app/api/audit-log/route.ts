import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"
import { and, gte, lte, eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    initDb()
    await requireRole("admin")

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let allLogs = await db.select().from(auditLog)

    // Filter in memory for simplicity
    allLogs = allLogs.filter((log: any) => {
      if (userId && log.userId !== userId) return false
      if (action && log.action !== action) return false
      if (startDate && log.createdAt < startDate) return false
      if (endDate && log.createdAt > endDate) return false
      return true
    })

    const total = allLogs.length
    const offset = (page - 1) * limit
    const data = allLogs.slice(offset, offset + limit)

    return NextResponse.json({
      data,
      meta: { total, page, limit },
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No autenticado" } },
        { status: 401 }
      )
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Sin permisos" } },
        { status: 403 }
      )
    }
    console.error(error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno" } },
      { status: 500 }
    )
  }
}
