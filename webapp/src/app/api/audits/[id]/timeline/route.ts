import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb()
    const { id } = await params
    const user = await requireAuth()

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") ?? "50")

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.targetId, id))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)

    return NextResponse.json({ data: entries })
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
