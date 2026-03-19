"use client"
import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const ROLE_BADGES: Record<string, string> = {
  admin: "bg-purple-900 text-purple-300",
  analyst: "bg-blue-900 text-blue-300",
  viewer: "bg-zinc-700 text-zinc-300",
}

export function UsersSection() {
  const { data, mutate } = useSWR("/api/admin/users", fetcher)
  const userList = data?.data ?? []
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as const,
  })
  const [error, setError] = useState("")

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (!res.ok) {
      setError(d.error?.message ?? "Error")
      setLoading(false)
      return
    }
    setCreateOpen(false)
    setForm({ name: "", email: "", password: "", role: "viewer" })
    mutate()
    setLoading(false)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-zinc-100 text-base">Usuarios</CardTitle>
          <CardDescription className="text-zinc-500">
            Gestiona los usuarios del portal
          </CardDescription>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-zinc-800 text-zinc-300 flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm">
            <DialogHeader>
              <DialogTitle>Crear usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={createUser} className="space-y-4 mt-2">
              {[
                { key: "name", label: "Nombre", type: "text" },
                { key: "email", label: "Email", type: "email" },
                { key: "password", label: "Contraseña", type: "password" },
              ].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-zinc-300">{f.label}</Label>
                  <Input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    required
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-zinc-300">Rol</Label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, role: e.target.value as any }))
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 rounded-md"
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                  className="text-zinc-400"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="bg-zinc-100 text-zinc-900">
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Crear
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-zinc-800">
          {userList.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
                {u.lastLoginAt && (
                  <p className="text-xs text-zinc-600">
                    Último acceso {formatRelativeTime(u.lastLoginAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-xs ${ROLE_BADGES[u.role] ?? "bg-zinc-700 text-zinc-300"}`}
                >
                  {u.role}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs border-zinc-800 ${
                    u.isActive ? "text-green-400" : "text-zinc-600"
                  }`}
                >
                  {u.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          ))}
          {userList.length === 0 && (
            <p className="text-sm text-zinc-600 py-4 text-center">No hay usuarios</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
