"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { RenameAuditModal } from "./RenameAuditModal"
import { FindingsPanel } from "@/components/findings/FindingsPanel"
import { ReportsList } from "@/components/reports/ReportsList"
import { GenerateReportModal } from "@/components/reports/GenerateReportModal"
import {
  ArrowLeft,
  Pencil,
  FileText,
  Pause,
  Play,
  AlertCircle,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { AuditRecord } from "@/types"

interface Props {
  audit: AuditRecord
}

export function AuditDetail({ audit }: Props) {
  const router = useRouter()
  const [renaming, setRenaming] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  async function updateStatus(status: string) {
    await fetch(`/api/audits/${audit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/audits"
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-4 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a auditorías
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-zinc-100">
                {audit.name}
              </h1>
              <button
                onClick={() => setRenaming(true)}
                className="text-zinc-600 hover:text-zinc-400"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-zinc-500">{audit.targetUrl}</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={audit.status} />
              <span className="text-xs text-zinc-600">
                Creada {formatDate(audit.createdAt)}
              </span>
              {audit.totalFindings > 0 && (
                <span className="text-xs text-zinc-500">
                  {audit.criticalCount > 0 && (
                    <span className="text-red-400 mr-1">
                      {audit.criticalCount}🔴
                    </span>
                  )}
                  {audit.highCount > 0 && (
                    <span className="text-orange-400 mr-1">
                      {audit.highCount}🟠
                    </span>
                  )}
                  {audit.totalFindings} hallazgos
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {audit.status === "running" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("paused")}
                className="gap-2 border-zinc-800 text-zinc-300"
              >
                <Pause className="w-3.5 h-3.5" /> Pausar
              </Button>
            )}
            {audit.status === "paused" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("running")}
                className="gap-2 border-zinc-800 text-zinc-300"
              >
                <Play className="w-3.5 h-3.5" /> Reanudar
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setReportModalOpen(true)}
              className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              <FileText className="w-3.5 h-3.5" /> Generar informe
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="summary" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
            Resumen
          </TabsTrigger>
          <TabsTrigger
            value="findings"
            className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100"
          >
            Findings
            {audit.totalFindings > 0 && (
              <Badge className="ml-2 bg-zinc-700 text-zinc-300 text-xs">
                {audit.totalFindings}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="endpoints" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="hitl" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
            HITL Reviews
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
            Informes
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-zinc-800 text-zinc-400 data-[state=active]:text-zinc-100">
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Críticos", value: audit.criticalCount, color: "text-red-400" },
              {
                label: "Altos",
                value: audit.highCount,
                color: "text-orange-400",
              },
              {
                label: "Medios",
                value: audit.mediumCount,
                color: "text-yellow-400",
              },
              { label: "Bajos", value: audit.lowCount, color: "text-blue-400" },
            ].map((s) => (
              <Card key={s.label} className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-zinc-500">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          {audit.notes && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-300">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400">{audit.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="findings" className="mt-4">
          <FindingsPanel
            auditId={audit.id}
            criticalCount={audit.criticalCount}
            highCount={audit.highCount}
            mediumCount={audit.mediumCount}
            lowCount={audit.lowCount}
            totalFindings={audit.totalFindings}
          />
        </TabsContent>

        <TabsContent value="endpoints" className="mt-4">
          <div className="flex items-center justify-center h-32 border border-dashed border-zinc-800 rounded-lg">
            <p className="text-zinc-600 text-sm">
              Los endpoints descubiertos aparecerán aquí
            </p>
          </div>
        </TabsContent>

        <TabsContent value="hitl" className="mt-4">
          <div className="flex items-center justify-center h-32 border border-dashed border-zinc-800 rounded-lg">
            <p className="text-zinc-600 text-sm">
              Las revisiones HITL aparecerán aquí
            </p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReportsList auditId={audit.id} auditName={audit.name} />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-300">
                Configuración de la auditoría
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-zinc-500 w-24">URL:</span>
                <span className="text-zinc-300">{audit.targetUrl}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-500 w-24">Estado:</span>
                <StatusBadge status={audit.status} />
              </div>
              {audit.agentConfig && (
                <div className="mt-4">
                  <pre className="text-xs text-zinc-400 bg-zinc-800 p-3 rounded overflow-auto">
                    {JSON.stringify(
                      JSON.parse(audit.agentConfig as any),
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renaming && (
        <RenameAuditModal
          auditId={audit.id}
          currentName={audit.name}
          open
          onClose={() => {
            setRenaming(false)
            router.refresh()
          }}
        />
      )}

      <GenerateReportModal
        auditId={audit.id}
        auditName={audit.name}
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  )
}
