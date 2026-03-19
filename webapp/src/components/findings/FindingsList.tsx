"use client"

import { cn } from "@/lib/utils"
import { SeverityBadge } from "@/components/ui/severity-badge"
import { Loader2 } from "lucide-react"
import type { Finding, Severity } from "@/types"

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"]
const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Medio",
  low: "Bajo",
  info: "Info",
}

interface Props {
  findings: Finding[]
  counts: { critical: number; high: number; medium: number; low: number; total: number }
  isLoading: boolean
  selectedId?: string
  onSelect: (f: Finding) => void
  severityFilter: string
  onSeverityFilter: (s: string) => void
  resolvedFilter: string
  onResolvedFilter: (s: any) => void
}

export function FindingsList({
  findings,
  counts,
  isLoading,
  selectedId,
  onSelect,
  severityFilter,
  onSeverityFilter,
  resolvedFilter,
  onResolvedFilter,
}: Props) {
  const sortedFindings = [...findings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    return (order[a.severity] ?? 5) - (order[b.severity] ?? 5)
  })

  return (
    <div className="p-3 space-y-3">
      {/* Filtros de severidad */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onSeverityFilter("all")}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
            severityFilter === "all"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          )}
        >
          Todos ({counts.total})
        </button>
        {(["critical", "high", "medium", "low"] as const).map((sev) => {
          const count = counts[sev]
          if (count === 0) return null
          const colors = {
            critical: "text-red-400",
            high: "text-orange-400",
            medium: "text-yellow-400",
            low: "text-blue-400",
          }
          return (
            <button
              key={sev}
              onClick={() => onSeverityFilter(sev)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                colors[sev],
                severityFilter === sev
                  ? "bg-zinc-800"
                  : "hover:bg-zinc-800/50"
              )}
            >
              {SEVERITY_LABELS[sev]} ({count})
            </button>
          )
        })}
      </div>

      {/* Toggle resueltos */}
      <div className="flex gap-1">
        {[
          { id: "all", label: "Todos" },
          { id: "unresolved", label: "No resueltos" },
          { id: "resolved", label: "Resueltos" },
          { id: "fp", label: "Falsos +." },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => onResolvedFilter(f.id)}
            className={cn(
              "px-2 py-1 rounded text-xs transition-colors",
              resolvedFilter === f.id
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-600 hover:text-zinc-400"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : sortedFindings.length === 0 ? (
        <div className="text-center py-8 text-zinc-600 text-sm">
          {counts.total === 0
            ? "No hay hallazgos aún"
            : "No hay resultados para estos filtros"}
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedFindings.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelect(f)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                selectedId === f.id
                  ? "border-zinc-600 bg-zinc-800"
                  : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50",
                f.isFalsePositive && "opacity-50"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <SeverityBadge severity={f.severity} size="xs" />
                <span className="text-xs text-zinc-600 flex-shrink-0">
                  {f.isFalsePositive ? "🚫 FP" : f.isResolved ? "✅" : ""}
                </span>
              </div>
              <p className="text-sm font-medium text-zinc-200 line-clamp-1 mb-1">
                {f.title}
              </p>
              <p className="text-xs text-zinc-500 line-clamp-1">{f.url}</p>
              <p className="text-xs text-zinc-600 mt-1">🤖 {f.agent}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
