"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

const PASSWORD_RULES = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Una mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un número", test: (p: string) => /\d/.test(p) },
  { label: "Un símbolo", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export function PasswordSection() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" })
  const [show, setShow] = useState({ current: false, new: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPass !== form.confirm) {
      setError("Las contraseñas no coinciden")
      return
    }
    setLoading(true)
    setError("")
    const res = await fetch("/api/user/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.current,
        newPassword: form.newPass,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error?.message ?? "Error al cambiar contraseña")
      setLoading(false)
      return
    }
    setSuccess(true)
    setForm({ current: "", newPass: "", confirm: "" })
    setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 text-base">Contraseña</CardTitle>
        <CardDescription className="text-zinc-500">
          Actualiza tu contraseña de acceso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          {[
            { key: "current", label: "Contraseña actual", showKey: "current" as const },
            { key: "newPass", label: "Nueva contraseña", showKey: "new" as const },
            {
              key: "confirm",
              label: "Confirmar nueva contraseña",
              showKey: "new" as const,
            },
          ].map(({ key, label, showKey }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-zinc-300">{label}</Label>
              <div className="relative">
                <Input
                  type={show[showKey] ? "text" : "password"}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
                >
                  {show[showKey] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {form.newPass && (
            <div className="space-y-1">
              {PASSWORD_RULES.map((rule) => (
                <div
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    rule.test(form.newPass) ? "text-green-400" : "text-zinc-600"
                  )}
                >
                  {rule.test(form.newPass) ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                  {rule.label}
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && (
            <p className="text-sm text-green-400">✓ Contraseña actualizada correctamente</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Cambiar contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
