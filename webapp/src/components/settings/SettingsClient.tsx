"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileSection } from "./ProfileSection"
import { PasswordSection } from "./PasswordSection"
import { ApiKeysSection } from "./ApiKeysSection"
import { AppearanceSection } from "./AppearanceSection"
import { UsersSection } from "./admin/UsersSection"
import { User, Lock, Key, Palette, Users, ScrollText } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const NAV_ITEMS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "security", label: "Seguridad", icon: Lock },
  { id: "apikeys", label: "API Keys", icon: Key },
  { id: "appearance", label: "Apariencia", icon: Palette },
]

const ADMIN_NAV_ITEMS = [
  { id: "users", label: "Usuarios", icon: Users },
  { id: "auditlog", label: "Audit Log", icon: ScrollText },
]

interface Props {
  user: any
  isAdmin: boolean
}

export function SettingsClient({ user, isAdmin }: Props) {
  const [activeSection, setActiveSection] = useState("profile")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Gestiona tu perfil y preferencias"
      />

      <div className="flex gap-8">
        <nav className="w-48 flex-shrink-0 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                activeSection === item.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}

          {isAdmin && (
            <>
              <Separator className="my-2 bg-zinc-800" />
              <p className="px-3 py-1 text-xs text-zinc-600 font-medium uppercase tracking-wide">
                Administración
              </p>
              {ADMIN_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                    activeSection === item.id
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="flex-1 min-w-0">
          {activeSection === "profile" && <ProfileSection user={user} />}
          {activeSection === "security" && <PasswordSection />}
          {activeSection === "apikeys" && <ApiKeysSection />}
          {activeSection === "appearance" && <AppearanceSection />}
          {activeSection === "users" && isAdmin && <UsersSection />}
          {activeSection === "auditlog" && isAdmin && (
            <div className="flex items-center justify-center h-32 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-zinc-600 text-sm">Audit Log — próximamente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
