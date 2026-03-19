"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  FolderSearch,
  Bot,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/audits", icon: FolderSearch, label: "Auditorías" },
  { href: "/agents", icon: Bot, label: "Agentes" },
]

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-[240px] flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-zinc-800">
        <span className="font-semibold text-zinc-100 flex items-center gap-2">
          <span className="text-xl">🕷️</span>
          <span>OpenClaw</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <Separator className="my-2 bg-zinc-800" />

        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          )}
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Link>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
              {user.name?.slice(0, 2).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {user.name}
            </p>
            <p className="text-xs text-zinc-500 truncate capitalize">
              {(user as any).role ?? "viewer"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
