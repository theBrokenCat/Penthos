"use client"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatRelativeTime } from "@/lib/utils"
import { ArrowRight, Loader2 } from "lucide-react"
import type { AuditRecord } from "@/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function RecentAudits() {
  const { data, isLoading } = useSWR(
    "/api/audits?limit=8&sortBy=updatedAt&order=desc",
    fetcher,
    { refreshInterval: 5000 }
  )

  const auditList: AuditRecord[] = data?.data ?? []

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-zinc-300">
          Últimas Auditorías
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-zinc-500 hover:text-zinc-300 h-7 text-xs gap-1"
        >
          <Link href="/audits">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : auditList.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm">
            No hay auditorías aún
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {auditList.map((audit) => (
              <Link
                key={audit.id}
                href={`/audits/${audit.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {audit.name}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {audit.targetUrl}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                  <div className="text-xs text-zinc-500 hidden sm:flex items-center gap-1">
                    {audit.criticalCount > 0 && (
                      <span className="text-red-400">
                        {audit.criticalCount}🔴
                      </span>
                    )}
                    {audit.highCount > 0 && (
                      <span className="text-orange-400">
                        {audit.highCount}🟠
                      </span>
                    )}
                    {audit.mediumCount > 0 && (
                      <span className="text-yellow-400">
                        {audit.mediumCount}🟡
                      </span>
                    )}
                    {audit.totalFindings === 0 && <span>—</span>}
                  </div>
                  <StatusBadge status={audit.status} />
                  <span className="text-xs text-zinc-600 hidden md:block">
                    {formatRelativeTime(audit.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
