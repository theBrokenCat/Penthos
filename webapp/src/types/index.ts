export type UserRole = "admin" | "analyst" | "viewer"
export type AuditStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "archived"
export type Severity = "critical" | "high" | "medium" | "low" | "info"
export type AgentStatus =
  | "online"
  | "offline"
  | "busy"
  | "error"
  | "starting"
export type AgentName = "supervisor" | "explorer" | "analyst" | "exploiter"

export interface AuditRecord {
  id: string
  name: string
  targetUrl: string
  targetScope?: string[]
  status: AuditStatus
  sessionId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  notes?: string
  agentConfig?: string
  totalFindings: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export interface Finding {
  id: string
  sessionId: string
  type:
    | "vulnerability"
    | "credential"
    | "endpoint"
    | "tech_stack"
    | "anomaly"
    | "note"
  severity: Severity
  title: string
  description: string
  url: string
  method?: string
  parameter?: string
  evidence?: {
    request?: string
    response?: string
    payload?: string
  }
  cvss?: number
  cvssVector?: string
  recommendation?: string
  references?: string[]
  agent: string
  isFalsePositive: boolean
  isResolved: boolean
  notes?: string
  createdAt: string
}

export interface AgentInfo {
  name: AgentName
  status: AgentStatus
  currentTask?: string
  currentAuditId?: string
  currentAuditName?: string
  findingsCount: number
  uptime?: number
  model: string
  lastActivityAt?: string
  port: number
}

export interface ApiResponse<T> {
  data?: T
  error?: { code: string; message: string; details?: any }
  meta?: { total: number; page: number; limit: number }
}
