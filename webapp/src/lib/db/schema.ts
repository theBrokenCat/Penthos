import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "analyst", "viewer"] })
    .notNull()
    .default("viewer"),
  avatarUrl: text("avatar_url"),
  totpSecret: text("totp_secret"),
  totpEnabled: integer("totp_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  apiKeyHash: text("api_key_hash"),
  apiKeyName: text("api_key_name"),
  apiKeyScopes: text("api_key_scopes"),
  apiKeyCreatedAt: text("api_key_created_at"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  isActive: integer("is_active", { mode: "boolean" })
    .notNull()
    .default(true),
})

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadata: text("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull(),
})

export const audits = sqliteTable("audits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  targetUrl: text("target_url").notNull(),
  targetScope: text("target_scope"),
  status: text("status", {
    enum: ["queued", "running", "paused", "completed", "failed", "archived"],
  })
    .notNull()
    .default("queued"),
  sessionId: text("session_id"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  notes: text("notes"),
  agentConfig: text("agent_config"),
  totalFindings: integer("total_findings").notNull().default(0),
  criticalCount: integer("critical_count").notNull().default(0),
  highCount: integer("high_count").notNull().default(0),
  mediumCount: integer("medium_count").notNull().default(0),
  lowCount: integer("low_count").notNull().default(0),
})

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  auditId: text("audit_id").notNull(),
  generatedBy: text("generated_by").notNull(),
  format: text("format", { enum: ["docx", "pdf", "md"] })
    .notNull()
    .default("docx"),
  template: text("template").notNull().default("technical"),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  generatedAt: text("generated_at").notNull(),
})

export const hitlReviews = sqliteTable("hitl_reviews", {
  id: text("id").primaryKey(),
  auditId: text("audit_id").notNull(),
  agentName: text("agent_name").notNull(),
  action: text("action").notNull(),
  context: text("context"),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull(),
})

export const findingOverrides = sqliteTable("finding_overrides", {
  findingId: text("finding_id").primaryKey(),
  auditId: text("audit_id").notNull(),
  isFalsePositive: integer("is_false_positive", { mode: "boolean" })
    .notNull()
    .default(false),
  isResolved: integer("is_resolved", { mode: "boolean" })
    .notNull()
    .default(false),
  resolution: text("resolution"),
  fpReason: text("fp_reason"),
  notes: text("notes"),
  updatedAt: text("updated_at").notNull(),
})
