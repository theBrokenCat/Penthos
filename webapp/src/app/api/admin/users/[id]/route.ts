import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updateUserSchema = z.object({
  role: z.enum(["admin", "analyst", "viewer"]).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initDb()
    const { id } = await params
    const authUser = await requireAuth()
    await requireRole("admin")

    const body = await req.json()
    const validatedData = updateUserSchema.parse(body)

    const user = await db.select().from(users).where(eq(users.id, id))

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Usuario no encontrado" } },
        { status: 404 }
      )
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    }

    if (validatedData.role !== undefined) updates.role = validatedData.role
    if (validatedData.isActive !== undefined) updates.isActive = validatedData.isActive

    await db.update(users).set(updates).where(eq(users.id, id))

    const updated = await db.select().from(users).where(eq(users.id, id))

    return NextResponse.json({
      data: {
        id: updated[0].id,
        email: updated[0].email,
        name: updated[0].name,
        role: updated[0].role,
        isActive: updated[0].isActive,
        updatedAt: updated[0].updatedAt,
      },
    })
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
    const authUser = await requireAuth()
    await requireRole("admin")

    // No permitir que se elimine a sí mismo
    if (id === (authUser as any).id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "No puedes eliminar tu propia cuenta" } },
        { status: 403 }
      )
    }

    const user = await db.select().from(users).where(eq(users.id, id))

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Usuario no encontrado" } },
        { status: 404 }
      )
    }

    await db.update(users).set({ isActive: false }).where(eq(users.id, id))

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
