"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentStatusDot } from "@/components/ui/agent-status-dot"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Activity, Radio, Square, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentInfo, AgentStatus } from "@/types"

const AGENT_META = {
  supervisor: { emoji: "🧠", color: "text-purple-400", label: "Supervisor" },
  explorer: { emoji: "🕷️", color: "text-blue-400", label: "Explorer" },
  analyst: { emoji: "🔬", color: "text-yellow-400", label: "Analyst" },
  exploiter: { emoji: "💥", color: "text-red-400", label: "Exploiter" },
}

interface Props {
  name: string
  info?: AgentInfo
  isAdmin?: boolean
  onLogsClick?: () => void
}

export function AgentCard({ name, info, isAdmin, onLogsClick }: Props) {
  const meta = AGENT_META[name as keyof typeof AGENT_META] ?? { emoji: "🤖", color: "text-zinc-400", label: name }
  const status: AgentStatus = (info?.status as AgentStatus) ?? "offline"
  const [pinging, setPinging] = useState(false)
  const [pingResult, setPingResult] = useState<"ok" | "fail" | null>(null)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [stopping, setStopping] = useState(false)

  async function handlePing() {
    setPinging(true)
    try {
      const res = await fetch(`/api/agents/${name}/ping`, { method: "POST" })
      setPingResult(res.ok ? "ok" : "fail")
    } catch {
      setPingResult("fail")
    }
    setPinging(false)
    setTimeout(() => setPingResult(null), 3000)
  }

  async function handleStop() {
    setStopping(true)
    try {
      await fetch(`/api/agents/${name}/stop`, { method: "POST" })
    } catch (e) {
      console.error("Error stopping agent:", e)
    }
    setStopping(false)
    setShowStopDialog(false)
  }

  function formatUptime(seconds?: number) {
    if (!seconds) return "—"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  return (
    <Card className={cn(
      "bg-zinc-900 border-zinc-800 transition-colors",
      status === "busy" && "border-blue-900/50 shadow-lg shadow-blue-900/20",
      status === "error" && "border-red-900/50",
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.emoji}</span>
            <div>
              <h3 className={cn("font-semibold capitalize", meta.color)}>{meta.label}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <AgentStatusDot status={status} showLabel />
                {info?.port && (
                  <Badge variant="outline" className="text-xs border-zinc-800 text-zinc-500 py-0 h-5">
                    :{info.port}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {pingResult && (
            <span className={cn("text-xs font-medium", pingResult === "ok" ? "text-green-400" : "text-red-400")}>
              {pingResult === "ok" ? "✓" : "✗"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tarea actual */}
        <div className="min-h-[40px]">
          {info?.currentTask ? (
            <div className="flex items-start gap-2">
              {status === "busy" && <Activity className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0 animate-pulse" />}
              <p className="text-xs text-zinc-300 line-clamp-2">{info.currentTask}</p>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">Sin tarea activa</p>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2 py-2 border-t border-zinc-800 text-center">
          <div>
            <div className="text-sm font-semibold text-zinc-200">{info?.findingsCount ?? 0}</div>
            <div className="text-xs text-zinc-600">findings</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-200">{formatUptime(info?.uptime)}</div>
            <div className="text-xs text-zinc-600">uptime</div>
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-400 truncate" title={info?.model}>{info?.model?.split("-")[1] ?? "—"}</div>
            <div className="text-xs text-zinc-600">modelo</div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-zinc-800 text-zinc-400 hover:text-zinc-200 flex-1"
            onClick={handlePing}
            disabled={pinging}
          >
            <Radio className={cn("w-3 h-3 mr-1", pinging && "animate-pulse")} />
            Ping
          </Button>
          {onLogsClick && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-zinc-800 text-zinc-400 hover:text-zinc-200 flex-1"
              onClick={onLogsClick}
            >
              Logs
            </Button>
          )}
          {isAdmin && status !== "offline" && (
            <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs border-red-900/50 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                  <Square className="w-3 h-3 mr-1" /> Stop
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                  <DialogTitle>¿Detener {meta.label}?</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Las tareas en curso se interrumpirán.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowStopDialog(false)} className="border-zinc-800">
                    Cancelar
                  </Button>
                  <Button
                    className="bg-red-900 text-red-100 hover:bg-red-800"
                    onClick={handleStop}
                    disabled={stopping}
                  >
                    Detener
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
