"use client"
import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, Pause, Play, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogEntry {
  timestamp: string
  level: "DEBUG" | "INFO" | "WARN" | "ERROR"
  message: string
}

const AGENT_META = {
  supervisor: { emoji: "🧠", label: "Supervisor" },
  explorer: { emoji: "🕷️", label: "Explorer" },
  analyst: { emoji: "🔬", label: "Analyst" },
  exploiter: { emoji: "💥", label: "Exploiter" },
}

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: "text-zinc-500",
  INFO: "text-zinc-300",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
}

interface Props {
  agentName: string
  isOpen: boolean
  onClose: () => void
}

export function AgentLogsDrawer({ agentName, isOpen, onClose }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<"ALL" | "INFO" | "WARN" | "ERROR">("ALL")
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const meta = AGENT_META[agentName as keyof typeof AGENT_META] || { emoji: "🤖", label: agentName }

  // Cargar logs iniciales
  useEffect(() => {
    if (!isOpen) return

    const loadLogs = async () => {
      try {
        const res = await fetch(`/api/agents/${agentName}/logs?limit=100`)
        const data = await res.json()
        setLogs(data.data?.logs ?? [])
      } catch (e) {
        console.error("Error loading logs:", e)
      }
    }

    loadLogs()
  }, [isOpen, agentName])

  // Auto-scroll cuando hay nuevos logs
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
      }, 0)
    }
  }, [logs, autoScroll])

  // Verificar scroll para desactivar auto-scroll si el usuario hace scroll arriba
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false)
    }
  }

  const filteredLogs = logs.filter(
    log => filter === "ALL" || log.level === filter
  )

  function downloadLogs() {
    const content = filteredLogs
      .map(log => `[${log.timestamp}] ${log.level.padEnd(5)} ${log.message}`)
      .join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${agentName}-logs-${new Date().toISOString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-zinc-900 border-zinc-800 p-0">
        <DialogHeader className="border-b border-zinc-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta.emoji}</span>
              <DialogTitle className="text-base font-semibold">{meta.label} — Logs en tiempo real</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Controles */}
        <div className="border-b border-zinc-800 px-6 py-2 flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {["ALL", "INFO", "WARN", "ERROR"].map(level => (
              <Badge
                key={level}
                variant={filter === level ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-xs py-0 h-5",
                  filter === level
                    ? "bg-zinc-700 text-zinc-100"
                    : "border-zinc-800 text-zinc-400 hover:bg-zinc-800/50"
                )}
                onClick={() => setFilter(level as any)}
              >
                {level}
              </Badge>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-zinc-800"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              {autoScroll ? (
                <>
                  <Pause className="w-3 h-3 mr-1" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" /> Reanudar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-zinc-800"
              onClick={() => setLogs([])}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Limpiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-zinc-800"
              onClick={downloadLogs}
            >
              <Download className="w-3 h-3 mr-1" /> Descargar
            </Button>
          </div>
        </div>

        {/* Área de logs */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-3 font-mono text-xs space-y-0 bg-black/20"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-sm">
              {logs.length === 0 ? "Sin logs aún" : "Sin logs para el filtro seleccionado"}
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div key={idx} className="text-zinc-400 whitespace-pre-wrap break-words">
                <span className="text-zinc-600">[{log.timestamp}]</span>
                <span className={cn("ml-2 font-semibold", LEVEL_COLORS[log.level])}>
                  {log.level.padEnd(5)}
                </span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="border-t border-zinc-800 px-6 py-3">
          <Button variant="outline" onClick={onClose} className="border-zinc-800">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
