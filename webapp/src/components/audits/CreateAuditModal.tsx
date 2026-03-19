"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"

export function CreateAuditModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    targetUrl: "",
    targetScope: "",
    notes: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || `Auditoría ${new Date().toLocaleDateString("es-ES")}`,
          targetUrl: form.targetUrl,
          targetScope: form.targetScope
            ? form.targetScope.split("\n").filter(Boolean)
            : [],
          notes: form.notes || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? "Error al crear")

      setOpen(false)
      router.push(`/audits/${data.data.id}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
          <Plus className="w-4 h-4" />
          Nueva auditoría
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Auditoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Nombre</Label>
            <Input
              placeholder={`Auditoría ${new Date().toLocaleDateString("es-ES")}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300">
              URL objetivo <span className="text-red-400">*</span>
            </Label>
            <Input
              placeholder="https://target.example.com"
              value={form.targetUrl}
              onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">
              Scope (una URL por línea, opcional)
            </Label>
            <Textarea
              placeholder="https://target.example.com/api&#10;https://target.example.com/admin"
              value={form.targetScope}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetScope: e.target.value }))
              }
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none h-20 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Notas (opcional)</Label>
            <Textarea
              placeholder="Contexto adicional para los agentes..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none h-16 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-zinc-400"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Crear auditoría
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
