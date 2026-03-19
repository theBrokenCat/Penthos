import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { audits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { updateAuditSchema } from "@/lib/validations/audits"
import { z } from "zod"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    return NextResponse.json({ data: audit[0] })
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb()
    const { id } = await params
    const user = await requireAuth()

    const body = await req.json()
    const validatedData = updateAuditSchema.parse(body)

    const audit = await db.select().from(audits).where(eq(audits.id, id))

    if (!audit || audit.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Auditoría no encontrada" } },
        { status: 404 }
      )
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }

    if (validatedData.name !== undefined) updates.name = validatedData.name
    if (validatedData.notes !== undefined) updates.notes = validatedData.notes
    if (validatedData.status !== undefined) updates.status = validatedData.status

    const result = await db.update(audits).set(updates).where(eq(audits.id, id))

    const updated = await db.select().from(audits).where(eq(audits.id, id))

    return NextResponse.json({ data: updated[0] })
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb()
    const { id } = await params
    await requireRole("admin")

    const audit = await db.select().from(audits).where(eq(audits.id, id))

    if (!audit || audit.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Auditoría no encontrada" } },
        { status: 404 }
      )
    }

    await db
      .update(audits)
      .set({ status: "archived" as const, updatedAt: new Date().toISOString() })
      .where(eq(audits.id, id))

    return NextResponse.json({ data: { success: true } })
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
