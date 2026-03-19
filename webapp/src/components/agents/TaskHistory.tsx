"use client"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRelativeTime } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

const AGENT_EMOJIS: Record<string, string> = {
  supervisor: "🧠",
  explorer: "🕷️",
  analyst: "🔬",
  exploiter: "💥",
}

export function TaskHistory() {
  const { data } = useSWR("/api/audit-log?limit=30", fetcher, { refreshInterval: 15000 })
  const events = data?.data ?? []

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-300">Historial de actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {events.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm">Sin actividad registrada</div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {events.slice(0, 20).map((event: any) => (
              <div key={event.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors">
                <span className="text-base w-5 text-center flex-shrink-0">
                  {AGENT_EMOJIS[event.userId ?? ""] ?? "📋"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{event.action}</p>
                  {event.targetId && <p className="text-xs text-zinc-600 truncate">{event.targetId}</p>}
                </div>
                <span className="text-xs text-zinc-600 flex-shrink-0 whitespace-nowrap">{formatRelativeTime(event.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
