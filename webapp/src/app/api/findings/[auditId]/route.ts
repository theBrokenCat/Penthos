import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { audits, findingOverrides } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getFindings } from "@/lib/chromadb"

export async function GET(req: NextRequest, { params }: { params: Promise<{ auditId: string }> }) {
  try {
    initDb()
    const { auditId } = await params
    const user = await requireAuth()

    const { searchParams } = new URL(req.url)
    const severity = searchParams.get("severity")?.split(",")
    const type = searchParams.get("type")?.split(",")
    const agent = searchParams.get("agent")
    const search = searchParams.get("search")

    const audit = await db.select().from(audits).where(eq(audits.id, auditId))

    if (!audit || audit.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Auditoría no encontrada" } },
        { status: 404 }
      )
    }

    const sessionId = audit[0].sessionId

    const findings = await getFindings(sessionId, {
      severity: severity || undefined,
      type: type || undefined,
      agent: agent || undefined,
      search: search || undefined,
    })

    // Obtener los overrides de la BD
    const overrides = await db
      .select()
      .from(findingOverrides)
      .where(eq(findingOverrides.auditId, auditId))

    const overrideMap = new Map(overrides.map((o) => [o.findingId, o]))

    // Aplicar overrides a los findings
    const enrichedFindings = findings.map((f) => {
      const override = overrideMap.get(f.id)
      if (override) {
        return {
          ...f,
          isFalsePositive: override.isFalsePositive || f.isFalsePositive,
          isResolved: override.isResolved || f.isResolved,
          notes: override.notes || f.notes,
        }
      }
      return f
    })

    return NextResponse.json({ data: enrichedFindings })
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
