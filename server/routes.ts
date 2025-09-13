import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { PowerShellExecutor } from "./powershell-executor";
import {
  insertServerConnectionSchema,
  insertPowerShellTaskSchema,
  ProtocolEnum,
  TaskStatusEnum
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup Socket.IO for real-time PowerShell output streaming
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Initialize PowerShell executor with Socket.IO for streaming
  const psExecutor = new PowerShellExecutor(io, storage);

  // Server Connection Management
  app.get("/api/servers", async (req, res) => {
    try {
      const servers = await storage.getServerConnections();
      res.json(servers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/servers", async (req, res) => {
    try {
      const data = insertServerConnectionSchema.parse(req.body);
      const server = await storage.createServerConnection(data);
      res.json(server);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get("/api/servers/:id", async (req, res) => {
    try {
      const server = await storage.getServerConnection(req.params.id);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.json(server);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/servers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteServerConnection(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/servers/:id/test", async (req, res) => {
    try {
      const success = await storage.testServerConnection(req.params.id);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PowerShell Task Management
  app.get("/api/tasks", async (req, res) => {
    try {
      const serverId = req.query.serverId as string | undefined;
      const tasks = await storage.getPowerShellTasks(serverId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const data = insertPowerShellTaskSchema.parse(req.body);
      const task = await storage.createPowerShellTask(data);
      
      // Execute the PowerShell command asynchronously
      psExecutor.executeCommand(task);
      
      res.json(task);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getPowerShellTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tasks/:id/logs", async (req, res) => {
    try {
      const logs = await storage.getTaskLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks/:id/cancel", async (req, res) => {
    try {
      const task = await storage.getPowerShellTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Update task status to cancelled
      await storage.updatePowerShellTaskStatus(req.params.id, TaskStatusEnum.Enum.cancelled);
      
      // Emit cancellation event to connected clients
      io.to(`task-${req.params.id}`).emit("task-cancelled", { taskId: req.params.id });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks/:id/retry", async (req, res) => {
    try {
      const originalTask = await storage.getPowerShellTask(req.params.id);
      if (!originalTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Create a new task with the same command and server
      const newTask = await storage.createPowerShellTask({
        serverId: originalTask.serverId,
        command: originalTask.command
      });
      
      // Execute the new task
      psExecutor.executeCommand(newTask);
      
      res.json({ taskId: newTask.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Active Directory Management
  app.get("/api/servers/:serverId/ad/users", async (req, res) => {
    try {
      const users = await storage.getADUsers(req.params.serverId);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/servers/:serverId/ad/users/sync", async (req, res) => {
    try {
      const serverId = req.params.serverId;
      const command = "Get-ADUser -Filter * -Properties DisplayName,EmailAddress,Enabled,LockedOut,LastLogonDate,PasswordExpired,CanonicalName,MemberOf | ConvertTo-Json";
      
      const task = await storage.createPowerShellTask({
        serverId,
        command
      });
      
      psExecutor.executeCommand(task);
      res.json({ taskId: task.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Certificate Management
  app.get("/api/servers/:serverId/certificates", async (req, res) => {
    try {
      const certificates = await storage.getCertificates(req.params.serverId);
      res.json(certificates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DNS Management
  app.get("/api/servers/:serverId/dns/records", async (req, res) => {
    try {
      const zone = req.query.zone as string | undefined;
      const records = await storage.getDnsRecords(req.params.serverId, zone);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    socket.on("join-task", (taskId: string) => {
      socket.join(`task-${taskId}`);
      console.log(`Client ${socket.id} joined task ${taskId}`);
    });
    
    socket.on("leave-task", (taskId: string) => {
      socket.leave(`task-${taskId}`);
      console.log(`Client ${socket.id} left task ${taskId}`);
    });
    
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return httpServer;
}
