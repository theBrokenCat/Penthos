import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth-helpers"
import { db, initDb } from "@/lib/db"
import { audits } from "@/lib/db/schema"
import { createAuditSchema } from "@/lib/validations/audits"
import { and, like, inArray, desc, asc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    initDb()
    const user = await requireAuth()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")
    const search = searchParams.get("search")
    const status = searchParams.get("status")?.split(",")
    const sortBy = searchParams.get("sortBy") ?? "createdAt"
    const order = searchParams.get("order") ?? "desc"

    let allResults = await db.select().from(audits)

    // Filter in memory
    if (search) {
      allResults = allResults.filter((a: any) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status && status.length > 0) {
      allResults = allResults.filter((a: any) =>
        status.includes(a.status)
      )
    }

    // Sort in memory
    const orderFunc = order === "asc" ? 1 : -1
    allResults.sort((a: any, b: any) => {
      const aVal = (a as any)[sortBy] ?? ""
      const bVal = (b as any)[sortBy] ?? ""
      if (aVal < bVal) return -1 * orderFunc
      if (aVal > bVal) return 1 * orderFunc
      return 0
    })

    const total = allResults.length
    const offset = (page - 1) * limit
    const data = allResults.slice(offset, offset + limit)

    return NextResponse.json({
      data,
      meta: { total, page, limit },
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No autenticado" } },
        { status: 401 }
      )
    }
    console.error(error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno" } },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    initDb()
    const user = await requireAuth()

    const body = await req.json()
    const validatedData = createAuditSchema.parse(body)

    const auditId = crypto.randomUUID()
    const now = new Date().toISOString()

    const newAudit = {
      id: auditId,
      name: validatedData.name,
      targetUrl: validatedData.targetUrl,
      targetScope: validatedData.targetScope ? JSON.stringify(validatedData.targetScope) : null,
      status: "queued" as const,
      sessionId: null,
      createdBy: (user as any).id,
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      completedAt: null,
      notes: validatedData.notes || null,
      agentConfig: validatedData.agentConfig ? JSON.stringify(validatedData.agentConfig) : null,
      totalFindings: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    }

    await db.insert(audits).values(newAudit)

    return NextResponse.json(
      {
        data: {
          id: auditId,
          name: validatedData.name,
          targetUrl: validatedData.targetUrl,
          status: "queued",
          createdBy: (user as any).id,
          createdAt: now,
          updatedAt: now,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No autenticado" } },
        { status: 401 }
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: error.issues } },
        { status: 400 }
      )
    }
    console.error(error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno" } },
      { status: 500 }
    )
  }
}
