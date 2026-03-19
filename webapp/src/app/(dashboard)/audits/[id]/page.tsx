import { notFound } from "next/navigation"
import { db, initDb } from "@/lib/db"
import { audits } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { AuditDetail } from "@/components/audits/AuditDetail"

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  initDb()
  const [audit] = await db.select().from(audits).where(eq(audits.id, id))
  if (!audit) notFound()

  return <AuditDetail audit={audit as any} />
}
