"use client"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/utils"
import { Shield, User, Play, FileText, AlertTriangle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const actionIcons: Record<
  string,
  { icon: any; color: string }
> = {
  "audit.create": { icon: Play, color: "text-blue-400" },
  "audit.complete": { icon: Shield, color: "text-green-400" },
  "user.login": { icon: User, color: "text-zinc-400" },
  "report.generate": { icon: FileText, color: "text-purple-400" },
  default: { icon: AlertTriangle, color: "text-orange-400" },
}

export function ActivityFeed() {
  const { data } = useSWR("/api/audit-log?limit=15", fetcher, {
    refreshInterval: 10000,
  })
  const events = data?.data ?? []

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-300">
          Actividad reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {events.length === 0 ? (
          <div className="text-center py-6 text-zinc-600 text-sm px-4">
            Sin actividad reciente
          </div>
        ) : (
          <div className="space-y-0">
            {events.map((event: any) => {
              const cfg =
                actionIcons[event.action] ?? actionIcons.default
              const IconComp = cfg.icon
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-zinc-800/30"
                >
                  <IconComp className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-300 truncate">
                      {event.action}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {formatRelativeTime(event.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
