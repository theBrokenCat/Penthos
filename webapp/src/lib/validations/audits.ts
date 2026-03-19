import { z } from "zod"

export const createAuditSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(255),
  targetUrl: z.string().url("URL inválida"),
  targetScope: z.array(z.string().url()).optional(),
  notes: z.string().max(2000).optional(),
  agentConfig: z.record(z.string(), z.any()).optional(),
})

export type CreateAuditInput = z.infer<typeof createAuditSchema>

export const updateAuditSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  notes: z.string().max(2000).optional(),
  status: z
    .enum(["queued", "running", "paused", "completed", "failed", "archived"])
    .optional(),
})

export type UpdateAuditInput = z.infer<typeof updateAuditSchema>
