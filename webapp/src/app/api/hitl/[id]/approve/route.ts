import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { hitlReviews } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb()
    const { id } = await params
    const user = await requireAuth()

    const review = await db.select().from(hitlReviews).where(eq(hitlReviews.id, id))

    if (!review || review.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Review no encontrada" } },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    await db
      .update(hitlReviews)
      .set({
        status: "approved" as const,
        reviewedBy: (user as any).id,
        reviewedAt: now,
      })
      .where(eq(hitlReviews.id, id))

    const updated = await db.select().from(hitlReviews).where(eq(hitlReviews.id, id))

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
