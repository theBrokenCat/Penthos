import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-center px-4">
      <h1 className="text-6xl font-bold text-zinc-700 mb-4">404</h1>
      <p className="text-zinc-400 mb-6">Página no encontrada</p>
      <Button asChild variant="outline">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}
