import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { audits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { startAudit } from "@/lib/openclaw"

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
        startedAt: now,
        updatedAt: now,
      })
      .where(eq(audits.id, id))

    // Intentar enviar a OpenClaw, pero continuar si falla
    try {
      const targetScope = audit[0].targetScope
        ? JSON.parse(audit[0].targetScope)
        : []

      await startAudit(
        id,
        {
          url: audit[0].targetUrl,
          scope: targetScope,
        },
        audit[0].agentConfig ? JSON.parse(audit[0].agentConfig) : {}
      )
    } catch (ocError: any) {
      console.error("Failed to notify OpenClaw:", ocError.message)
      // Continuar de todas formas
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
