import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AuditStatus } from "@/types"

const statusConfig: Record<AuditStatus, { label: string; className: string }> =
  {
    queued: {
      label: "En cola",
      className: "bg-zinc-700 text-zinc-300 hover:bg-zinc-700",
    },
    running: {
      label: "Corriendo",
      className: "bg-green-900 text-green-300 hover:bg-green-900 animate-pulse",
    },
    paused: {
      label: "Pausada",
      className: "bg-orange-900 text-orange-300 hover:bg-orange-900",
    },
    completed: {
      label: "Completada",
      className: "bg-green-900/50 text-green-400 hover:bg-green-900/50",
    },
    failed: {
      label: "Fallida",
      className: "bg-red-900 text-red-300 hover:bg-red-900",
    },
    archived: {
      label: "Archivada",
      className: "bg-zinc-800 text-zinc-500 hover:bg-zinc-800",
    },
  }

export function StatusBadge({ status }: { status: AuditStatus }) {
  const config = statusConfig[status]
  return (
    <Badge className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  )
}
