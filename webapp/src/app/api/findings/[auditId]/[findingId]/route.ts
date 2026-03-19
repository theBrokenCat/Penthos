import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { audits, findingOverrides } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getFindingById, updateFinding } from "@/lib/chromadb"
import { z } from "zod"

const findingPatchSchema = z.object({
  isFalsePositive: z.boolean().optional(),
  isResolved: z.boolean().optional(),
  resolution: z.string().optional(),
  fpReason: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ auditId: string; findingId: string }> }
) {
  try {
    initDb()
    const { auditId, findingId } = await params
    const user = await requireAuth()

    const audit = await db.select().from(audits).where(eq(audits.id, auditId))

    if (!audit || audit.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Auditoría no encontrada" } },
        { status: 404 }
      )
    }

    const sessionId = audit[0].sessionId

    const finding = await getFindingById(sessionId, findingId)

    if (!finding) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Finding no encontrado" } },
        { status: 404 }
      )
    }

    // Aplicar overrides si existen
    const override = await db
      .select()
      .from(findingOverrides)
      .where(eq(findingOverrides.findingId, findingId))

    if (override.length > 0) {
      const o = override[0]
      finding.isFalsePositive = o.isFalsePositive || finding.isFalsePositive
      finding.isResolved = o.isResolved || finding.isResolved
      if (o.notes) finding.notes = o.notes
    }

    return NextResponse.json({ data: finding })
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ auditId: string; findingId: string }> }
) {
  try {
    initDb()
    const { auditId, findingId } = await params
    const user = await requireAuth()

    const body = await req.json()
    const validatedData = findingPatchSchema.parse(body)

    const audit = await db.select().from(audits).where(eq(audits.id, auditId))

    if (!audit || audit.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Auditoría no encontrada" } },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    // Actualizar o crear el override
    const existing = await db
      .select()
      .from(findingOverrides)
      .where(eq(findingOverrides.findingId, findingId))

    const updates = {
      findingId: findingId,
      auditId: auditId,
      isFalsePositive: validatedData.isFalsePositive ?? (existing.length > 0 ? existing[0].isFalsePositive : false),
      isResolved: validatedData.isResolved ?? (existing.length > 0 ? existing[0].isResolved : false),
      resolution: validatedData.resolution || (existing.length > 0 ? existing[0].resolution : null),
      fpReason: validatedData.fpReason || (existing.length > 0 ? existing[0].fpReason : null),
      notes: validatedData.notes || (existing.length > 0 ? existing[0].notes : null),
      updatedAt: now,
    }

    if (existing.length === 0) {
      await db.insert(findingOverrides).values(updates)
    } else {
      await db.update(findingOverrides).set(updates).where(eq(findingOverrides.findingId, findingId))
    }

    // Intentar actualizar en ChromaDB
    try {
      await updateFinding(findingId, validatedData)
    } catch (chromaError: any) {
      console.error("ChromaDB update failed (non-critical):", chromaError.message)
    }

    // Obtener el finding actualizado
    const sessionId = audit[0].sessionId
    const finding = await getFindingById(sessionId, findingId)

    if (finding) {
      const override = await db
        .select()
        .from(findingOverrides)
        .where(eq(findingOverrides.findingId, findingId))

      if (override.length > 0) {
        const o = override[0]
        finding.isFalsePositive = o.isFalsePositive || finding.isFalsePositive
        finding.isResolved = o.isResolved || finding.isResolved
        if (o.notes) finding.notes = o.notes
      }
    }

    return NextResponse.json({ data: finding })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No autenticado" } },
        { status: 401 }
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: error.issues } },
        { status: 400 }
      )
    }
    console.error(error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno" } },
      { status: 500 }
    )
  }
}
