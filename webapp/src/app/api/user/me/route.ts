import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { z } from "zod"

export async function GET() {
  try {
    initDb()
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        avatarUrl: users.avatarUrl,
        totpEnabled: users.totpEnabled,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        apiKeyName: users.apiKeyName,
        apiKeyCreatedAt: users.apiKeyCreatedAt,
        apiKeyScopes: users.apiKeyScopes,
      })
      .from(users)
      .where(eq(users.id, session.user.id))

    if (!user) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
    }

    return NextResponse.json({ data: user })
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: e.message } },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    initDb()
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    const body = await req.json()
    const allowed = z
      .object({
        name: z.string().min(2).max(100).optional(),
      })
      .parse(body)

    await db
      .update(users)
      .set({ ...allowed, updatedAt: new Date().toISOString() })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({ data: { success: true } })
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: "UPDATE_ERROR", message: e.message } },
      { status: 500 }
    )
  }
}
