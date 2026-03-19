import { auth } from "@/lib/auth"
import { AgentsMonitorClient } from "@/components/agents/AgentsMonitorClient"

export default async function AgentsPage() {
  const session = await auth()
  const isAdmin = (session?.user as any)?.role === "admin"
  return <AgentsMonitorClient isAdmin={isAdmin} />
}
