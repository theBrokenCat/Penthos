"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SeverityBadge } from "@/components/ui/severity-badge"
import { CheckCircle2, AlertOctagon, MessageSquare, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Finding } from "@/types"
import type { KeyedMutator } from "swr"

interface Props {
  finding: Finding
  auditId: string
  onUpdate: KeyedMutator<any>
}

export function FindingDetail({ finding, auditId, onUpdate }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [noteText, setNoteText] = useState(finding.notes ?? "")
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [copied, setCopied] = useState(false)

  const METHOD_COLORS: Record<string, string> = {
    GET: "text-green-400 bg-green-900/30",
    POST: "text-blue-400 bg-blue-900/30",
    PUT: "text-orange-400 bg-orange-900/30",
    DELETE: "text-red-400 bg-red-900/30",
    PATCH: "text-yellow-400 bg-yellow-900/30",
  }

  async function patchFinding(data: Partial<Finding>) {
    const id = Object.keys(data)[0]
    setLoading(id)
    try {
      await fetch(`/api/findings/${auditId}/${finding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      setLoading(null)
      onUpdate()
    } catch (e) {
      console.error(e)
      setLoading(null)
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <SeverityBadge severity={finding.severity} />
          {finding.cvss && (
            <span className="text-xs text-zinc-400 font-mono">
              CVSSv3: {finding.cvss}
            </span>
          )}
          {finding.isFalsePositive && (
            <Badge className="bg-zinc-700 text-zinc-400 text-xs">
              Falso positivo
            </Badge>
          )}
          {finding.isResolved && (
            <Badge className="bg-green-900/50 text-green-400 text-xs">
              Resuelto
            </Badge>
          )}
        </div>
        <h2 className="text-base font-semibold text-zinc-100">
          {finding.title}
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Encontrado por 🤖 {finding.agent}</p>
      </div>

      {/* Endpoint */}
      <div className="flex items-center gap-2 p-2.5 bg-zinc-800 rounded-lg">
        {finding.method && (
          <span
            className={cn(
              "text-xs font-bold font-mono px-1.5 py-0.5 rounded",
              METHOD_COLORS[finding.method] ?? "text-zinc-400 bg-zinc-700"
            )}
          >
            {finding.method}
          </span>
        )}
        <code className="text-xs text-zinc-300 flex-1 truncate">
          {finding.url}
        </code>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-zinc-500"
          onClick={() => copyText(finding.url)}
        >
          {copied ? (
            <span className="text-green-400 text-xs">✓</span>
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>

      {/* Descripción */}
      {finding.description && (
        <div>
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">
            Descripción
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {finding.description}
          </p>
        </div>
      )}

      {/* Evidencia */}
      {finding.evidence && Object.values(finding.evidence).some(Boolean) && (
        <div>
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">
            Evidencia
          </h3>
          <Tabs defaultValue={finding.evidence.request ? "request" : "payload"}>
            <TabsList className="bg-zinc-800 border-0 h-7">
              {finding.evidence.request && (
                <TabsTrigger value="request" className="text-xs h-6 data-[state=active]:bg-zinc-700">
                  Request
                </TabsTrigger>
              )}
              {finding.evidence.response && (
                <TabsTrigger value="response" className="text-xs h-6 data-[state=active]:bg-zinc-700">
                  Response
                </TabsTrigger>
              )}
              {finding.evidence.payload && (
                <TabsTrigger value="payload" className="text-xs h-6 data-[state=active]:bg-zinc-700">
                  Payload
                </TabsTrigger>
              )}
            </TabsList>
            {finding.evidence.request && (
              <TabsContent value="request">
                <pre className="text-xs text-zinc-300 bg-zinc-800 p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono max-h-48">
                  {finding.evidence.request}
                </pre>
              </TabsContent>
            )}
            {finding.evidence.response && (
              <TabsContent value="response">
                <pre className="text-xs text-zinc-300 bg-zinc-800 p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono max-h-48">
                  {finding.evidence.response}
                </pre>
              </TabsContent>
            )}
            {finding.evidence.payload && (
              <TabsContent value="payload">
                <pre className="text-xs text-orange-300 bg-zinc-800 p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">
                  {finding.evidence.payload}
                </pre>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Recomendación */}
      {finding.recommendation && (
        <div className="p-3 bg-green-900/20 border border-green-900/40 rounded-lg">
          <h3 className="text-xs font-medium text-green-400 mb-1">
            Recomendación
          </h3>
          <p className="text-sm text-zinc-300">{finding.recommendation}</p>
        </div>
      )}

      {/* Referencias */}
      {finding.references && finding.references.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">
            Referencias
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {finding.references.map((ref, i) => (
              <a
                key={i}
                href={ref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 bg-blue-900/20 px-2 py-0.5 rounded"
              >
                {ref.includes("owasp")
                  ? "OWASP"
                  : ref.includes("cve")
                    ? "CVE"
                    : ref.includes("cwe")
                      ? "CWE"
                      : "Ref"}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {(finding.notes || showNoteInput) && (
        <div className="p-3 bg-zinc-800 rounded-lg">
          <h3 className="text-xs font-medium text-zinc-400 mb-1.5">Notas</h3>
          {showNoteInput ? (
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full bg-zinc-700 border-0 rounded p-2 text-sm text-zinc-200 resize-none h-20 outline-none"
                placeholder="Añade una nota..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-zinc-100 text-zinc-900"
                  onClick={() => {
                    patchFinding({ notes: noteText } as any)
                    setShowNoteInput(false)
                  }}
                >
                  Guardar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-zinc-500"
                  onClick={() => setShowNoteInput(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">{finding.notes}</p>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
        {!finding.isResolved && !finding.isFalsePositive && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 border-zinc-800 text-zinc-300 hover:text-green-400 hover:border-green-900"
            onClick={() => patchFinding({ isResolved: true } as any)}
            disabled={loading === "isResolved"}
          >
            <CheckCircle2 className="w-3 h-3" /> Resolver
          </Button>
        )}
        {!finding.isFalsePositive && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 border-zinc-800 text-zinc-300 hover:text-red-400 hover:border-red-900"
            onClick={() => patchFinding({ isFalsePositive: true } as any)}
            disabled={loading === "isFalsePositive"}
          >
            <AlertOctagon className="w-3 h-3" /> Falso positivo
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 border-zinc-800 text-zinc-300"
          onClick={() => setShowNoteInput(true)}
        >
          <MessageSquare className="w-3 h-3" /> Nota
        </Button>
      </div>
    </div>
  )
}
