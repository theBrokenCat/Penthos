import { auth } from "@/lib/auth"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { SettingsClient } from "@/components/settings/SettingsClient"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  initDb()
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id))
  if (!user) return null

  const isAdmin = user.role === "admin"

  return (
    <SettingsClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        apiKeyName: user.apiKeyName,
        apiKeyScopes: user.apiKeyScopes,
        apiKeyCreatedAt: user.apiKeyCreatedAt,
        totpEnabled: user.totpEnabled,
      }}
      isAdmin={isAdmin}
    />
  )
}
