import { NextRequest, NextResponse } from "next/server"
import { getAllAgentsStatus } from "@/lib/openclaw"

export async function GET(req: NextRequest) {
  try {
    const status = await getAllAgentsStatus()
    return NextResponse.json({ data: status })
  } catch (error: any) {
    console.error(error)
    // No crashear, devolver status vacío
    return NextResponse.json({
      data: {
        supervisor: { name: "supervisor", status: "offline", model: "", port: 3001, findingsCount: 0 },
        explorer: { name: "explorer", status: "offline", model: "", port: 3002, findingsCount: 0 },
        analyst: { name: "analyst", status: "offline", model: "", port: 3003, findingsCount: 0 },
        exploiter: { name: "exploiter", status: "offline", model: "", port: 3004, findingsCount: 0 },
      },
    })
  }
}
