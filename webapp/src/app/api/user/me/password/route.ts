import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

export async function POST(req: NextRequest) {
  try {
    initDb()
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    const { currentPassword, newPassword } = z
      .object({
        currentPassword: z.string().min(6),
        newPassword: z.string().min(8),
      })
      .parse(await req.json())

    const [user] = await db.select().from(users).where(eq(users.id, session.user.id))
    if (!user) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        {
          error: { code: "WRONG_PASSWORD", message: "Contraseña actual incorrecta" },
        },
        { status: 400 }
      )
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id))

    return NextResponse.json({ data: { success: true } })
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: "UPDATE_ERROR", message: e.message } },
      { status: 500 }
    )
  }
}
