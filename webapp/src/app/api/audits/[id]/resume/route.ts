import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { audits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { resumeAudit } from "@/lib/openclaw"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb()
    const { id } = await params
    const user = await requireAuth()

    const audit = await db.select().from(audits).where(eq(audits.id, id))

    if (!audit || audit.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Auditoría no encontrada" } },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    await db
      .update(audits)
      .set({
        status: "running" as const,
        updatedAt: now,
      })
      .where(eq(audits.id, id))

    // Intentar notificar a OpenClaw
    try {
      await resumeAudit(id)
    } catch (ocError: any) {
      console.error("Failed to notify OpenClaw resume:", ocError.message)
    }

    const updated = await db.select().from(audits).where(eq(audits.id, id))

    return NextResponse.json({ data: updated[0] })
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
