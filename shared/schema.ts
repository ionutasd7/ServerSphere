import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  uuid, 
  integer, 
  boolean, 
  timestamp, 
  jsonb,
  pgEnum,
  unique,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for type safety
export const protocolEnum = pgEnum('protocol', ['winrm', 'ssh']);
export const taskStatusEnum = pgEnum('task_status', ['queued', 'running', 'success', 'failed']);
export const certificateStatusEnum = pgEnum('certificate_status', ['issued', 'pending', 'revoked', 'expired']);
export const dnsRecordTypeEnum = pgEnum('dns_record_type', ['A', 'AAAA', 'CNAME', 'TXT', 'SRV', 'MX', 'NS', 'PTR']);

// Server Connections
export const serverConnections = pgTable("server_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  hostname: text("hostname").notNull(),
  port: integer("port").notNull().default(5985),
  protocol: protocolEnum("protocol").notNull().default('winrm'),
  username: text("username").notNull(),
  // Store encrypted credentials or reference to external secret store
  encryptedCredentials: text("encrypted_credentials").notNull(),
  useHttps: boolean("use_https").notNull().default(false),
  skipCertValidation: boolean("skip_cert_validation").notNull().default(false),
  timeout: integer("timeout").notNull().default(30),
  roles: text("roles").array().notNull().default(sql`ARRAY[]::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  lastTested: timestamp("last_tested", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  connectionIdx: index("server_connections_connection_idx").on(table.hostname, table.port, table.protocol, table.username),
}));

// PowerShell Tasks
export const powerShellTasks = pgTable("powershell_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id").notNull().references(() => serverConnections.id, { onDelete: 'cascade' }),
  command: text("command").notNull(),
  status: taskStatusEnum("status").notNull().default('queued'),
  // Store only summary or final output here; use task_logs for streaming
  outputSummary: text("output_summary"),
  errorSummary: text("error_summary"),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  serverIdx: index("powershell_tasks_server_idx").on(table.serverId),
  statusIdx: index("powershell_tasks_status_idx").on(table.status),
  startTimeIdx: index("powershell_tasks_start_time_idx").on(table.startTime),
}));

// Task Logs for streaming output
export const taskLogs = pgTable("task_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => powerShellTasks.id, { onDelete: 'cascade' }),
  sequence: integer("sequence").notNull(),
  chunk: text("chunk").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  taskSequenceIdx: index("task_logs_task_sequence_idx").on(table.taskId, table.sequence),
}));

// AD Users Cache (for display and search)
export const adUsers = pgTable("ad_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id").notNull().references(() => serverConnections.id, { onDelete: 'cascade' }),
  username: text("username").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  enabled: boolean("enabled").notNull().default(true),
  locked: boolean("locked").notNull().default(false),
  lastLogon: timestamp("last_logon", { withTimezone: true }),
  passwordExpiry: timestamp("password_expiry", { withTimezone: true }),
  ou: text("ou"),
  groups: text("groups").array().notNull().default(sql`ARRAY[]::text[]`),
  sid: text("sid"), // Windows SID for stable identification
  distinguishedName: text("distinguished_name"), // LDAP DN
  lastSynced: timestamp("last_synced", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  serverUserIdx: unique("ad_users_server_user_idx").on(table.serverId, table.username),
  serverIdx: index("ad_users_server_idx").on(table.serverId),
  usernameIdx: index("ad_users_username_idx").on(table.username),
}));

// Certificates Cache
export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id").notNull().references(() => serverConnections.id, { onDelete: 'cascade' }),
  serialNumber: text("serial_number").notNull(),
  subject: text("subject").notNull(),
  issuer: text("issuer").notNull(),
  template: text("template"),
  status: certificateStatusEnum("status").notNull(),
  thumbprint: text("thumbprint"), // SHA1 hash for stable identification
  issuedDate: timestamp("issued_date", { withTimezone: true }),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  lastSynced: timestamp("last_synced", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  serverSerialIdx: unique("certificates_server_serial_idx").on(table.serverId, table.serialNumber),
  serverIdx: index("certificates_server_idx").on(table.serverId),
  statusIdx: index("certificates_status_idx").on(table.status),
  expiryIdx: index("certificates_expiry_idx").on(table.expiryDate),
}));

// DNS Records Cache
export const dnsRecords = pgTable("dns_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id").notNull().references(() => serverConnections.id, { onDelete: 'cascade' }),
  zone: text("zone").notNull(),
  name: text("name").notNull(),
  type: dnsRecordTypeEnum("type").notNull(),
  value: text("value").notNull(),
  ttl: integer("ttl").notNull().default(3600),
  priority: integer("priority"), // For MX and SRV records
  lastSynced: timestamp("last_synced", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  serverZoneRecordIdx: unique("dns_records_server_zone_record_idx").on(table.serverId, table.zone, table.name, table.type, table.value),
  serverZoneIdx: index("dns_records_server_zone_idx").on(table.serverId, table.zone),
  nameTypeIdx: index("dns_records_name_type_idx").on(table.serverId, table.name, table.type),
}));

// Create insert schemas
export const insertServerConnectionSchema = createInsertSchema(serverConnections).omit({
  id: true,
  isActive: true,
  lastTested: true,
  createdAt: true,
}).extend({
  // Accept password for input, but will be encrypted before storage
  password: z.string().min(1, "Password is required"),
});

export const insertPowerShellTaskSchema = createInsertSchema(powerShellTasks).omit({
  id: true,
  status: true,
  outputSummary: true,
  errorSummary: true,
  startTime: true,
  endTime: true,
  createdAt: true,
});

export const insertTaskLogSchema = createInsertSchema(taskLogs).omit({
  id: true,
  timestamp: true,
});

export const insertADUserSchema = createInsertSchema(adUsers).omit({
  id: true,
  lastSynced: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  lastSynced: true,
});

export const insertDnsRecordSchema = createInsertSchema(dnsRecords).omit({
  id: true,
  lastSynced: true,
});

// Zod enums for validation
export const ProtocolEnum = z.enum(['winrm', 'ssh']);
export const TaskStatusEnum = z.enum(['queued', 'running', 'success', 'failed']);
export const CertificateStatusEnum = z.enum(['issued', 'pending', 'revoked', 'expired']);
export const DnsRecordTypeEnum = z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'SRV', 'MX', 'NS', 'PTR']);

// Export types
export type ServerConnection = typeof serverConnections.$inferSelect;
export type InsertServerConnection = z.infer<typeof insertServerConnectionSchema>;

export type PowerShellTask = typeof powerShellTasks.$inferSelect;
export type InsertPowerShellTask = z.infer<typeof insertPowerShellTaskSchema>;

export type TaskLog = typeof taskLogs.$inferSelect;
export type InsertTaskLog = z.infer<typeof insertTaskLogSchema>;

export type ADUser = typeof adUsers.$inferSelect;
export type InsertADUser = z.infer<typeof insertADUserSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type DnsRecord = typeof dnsRecords.$inferSelect;
export type InsertDnsRecord = z.infer<typeof insertDnsRecordSchema>;
