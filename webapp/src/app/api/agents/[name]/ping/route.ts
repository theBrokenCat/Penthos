import { NextRequest, NextResponse } from "next/server"
import { getAgentStatus } from "@/lib/openclaw"

export async function POST(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params
    const result = await getAgentStatus(name)
    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ data: { status: "offline" } })
  }
}
