"use client"
import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Key, Trash2, Copy, Check, AlertTriangle } from "lucide-react"
import { Plus } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SCOPES = [
  { id: "audits:read", label: "Leer auditorías y findings" },
  { id: "audits:write", label: "Crear y gestionar auditorías" },
  { id: "reports:read", label: "Descargar informes" },
  { id: "reports:write", label: "Generar informes" },
]

export function ApiKeysSection() {
  const { data, mutate } = useSWR("/api/user/me", fetcher)
  const user = data?.data
  const hasKey = !!user?.apiKeyName

  const [createOpen, setCreateOpen] = useState(false)
  const [newKeyData, setNewKeyData] = useState<{ key: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ name: "", scopes: [] as string[] })
  const [loading, setLoading] = useState(false)

  async function createKey() {
    setLoading(true)
    const res = await fetch("/api/user/me/api-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setNewKeyData(data.data)
      mutate()
    }
    setLoading(false)
  }

  async function revokeKey() {
    await fetch("/api/user/me/api-key", { method: "DELETE" })
    mutate()
  }

  function copyKey() {
    if (newKeyData) {
      navigator.clipboard.writeText(newKeyData.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 text-base">API Keys</CardTitle>
        <CardDescription className="text-zinc-500">Acceso programático al portal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasKey ? (
          <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-200">{user.apiKeyName}</p>
                <p className="text-xs text-zinc-500">
                  Scopes:{" "}
                  {user.apiKeyScopes ? JSON.parse(user.apiKeyScopes).join(", ") : "—"}
                </p>
                {user.apiKeyCreatedAt && (
                  <p className="text-xs text-zinc-600">
                    Creada {new Date(user.apiKeyCreatedAt).toLocaleDateString("es-ES")}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={revokeKey}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 w-8 h-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No tienes ninguna API key creada.</p>
        )}

        {!hasKey && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-zinc-800 text-zinc-300"
              >
                <Plus className="w-4 h-4" /> Nueva API key
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm">
              <DialogHeader>
                <DialogTitle>Crear API key</DialogTitle>
              </DialogHeader>
              {!newKeyData ? (
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label className="text-zinc-300">Nombre</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Mi integración"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Permisos</Label>
                    {SCOPES.map((s) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={s.id}
                          checked={form.scopes.includes(s.id)}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              scopes: e.target.checked
                                ? [...f.scopes, s.id]
                                : f.scopes.filter((x) => x !== s.id),
                            }))
                          }
                          className="w-4 h-4 rounded"
                        />
                        <label htmlFor={s.id} className="text-sm text-zinc-400 cursor-pointer">
                          {s.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setCreateOpen(false)}
                      className="text-zinc-400"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={createKey}
                      disabled={loading || !form.name}
                      className="bg-zinc-100 text-zinc-900"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Crear
                      key
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-2 p-3 bg-orange-900/20 border border-orange-900/50 rounded-lg text-sm text-orange-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Cópiala ahora. No podrás verla de nuevo.
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-lg font-mono text-sm text-zinc-200 break-all">
                    {newKeyData.key}
                  </div>
                  <Button
                    onClick={copyKey}
                    className="w-full gap-2 bg-zinc-100 text-zinc-900"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copiada
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copiar al portapapeles
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewKeyData(null)
                      setCreateOpen(false)
                    }}
                    className="w-full border-zinc-800 text-zinc-400"
                  >
                    He copiado mi clave
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
