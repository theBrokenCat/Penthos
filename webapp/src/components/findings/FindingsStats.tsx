"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Finding } from "@/types"

interface Props {
  counts: {
    critical: number
    high: number
    medium: number
    low: number
    total: number
  }
  findings: Finding[]
}

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#60a5fa",
  info: "#71717a",
}

export function FindingsStats({ counts, findings }: Props) {
  const barData = [
    { name: "Crítico", value: counts.critical, color: "#ef4444" },
    { name: "Alto", value: counts.high, color: "#f97316" },
    { name: "Medio", value: counts.medium, color: "#eab308" },
    { name: "Bajo", value: counts.low, color: "#60a5fa" },
  ].filter((d) => d.value > 0)

  // Agrupación por tipo
  const typeCount: Record<string, number> = {}
  findings.forEach((f) => {
    typeCount[f.type] = (typeCount[f.type] ?? 0) + 1
  })
  const pieData = Object.entries(typeCount).map(([name, value]) => ({
    name,
    value,
  }))

  // Top endpoints
  const endpointCount: Record<string, number> = {}
  findings.forEach((f) => {
    if (f.url) endpointCount[f.url] = (endpointCount[f.url] ?? 0) + 1
  })
  const topEndpoints = Object.entries(endpointCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const PIE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b"]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-300">Por severidad</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 6,
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-300">Por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
              Sin datos
            </div>
          )}
        </CardContent>
      </Card>

      {topEndpoints.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-300">
              Top endpoints con más hallazgos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topEndpoints.map(([url, count]) => (
                <div key={url} className="flex items-center gap-3">
                  <code className="text-xs text-zinc-400 flex-1 truncate font-mono">
                    {url}
                  </code>
                  <span className="text-xs font-medium text-zinc-300 flex-shrink-0">
                    {count} finding{count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
