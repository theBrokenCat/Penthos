"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check } from "lucide-react"

interface Props {
  user: {
    id: string
    name: string
    email: string
    role: string
    avatarUrl?: string | null
    createdAt: string
    lastLoginAt?: string | null
  }
}

export function ProfileSection({ user }: Props) {
  const [name, setName] = useState(user.name)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (name === user.name) return
    setLoading(true)
    await fetch("/api/user/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 text-base">Perfil</CardTitle>
        <CardDescription className="text-zinc-500">Tu información personal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xl">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-zinc-200">{user.name}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
            <span className="inline-block mt-1 text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded capitalize">
              {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-300">Nombre completo</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 max-w-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-zinc-300">Email</Label>
          <Input
            value={user.email}
            disabled
            className="bg-zinc-800/50 border-zinc-800 text-zinc-500 max-w-sm"
          />
          <p className="text-xs text-zinc-600">El email no puede cambiarse</p>
        </div>

        <div className="flex items-center gap-3 pt-2 text-xs text-zinc-600">
          <span>Miembro desde {new Date(user.createdAt).toLocaleDateString("es-ES")}</span>
          {user.lastLoginAt && (
            <span>
              · Último acceso {new Date(user.lastLoginAt).toLocaleDateString("es-ES")}
            </span>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={loading || name === user.name}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? "Guardado" : "Guardar cambios"}
        </Button>
      </CardContent>
    </Card>
  )
}
