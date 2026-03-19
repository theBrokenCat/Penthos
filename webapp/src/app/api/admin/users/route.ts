import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

export async function GET() {
  try {
    initDb()
    const session = await auth()
    const userRole = (session?.user as any)?.role
    if (userRole !== "admin") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
    }

    const all = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)

    return NextResponse.json({ data: all })
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: e.message } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    initDb()
    const session = await auth()
    const userRole = (session?.user as any)?.role
    if (userRole !== "admin") {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 })
    }

    const body = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["admin", "analyst", "viewer"]),
      })
      .parse(await req.json())

    const passwordHash = await bcrypt.hash(body.password, 12)
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    await db.insert(users).values({
      id,
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ data: { id } }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: "CREATE_ERROR", message: e.message } },
      { status: 500 }
    )
  }
}
