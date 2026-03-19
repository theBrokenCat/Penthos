import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { createHash } from "crypto"
import { z } from "zod"

export async function POST(req: NextRequest) {
  try {
    initDb()
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    const { name, scopes } = z
      .object({
        name: z.string().min(1).max(50),
        scopes: z.array(z.string()),
      })
      .parse(await req.json())

    const rawKey = `sk_${crypto.randomUUID().replace(/-/g, "")}`
    const keyHash = createHash("sha256").update(rawKey).digest("hex")
    const now = new Date().toISOString()

    await db
      .update(users)
      .set({
        apiKeyHash: keyHash,
        apiKeyName: name,
        apiKeyScopes: JSON.stringify(scopes),
        apiKeyCreatedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json(
      { data: { key: rawKey, name, scopes, createdAt: now } },
      { status: 201 }
    )
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: "CREATE_ERROR", message: e.message } },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    initDb()
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    await db
      .update(users)
      .set({
        apiKeyHash: null,
        apiKeyName: null,
        apiKeyScopes: null,
        apiKeyCreatedAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({ data: { success: true } })
  } catch (e: any) {
    return NextResponse.json(
      { error: { code: "DELETE_ERROR", message: e.message } },
      { status: 500 }
    )
  }
}
