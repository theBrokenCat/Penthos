import { cn } from "@/lib/utils"
import type { AgentStatus } from "@/types"

const statusConfig: Record<
  AgentStatus,
  { color: string; animate: boolean; label: string }
> = {
  online: { color: "bg-green-500", animate: false, label: "Online" },
  offline: { color: "bg-zinc-600", animate: false, label: "Offline" },
  busy: { color: "bg-blue-500", animate: true, label: "Ocupado" },
  error: { color: "bg-red-500", animate: true, label: "Error" },
  starting: { color: "bg-yellow-500", animate: true, label: "Iniciando" },
}

export function AgentStatusDot({
  status,
  showLabel = false,
}: {
  status: AgentStatus
  showLabel?: boolean
}) {
  const config = statusConfig[status]
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block w-2 h-2 rounded-full",
          config.color,
          config.animate && "animate-pulse"
        )}
      />
      {showLabel && (
        <span className="text-xs text-zinc-400">{config.label}</span>
      )}
    </span>
  )
}
