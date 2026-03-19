import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { z } from "zod"

const setupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    initDb()

    // Verificar que no hay usuarios ya
    const existingUsers = await db.select().from(users).limit(1)
    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "SETUP_DONE",
            message: "El portal ya está configurado",
          },
        },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { name, email, password } = setupSchema.parse(body)

    const passwordHash = await bcrypt.hash(password, 12)
    const now = new Date().toISOString()

    await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SETUP_ERROR", message: error.message } },
      { status: 500 }
    )
  }
}
