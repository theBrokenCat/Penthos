"use client"
import useSWR from "swr"
import { Database, Shield, Radio } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function SystemMetrics() {
  const { data } = useSWR("/api/system/status", fetcher, { refreshInterval: 30000 })
  const metrics = data?.data

  const services = [
    { key: "chromadb", label: "ChromaDB", icon: Database, extra: metrics?.chromadb?.totalFindings != null ? `${metrics.chromadb.totalFindings} findings` : undefined },
    { key: "zap", label: "OWASP ZAP", icon: Shield, extra: "Puerto 8080" },
    { key: "interactsh", label: "interactsh", icon: Radio, extra: "Puerto 8443" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-6 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm">
      {services.map(({ key, label, icon: Icon, extra }) => {
        const status = metrics?.[key]?.status ?? "unknown"
        const isOnline = status === "online"
        return (
          <div key={key} className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500" : "bg-zinc-600")} />
            <Icon className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-400 font-medium">{label}</span>
            {extra && <span className="text-zinc-600 hidden md:inline text-xs">· {extra}</span>}
          </div>
        )
      })}
    </div>
  )
}
