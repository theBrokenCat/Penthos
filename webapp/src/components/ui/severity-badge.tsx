import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Severity } from "@/types"

const severityConfig: Record<Severity, { label: string; className: string }> =
  {
    critical: { label: "Crítico", className: "bg-red-900 text-red-300" },
    high: { label: "Alto", className: "bg-orange-900 text-orange-300" },
    medium: { label: "Medio", className: "bg-yellow-900 text-yellow-300" },
    low: { label: "Bajo", className: "bg-blue-900 text-blue-300" },
    info: { label: "Info", className: "bg-zinc-700 text-zinc-300" },
  }

export function SeverityBadge({
  severity,
  size = "sm",
}: {
  severity: Severity
  size?: "xs" | "sm" | "md"
}) {
  const config = severityConfig[severity]
  return (
    <Badge
      className={cn(
        "font-semibold",
        config.className,
        size === "xs" && "text-xs px-1 py-0"
      )}
    >
      {config.label}
    </Badge>
  )
}

export function SeverityDot({ severity }: { severity: Severity }) {
  const colors: Record<Severity, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-blue-400",
    info: "bg-zinc-500",
  }
  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full", colors[severity])}
    />
  )
}
