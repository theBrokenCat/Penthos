"use client"

import { useState } from "react"
import useSWR from "swr"
import { FindingsList } from "./FindingsList"
import { FindingDetail } from "./FindingDetail"
import { FindingsStats } from "./FindingsStats"
import { Button } from "@/components/ui/button"
import { BarChart2, List } from "lucide-react"
import type { Finding } from "@/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Props {
  auditId: string
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  totalFindings: number
}

export function FindingsPanel({
  auditId,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  totalFindings,
}: Props) {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [resolvedFilter, setResolvedFilter] = useState<
    "unresolved" | "resolved" | "fp" | "all"
  >("all")

  const queryParams = new URLSearchParams({ limit: "200" })
  if (severityFilter !== "all") queryParams.set("severity", severityFilter)

  const { data, isLoading, mutate } = useSWR(
    `/api/findings/${auditId}?${queryParams}`,
    fetcher,
    { refreshInterval: 15000 }
  )

  const allFindings: Finding[] = data?.data ?? []

  // Filtros cliente
  const findings = allFindings.filter((f) => {
    if (resolvedFilter === "unresolved")
      return !f.isResolved && !f.isFalsePositive
    if (resolvedFilter === "resolved") return f.isResolved
    if (resolvedFilter === "fp") return f.isFalsePositive
    return true
  })

  const counts = {
    critical: criticalCount,
    high: highCount,
    medium: mediumCount,
    low: lowCount,
    total: totalFindings,
  }

  return (
    <div className="space-y-3">
      {/* Toggle stats/lista */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            variant={!showStats ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowStats(false)}
          >
            <List className="w-3.5 h-3.5" /> Hallazgos
          </Button>
          <Button
            variant={showStats ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowStats(true)}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Estadísticas
          </Button>
        </div>
        <span className="text-xs text-zinc-500">
          {totalFindings} hallazgos en total
        </span>
      </div>

      {showStats ? (
        <FindingsStats counts={counts} findings={findings} />
      ) : (
        <div className="flex gap-4 h-[600px]">
          {/* Lista */}
          <div className="w-[340px] flex-shrink-0 overflow-y-auto border border-zinc-800 rounded-lg">
            <FindingsList
              findings={findings}
              counts={counts}
              isLoading={isLoading}
              selectedId={selectedFinding?.id}
              onSelect={setSelectedFinding}
              severityFilter={severityFilter}
              onSeverityFilter={setSeverityFilter}
              resolvedFilter={resolvedFilter}
              onResolvedFilter={setResolvedFilter}
            />
          </div>
          {/* Detalle */}
          <div className="flex-1 overflow-y-auto border border-zinc-800 rounded-lg">
            {selectedFinding ? (
              <FindingDetail
                finding={selectedFinding}
                auditId={auditId}
                onUpdate={mutate}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                <span className="text-3xl mb-3">🔍</span>
                <p className="text-sm">
                  Selecciona un hallazgo para ver los detalles
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
