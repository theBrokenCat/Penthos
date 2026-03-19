import { z } from "zod"

export const generateReportSchema = z.object({
  auditId: z.string().min(1, "ID de auditoría requerido"),
  template: z.enum(["executive", "technical", "full"]).default("technical"),
  clientName: z.string().optional(),
  auditorName: z.string().optional(),
  lang: z.enum(["es", "en"]).default("es"),
})

export type GenerateReportInput = z.infer<typeof generateReportSchema>
