import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  colorClass: string
  href?: string
  pulse?: boolean
  subtitle?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  href,
  pulse,
  subtitle,
}: StatCardProps) {
  const content = (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            "w-4 h-4",
            colorClass,
            pulse && "animate-pulse"
          )}
        />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div
          className={cn(
            "text-2xl font-bold",
            colorClass === "text-zinc-400"
              ? "text-zinc-100"
              : colorClass
          )}
        >
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
