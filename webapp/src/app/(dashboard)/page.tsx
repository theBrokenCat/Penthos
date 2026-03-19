import { auth } from "@/lib/auth"
import { db, initDb } from "@/lib/db"
import { audits, hitlReviews } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/StatCard"
import { RecentAudits } from "@/components/dashboard/RecentAudits"
import { AgentsSummary } from "@/components/dashboard/AgentsSummary"
import { FindingsChart } from "@/components/dashboard/FindingsChart"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import {
  Plus,
  FolderSearch,
  Activity,
  ShieldAlert,
  UserCheck,
} from "lucide-react"
import Link from "next/link"

async function getStats() {
  try {
    initDb()
    const allAudits = await db.select().from(audits)
    const pendingReviews = await db
      .select()
      .from(hitlReviews)
      .where(eq(hitlReviews.status, "pending"))
    return {
      total: allAudits.length,
      running: allAudits.filter((a) => a.status === "running").length,
      criticalFindings: allAudits.reduce((s, a) => s + a.criticalCount, 0),
      hitlPending: pendingReviews.length,
    }
  } catch {
    return { total: 0, running: 0, criticalFindings: 0, hitlPending: 0 }
  }
}

export default async function DashboardPage() {
  const [session, stats] = await Promise.all([auth(), getStats()])

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${session?.user?.name?.split(" ")[0] ?? "Arturo"} 👋`}
        description="Panel de control de OpenClaw Pentester"
        actions={
          <Button
            size="sm"
            asChild
            className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          >
            <Link href="/audits">
              <Plus className="w-4 h-4" />
              Nueva auditoría
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Auditorías"
          value={stats.total}
          icon={FolderSearch}
          colorClass="text-blue-400"
          href="/audits"
        />
        <StatCard
          title="En Ejecución"
          value={stats.running}
          icon={Activity}
          colorClass={stats.running > 0 ? "text-green-400" : "text-zinc-500"}
          pulse={stats.running > 0}
          href="/audits?status=running"
        />
        <StatCard
          title="Findings Críticos"
          value={stats.criticalFindings}
          icon={ShieldAlert}
          colorClass={stats.criticalFindings > 0 ? "text-red-400" : "text-zinc-500"}
          href="/audits?severity=critical"
        />
        <StatCard
          title="Revisiones HITL"
          value={stats.hitlPending}
          icon={UserCheck}
          colorClass={
            stats.hitlPending > 0 ? "text-orange-400" : "text-zinc-500"
          }
          href="/audits?tab=hitl"
          subtitle={
            stats.hitlPending > 0 ? "Requieren atención" : undefined
          }
        />
      </div>

      {/* Centro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentAudits />
        </div>
        <div>
          <AgentsSummary />
        </div>
      </div>

      {/* Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <FindingsChart />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
