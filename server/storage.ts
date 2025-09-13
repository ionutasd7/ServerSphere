import { 
  type ServerConnection, 
  type InsertServerConnection,
  type PowerShellTask,
  type InsertPowerShellTask,
  type TaskLog,
  type InsertTaskLog,
  type ADUser,
  type InsertADUser,
  type Certificate,
  type InsertCertificate,
  type DnsRecord,
  type InsertDnsRecord
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import crypto from "crypto";

// Create database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Simple encryption for demo - in production use proper key management
const ENCRYPTION_KEY = process.env.SESSION_SECRET || 'demo-key-not-secure';

function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export interface IStorage {
  // Server Connections
  getServerConnections(): Promise<ServerConnection[]>;
  getServerConnection(id: string): Promise<ServerConnection | undefined>;
  createServerConnection(connection: InsertServerConnection & { password: string }): Promise<ServerConnection>;
  updateServerConnection(id: string, updates: Partial<InsertServerConnection>): Promise<ServerConnection | undefined>;
  deleteServerConnection(id: string): Promise<boolean>;
  testServerConnection(id: string): Promise<boolean>;

  // PowerShell Tasks
  getPowerShellTasks(serverId?: string): Promise<PowerShellTask[]>;
  getPowerShellTask(id: string): Promise<PowerShellTask | undefined>;
  createPowerShellTask(task: InsertPowerShellTask): Promise<PowerShellTask>;
  updatePowerShellTaskStatus(id: string, status: 'running' | 'success' | 'failed', summary?: string): Promise<void>;
  addTaskLog(log: InsertTaskLog): Promise<void>;
  getTaskLogs(taskId: string): Promise<TaskLog[]>;

  // AD Users
  getADUsers(serverId: string): Promise<ADUser[]>;
  syncADUsers(serverId: string, users: InsertADUser[]): Promise<void>;
  
  // Certificates
  getCertificates(serverId: string): Promise<Certificate[]>;
  syncCertificates(serverId: string, certificates: InsertCertificate[]): Promise<void>;
  
  // DNS Records
  getDnsRecords(serverId: string, zone?: string): Promise<DnsRecord[]>;
  syncDnsRecords(serverId: string, records: InsertDnsRecord[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Server Connections
  async getServerConnections(): Promise<ServerConnection[]> {
    return await db.select().from(schema.serverConnections).orderBy(asc(schema.serverConnections.name));
  }

  async getServerConnection(id: string): Promise<ServerConnection | undefined> {
    const result = await db.select().from(schema.serverConnections).where(eq(schema.serverConnections.id, id));
    return result[0];
  }

  async createServerConnection(connection: InsertServerConnection & { password: string }): Promise<ServerConnection> {
    const { password, ...connectionData } = connection;
    const encryptedCredentials = encrypt(password);
    
    const result = await db.insert(schema.serverConnections).values({
      ...connectionData,
      encryptedCredentials
    }).returning();
    
    return result[0];
  }

  async updateServerConnection(id: string, updates: Partial<InsertServerConnection>): Promise<ServerConnection | undefined> {
    const result = await db.update(schema.serverConnections)
      .set(updates)
      .where(eq(schema.serverConnections.id, id))
      .returning();
    return result[0];
  }

  async deleteServerConnection(id: string): Promise<boolean> {
    const result = await db.delete(schema.serverConnections).where(eq(schema.serverConnections.id, id));
    return result.rowCount > 0;
  }

  async testServerConnection(id: string): Promise<boolean> {
    // Update last tested timestamp
    await db.update(schema.serverConnections)
      .set({ lastTested: new Date() })
      .where(eq(schema.serverConnections.id, id));
    
    // In real implementation, this would test the actual connection
    return Math.random() > 0.3; // Mock success rate
  }

  // PowerShell Tasks
  async getPowerShellTasks(serverId?: string): Promise<PowerShellTask[]> {
    const query = db.select().from(schema.powerShellTasks);
    if (serverId) {
      return await query.where(eq(schema.powerShellTasks.serverId, serverId))
        .orderBy(desc(schema.powerShellTasks.createdAt));
    }
    return await query.orderBy(desc(schema.powerShellTasks.createdAt));
  }

  async getPowerShellTask(id: string): Promise<PowerShellTask | undefined> {
    const result = await db.select().from(schema.powerShellTasks).where(eq(schema.powerShellTasks.id, id));
    return result[0];
  }

  async createPowerShellTask(task: InsertPowerShellTask): Promise<PowerShellTask> {
    const result = await db.insert(schema.powerShellTasks).values(task).returning();
    return result[0];
  }

  async updatePowerShellTaskStatus(id: string, status: 'running' | 'success' | 'failed', summary?: string): Promise<void> {
    const updates: any = { status };
    
    if (status === 'running') {
      updates.startTime = new Date();
    } else if (status === 'success' || status === 'failed') {
      updates.endTime = new Date();
      if (summary) {
        if (status === 'success') {
          updates.outputSummary = summary;
        } else {
          updates.errorSummary = summary;
        }
      }
    }

    await db.update(schema.powerShellTasks)
      .set(updates)
      .where(eq(schema.powerShellTasks.id, id));
  }

  async addTaskLog(log: InsertTaskLog): Promise<void> {
    await db.insert(schema.taskLogs).values(log);
  }

  async getTaskLogs(taskId: string): Promise<TaskLog[]> {
    return await db.select().from(schema.taskLogs)
      .where(eq(schema.taskLogs.taskId, taskId))
      .orderBy(asc(schema.taskLogs.sequence));
  }

  // AD Users
  async getADUsers(serverId: string): Promise<ADUser[]> {
    return await db.select().from(schema.adUsers)
      .where(eq(schema.adUsers.serverId, serverId))
      .orderBy(asc(schema.adUsers.username));
  }

  async syncADUsers(serverId: string, users: InsertADUser[]): Promise<void> {
    // Simple sync - delete existing and insert new
    await db.delete(schema.adUsers).where(eq(schema.adUsers.serverId, serverId));
    if (users.length > 0) {
      await db.insert(schema.adUsers).values(users);
    }
  }

  // Certificates
  async getCertificates(serverId: string): Promise<Certificate[]> {
    return await db.select().from(schema.certificates)
      .where(eq(schema.certificates.serverId, serverId))
      .orderBy(asc(schema.certificates.expiryDate));
  }

  async syncCertificates(serverId: string, certificates: InsertCertificate[]): Promise<void> {
    await db.delete(schema.certificates).where(eq(schema.certificates.serverId, serverId));
    if (certificates.length > 0) {
      await db.insert(schema.certificates).values(certificates);
    }
  }

  // DNS Records
  async getDnsRecords(serverId: string, zone?: string): Promise<DnsRecord[]> {
    if (zone) {
      return await db.select().from(schema.dnsRecords)
        .where(and(
          eq(schema.dnsRecords.serverId, serverId),
          eq(schema.dnsRecords.zone, zone)
        ))
        .orderBy(asc(schema.dnsRecords.name));
    }
    
    return await db.select().from(schema.dnsRecords)
      .where(eq(schema.dnsRecords.serverId, serverId))
      .orderBy(asc(schema.dnsRecords.zone), asc(schema.dnsRecords.name));
  }

  async syncDnsRecords(serverId: string, records: InsertDnsRecord[]): Promise<void> {
    await db.delete(schema.dnsRecords).where(eq(schema.dnsRecords.serverId, serverId));
    if (records.length > 0) {
      await db.insert(schema.dnsRecords).values(records);
    }
  }
}

export const storage = new DatabaseStorage();
