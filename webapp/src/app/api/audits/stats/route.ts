import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { audits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    initDb()
    const user = await requireAuth()

    const allAudits = await db.select().from(audits)

    const stats = {
      total: allAudits.length,
      running: allAudits.filter((a) => a.status === "running").length,
      completed: allAudits.filter((a) => a.status === "completed").length,
      failed: allAudits.filter((a) => a.status === "failed").length,
      paused: allAudits.filter((a) => a.status === "paused").length,
      archived: allAudits.filter((a) => a.status === "archived").length,
      queued: allAudits.filter((a) => a.status === "queued").length,
      criticalFindings: allAudits.reduce((sum, a) => sum + (a.criticalCount || 0), 0),
      hitlPending: 0,
    }

    return NextResponse.json({ data: stats })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No autenticado" } },
        { status: 401 }
      )
    }
    console.error(error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno" } },
      { status: 500 }
    )
  }
}
