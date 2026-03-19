import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { audits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getFindingsStats } from "@/lib/chromadb"

export async function GET(req: NextRequest, { params }: { params: Promise<{ auditId: string }> }) {
  try {
    initDb()
    const { auditId } = await params
    const user = await requireAuth()

    const audit = await db.select().from(audits).where(eq(audits.id, auditId))

    if (!audit || audit.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Auditoría no encontrada" } },
        { status: 404 }
      )
    }

    const sessionId = audit[0].sessionId

    const stats = await getFindingsStats(sessionId)

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
