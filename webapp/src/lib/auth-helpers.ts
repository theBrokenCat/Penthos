import { auth } from "@/lib/auth"
import { db, initDb } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"
import { NextRequest } from "next/server"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) throw new Error("UNAUTHORIZED")
  return user
}

export async function requireRole(role: "admin" | "analyst") {
  const user = await requireAuth()
  const roles: Record<string, number> = { admin: 3, analyst: 2, viewer: 1 }
  const userRole = (user as any).role ?? "viewer"
  if ((roles[userRole] ?? 1) < (roles[role] ?? 0)) throw new Error("FORBIDDEN")
  return user
}

export async function logAuditEvent(params: {
  userId?: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}) {
  try {
    initDb()
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: params.userId ?? null,
      action: params.action,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      createdAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error("Failed to log audit event:", e)
  }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}
