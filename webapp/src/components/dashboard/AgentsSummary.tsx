"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AgentStatusDot } from "@/components/ui/agent-status-dot"
import { ArrowRight, WifiOff } from "lucide-react"
import type { AgentInfo } from "@/types"

const AGENTS = [
  { name: "supervisor" as const, emoji: "🧠", label: "Supervisor" },
  { name: "explorer" as const, emoji: "🕷️", label: "Explorer" },
  { name: "analyst" as const, emoji: "🔬", label: "Analyst" },
  { name: "exploiter" as const, emoji: "💥", label: "Exploiter" },
]

export function AgentsSummary() {
  const [agentsStatus, setAgentsStatus] = useState<
    Record<string, AgentInfo>
  >({})
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const sse = new EventSource("/api/sse/agents")
    sse.onopen = () => setConnected(true)
    sse.onmessage = (e) => {
      try {
        setAgentsStatus(JSON.parse(e.data))
      } catch {}
    }
    sse.onerror = () => setConnected(false)
    return () => sse.close()
  }, [])

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-zinc-300">
          Estado de Agentes
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-zinc-500 hover:text-zinc-300 h-7 text-xs gap-1"
        >
          <Link href="/agents">
            Monitor <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {AGENTS.map((agent) => {
          const info = agentsStatus[agent.name]
          const status = info?.status ?? "offline"
          return (
            <div key={agent.name} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{agent.emoji}</span>
                <span className="text-sm text-zinc-300">{agent.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {info?.currentTask && (
                  <span className="text-xs text-zinc-500 max-w-[120px] truncate hidden sm:block">
                    {info.currentTask}
                  </span>
                )}
                <AgentStatusDot status={status} showLabel />
              </div>
            </div>
          )
        })}
        {!connected && (
          <div className="flex items-center gap-2 pt-2 text-xs text-zinc-600">
            <WifiOff className="w-3 h-3" />
            Sin conexión en tiempo real
          </div>
        )}
      </CardContent>
    </Card>
  )
}
