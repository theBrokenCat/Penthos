"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Moon, Sun, Monitor } from "lucide-react"

const THEMES = [
  { id: "dark", label: "Oscuro", icon: Moon, desc: "Recomendado para uso nocturno" },
  {
    id: "light",
    label: "Claro",
    icon: Sun,
    desc: "Para entornos bien iluminados",
  },
  { id: "system", label: "Sistema", icon: Monitor, desc: "Sigue la preferencia del OS" },
]

export function AppearanceSection() {
  const currentTheme = "dark"

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 text-base">Apariencia</CardTitle>
        <CardDescription className="text-zinc-500">
          Personaliza la interfaz del portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-300">Tema</p>
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-colors",
                  currentTheme === theme.id
                    ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                )}
              >
                <theme.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{theme.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-600">
            El cambio de tema estará disponible en próximas versiones
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">Idioma de la interfaz</p>
          <div className="flex gap-2">
            {["Español", "English"].map((lang, i) => (
              <button
                key={lang}
                className={cn(
                  "px-4 py-2 rounded-md text-sm border transition-colors",
                  i === 0
                    ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-600">
            Soporte multiidioma disponible en próximas versiones
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
