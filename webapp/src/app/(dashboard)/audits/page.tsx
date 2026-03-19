import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function AuditsPage() {
  return (
    <div>
      <PageHeader
        title="Auditorías"
        description="Gestiona todas las auditorías de seguridad"
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva auditoría
          </Button>
        }
      />
      <div className="flex items-center justify-center h-64 border border-dashed border-zinc-800 rounded-lg">
        <p className="text-zinc-500 text-sm">Módulo en construcción</p>
      </div>
    </div>
  )
}
