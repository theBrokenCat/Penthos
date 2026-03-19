"use client"
import { useEffect, useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { AgentCard } from "./AgentCard"
import { SystemMetrics } from "./SystemMetrics"
import { TaskHistory } from "./TaskHistory"
import { AgentLogsDrawer } from "./AgentLogsDrawer"
import { WifiOff } from "lucide-react"
import type { AgentInfo } from "@/types"

const AGENTS = ["supervisor", "explorer", "analyst", "exploiter"]

interface Props {
  isAdmin?: boolean
}

export function AgentsMonitorClient({ isAdmin }: Props) {
  const [agentsStatus, setAgentsStatus] = useState<Record<string, AgentInfo>>({})
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  useEffect(() => {
    let sse: EventSource

    function connect() {
      sse = new EventSource("/api/sse/agents")
      sse.onopen = () => {
        setConnected(true)
        setError(false)
      }
      sse.onmessage = (e) => {
        try {
          setAgentsStatus(JSON.parse(e.data))
        } catch (err) {
          console.error("Error parsing SSE data:", err)
        }
      }
      sse.onerror = () => {
        setConnected(false)
        setError(true)
        sse.close()
        // Reintentar en 5 segundos
        setTimeout(connect, 5000)
      }
    }

    connect()
    return () => sse?.close()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitor de Agentes"
        description="Estado en tiempo real de los agentes de pentesting"
      />

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-900/20 border border-red-900/50 rounded-lg text-sm text-red-400">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          Conexión SSE perdida — reintentando...
        </div>
      )}

      {/* Grid de agentes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {AGENTS.map(name => (
          <AgentCard
            key={name}
            name={name}
            info={agentsStatus[name]}
            isAdmin={isAdmin}
            onLogsClick={() => setSelectedAgent(name)}
          />
        ))}
      </div>

      {/* Métricas del sistema */}
      <SystemMetrics />

      {/* Historial */}
      <TaskHistory />

      {/* Drawer de logs */}
      {selectedAgent && (
        <AgentLogsDrawer
          agentName={selectedAgent}
          isOpen={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  )
}
