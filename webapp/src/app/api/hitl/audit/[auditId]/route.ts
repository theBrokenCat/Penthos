import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { hitlReviews } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: Promise<{ auditId: string }> }) {
  try {
    initDb()
    const { auditId } = await params
    const user = await requireAuth()

    const reviews = await db
      .select()
      .from(hitlReviews)
      .where(eq(hitlReviews.auditId, auditId))
      .orderBy(desc(hitlReviews.createdAt))

    return NextResponse.json({ data: reviews })
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
