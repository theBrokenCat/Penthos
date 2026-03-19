"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  Search,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/ui/status-badge"
import { RenameAuditModal } from "./RenameAuditModal"
import { formatRelativeTime } from "@/lib/utils"
import type { AuditRecord } from "@/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "Todas", value: "all" },
  { label: "En ejecución", value: "running" },
  { label: "Completadas", value: "completed" },
  { label: "Pausadas", value: "paused" },
  { label: "Archivadas", value: "archived" },
]

export function AuditsList() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null
  )

  const queryString = new URLSearchParams({
    search,
    status: statusFilter,
    page: String(page),
    limit: "15",
  }).toString()

  const { data, isLoading, mutate } = useSWR(
    `/api/audits?${queryString}`,
    fetcher,
    { refreshInterval: 8000 }
  )
  const auditList: AuditRecord[] = data?.data ?? []
  const total: number = data?.meta?.total ?? 0
  const totalPages = Math.ceil(total / 15)

  async function archiveAudit(id: string) {
    await fetch(`/api/audits/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nombre o URL..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : auditList.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-sm">
            {search || statusFilter !== "all"
              ? "No hay resultados para estos filtros"
              : "No hay auditorías aún"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium hidden md:table-cell">
                  URL
                </th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium hidden lg:table-cell">
                  Findings
                </th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium hidden xl:table-cell">
                  Creada
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {auditList.map((audit) => (
                <tr
                  key={audit.id}
                  className="hover:bg-zinc-800/30 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/audits/${audit.id}`}
                      className="font-medium text-zinc-200 hover:text-zinc-100 line-clamp-1"
                    >
                      {audit.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-zinc-500 text-xs truncate max-w-[200px] block">
                      {audit.targetUrl}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={audit.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-xs">
                      {audit.criticalCount > 0 && (
                        <span className="text-red-400">
                          {audit.criticalCount}🔴
                        </span>
                      )}
                      {audit.highCount > 0 && (
                        <span className="text-orange-400">
                          {audit.highCount}🟠
                        </span>
                      )}
                      {audit.mediumCount > 0 && (
                        <span className="text-yellow-400">
                          {audit.mediumCount}🟡
                        </span>
                      )}
                      {audit.lowCount > 0 && (
                        <span className="text-blue-400">
                          {audit.lowCount}🔵
                        </span>
                      )}
                      {audit.totalFindings === 0 && (
                        <span className="text-zinc-600">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 hidden xl:table-cell">
                    {formatRelativeTime(audit.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 opacity-0 group-hover:opacity-100 text-zinc-400"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-zinc-900 border-zinc-800 w-40"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            setRenaming({ id: audit.id, name: audit.name })
                          }
                          className="gap-2 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Renombrar
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                          <Link href={`/audits/${audit.id}`}>
                            <FileText className="w-3.5 h-3.5" /> Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                          onClick={() => archiveAudit(audit.id)}
                          className="gap-2 cursor-pointer text-red-400 focus:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Archivar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">{total} auditorías en total</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 border-zinc-800 text-zinc-400"
            >
              Anterior
            </Button>
            <span className="text-xs text-zinc-500 flex items-center px-3">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-7 border-zinc-800 text-zinc-400"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {renaming && (
        <RenameAuditModal
          auditId={renaming.id}
          currentName={renaming.name}
          open
          onClose={() => {
            setRenaming(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}
