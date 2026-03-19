import { NextRequest, NextResponse } from "next/server"
import { getAgentStatus } from "@/lib/openclaw"

async function checkChromaDB(): Promise<{ status: "online" | "offline"; collections?: number; totalFindings?: number }> {
  try {
    const response = await fetch("http://localhost:8000/api/v1/heartbeat", {
      signal: AbortSignal.timeout(2000),
    })
    if (response.ok) {
      return { status: "online", collections: 0, totalFindings: 0 }
    }
    return { status: "offline" }
  } catch {
    return { status: "offline" }
  }
}

async function checkZAP(): Promise<{ status: "online" | "offline"; lastScanAt?: string | null }> {
  try {
    const response = await fetch("http://localhost:8080/api/v2/core/version", {
      signal: AbortSignal.timeout(2000),
    })
    if (response.ok) {
      return { status: "online", lastScanAt: null }
    }
    return { status: "offline" }
  } catch {
    return { status: "offline" }
  }
}

async function checkInteractsh(): Promise<{ status: "online" | "offline"; pendingCallbacks?: number }> {
  try {
    const response = await fetch("http://localhost:8443", {
      signal: AbortSignal.timeout(2000),
    })
    if (response.ok) {
      return { status: "online", pendingCallbacks: 0 }
    }
    return { status: "offline" }
  } catch {
    return { status: "offline" }
  }
}

export async function GET(req: NextRequest) {
  try {
    const [chromadbStatus, zapStatus, interactshStatus] = await Promise.all([
      checkChromaDB(),
      checkZAP(),
      checkInteractsh(),
    ])

    return NextResponse.json({
      data: {
        chromadb: chromadbStatus,
        zap: zapStatus,
        interactsh: interactshStatus,
      },
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      {
        data: {
          chromadb: { status: "offline" },
          zap: { status: "offline" },
          interactsh: { status: "offline" },
        },
      },
      { status: 200 }
    )
  }
}
