import { Server as SocketIOServer } from "socket.io";
import { spawn, ChildProcess } from "child_process";
import { type IStorage } from "./storage";
import { type PowerShellTask, type ServerConnection } from "@shared/schema";
import { randomUUID } from "crypto";

export class PowerShellExecutor {
  private io: SocketIOServer;
  private storage: IStorage;
  private activeProcesses: Map<string, ChildProcess> = new Map();

  constructor(io: SocketIOServer, storage: IStorage) {
    this.io = io;
    this.storage = storage;
  }

  async executeCommand(task: PowerShellTask): Promise<void> {
    try {
      // Get server connection details
      const server = await this.storage.getServerConnection(task.serverId);
      if (!server) {
        await this.storage.updatePowerShellTaskStatus(task.id, 'failed', 'Server connection not found');
        return;
      }

      // Mark task as running
      await this.storage.updatePowerShellTaskStatus(task.id, 'running');
      
      // Emit task started event
      this.io.to(`task-${task.id}`).emit('task-started', { taskId: task.id });

      // For demonstration, we'll simulate PowerShell execution
      // In a real implementation, this would use WinRM/PowerShell Remoting
      await this.simulatePowerShellExecution(task, server);

    } catch (error: any) {
      console.error(`Error executing task ${task.id}:`, error);
      await this.storage.updatePowerShellTaskStatus(task.id, 'failed', error.message);
      this.io.to(`task-${task.id}`).emit('task-failed', { 
        taskId: task.id, 
        error: error.message 
      });
    }
  }

  private async simulatePowerShellExecution(task: PowerShellTask, server: ServerConnection): Promise<void> {
    // Simulate different types of PowerShell commands
    const isADCommand = task.command.includes('Get-ADUser') || task.command.includes('AD');
    const isDNSCommand = task.command.includes('Get-DnsServerResourceRecord') || task.command.includes('DNS');
    const isCertCommand = task.command.includes('Get-Certificate') || task.command.includes('PKI');

    let sequence = 0;
    const roomName = `task-${task.id}`;

    // Simulate command execution with streaming output
    const outputLines = this.generateMockOutput(task.command, isADCommand, isDNSCommand, isCertCommand);
    
    for (const line of outputLines) {
      // Add some realistic delay between output lines
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      // Store log chunk in database
      await this.storage.addTaskLog({
        taskId: task.id,
        sequence: sequence++,
        chunk: line
      });

      // Emit real-time output to connected clients
      this.io.to(roomName).emit('task-output', {
        taskId: task.id,
        sequence,
        chunk: line,
        timestamp: new Date().toISOString()
      });
    }

    // Determine if command succeeded or failed
    const success = !task.command.includes('error') && Math.random() > 0.2; // 80% success rate for demo
    
    if (success) {
      // For AD users sync, update the cache
      if (isADCommand && task.command.includes('Get-ADUser')) {
        await this.updateADUsersCache(task.serverId);
      }
      
      await this.storage.updatePowerShellTaskStatus(task.id, 'success', 'Command completed successfully');
      this.io.to(roomName).emit('task-completed', { 
        taskId: task.id, 
        success: true 
      });
    } else {
      const errorMsg = 'Access denied: Unable to connect to domain controller';
      await this.storage.updatePowerShellTaskStatus(task.id, 'failed', errorMsg);
      this.io.to(roomName).emit('task-failed', { 
        taskId: task.id, 
        error: errorMsg 
      });
    }
  }

  private generateMockOutput(command: string, isAD: boolean, isDNS: boolean, isCert: boolean): string[] {
    const lines: string[] = [];
    
    lines.push(`PS C:\\> ${command}`);
    lines.push('');
    
    if (isAD) {
      lines.push('Connecting to domain controller DC01.contoso.com...');
      lines.push('Querying Active Directory...');
      lines.push('');
      lines.push('[');
      lines.push('  {');
      lines.push('    \"SamAccountName\": \"jdoe\",');
      lines.push('    \"DisplayName\": \"John Doe\",');
      lines.push('    \"EmailAddress\": \"john.doe@contoso.com\",');
      lines.push('    \"Enabled\": true,');
      lines.push('    \"LockedOut\": false,');
      lines.push('    \"CanonicalName\": \"contoso.com/Users/John Doe\"');
      lines.push('  },');
      lines.push('  {');
      lines.push('    \"SamAccountName\": \"asmith\",');
      lines.push('    \"DisplayName\": \"Alice Smith\",');
      lines.push('    \"EmailAddress\": \"alice.smith@contoso.com\",');
      lines.push('    \"Enabled\": true,');
      lines.push('    \"LockedOut\": false,');
      lines.push('    \"CanonicalName\": \"contoso.com/Users/Alice Smith\"');
      lines.push('  }');
      lines.push(']');
    } else if (isDNS) {
      lines.push('Querying DNS server...');
      lines.push('Zone: contoso.com');
      lines.push('');
      lines.push('Name                Type    Data');
      lines.push('----                ----    ----');
      lines.push('@                   SOA     dc01.contoso.com.');
      lines.push('@                   NS      dc01.contoso.com.');
      lines.push('dc01                A       192.168.1.10');
      lines.push('www                 A       192.168.1.20');
      lines.push('mail                A       192.168.1.30');
    } else if (isCert) {
      lines.push('Connecting to Certificate Authority...');
      lines.push('Retrieving certificate templates...');
      lines.push('');
      lines.push('Template Name       Version  Schema Version');
      lines.push('-------------       -------  --------------');
      lines.push('WebServer           2        2');
      lines.push('Computer            3        2');
      lines.push('User                5        2');
      lines.push('DomainController    2        2');
    } else {
      lines.push('Executing PowerShell command...');
      lines.push('Command output:');
      lines.push('Operation completed successfully.');
    }
    
    lines.push('');
    lines.push('PS C:\\>');
    
    return lines;
  }

  private async updateADUsersCache(serverId: string): Promise<void> {
    // Mock AD users data for cache update
    const mockUsers = [
      {
        serverId,
        username: 'jdoe',
        displayName: 'John Doe',
        email: 'john.doe@contoso.com',
        enabled: true,
        locked: false,
        ou: 'CN=Users,DC=contoso,DC=com',
        groups: ['Domain Users', 'IT Staff'],
        sid: 'S-1-5-21-123456789-123456789-123456789-1001',
        distinguishedName: 'CN=John Doe,CN=Users,DC=contoso,DC=com'
      },
      {
        serverId,
        username: 'asmith',
        displayName: 'Alice Smith',
        email: 'alice.smith@contoso.com',
        enabled: true,
        locked: false,
        ou: 'CN=Users,DC=contoso,DC=com',
        groups: ['Domain Users', 'Managers'],
        sid: 'S-1-5-21-123456789-123456789-123456789-1002',
        distinguishedName: 'CN=Alice Smith,CN=Users,DC=contoso,DC=com'
      }
    ];

    await this.storage.syncADUsers(serverId, mockUsers);
  }

  cancelTask(taskId: string): void {
    const process = this.activeProcesses.get(taskId);
    if (process) {
      process.kill();
      this.activeProcesses.delete(taskId);
      this.io.to(`task-${taskId}`).emit('task-cancelled', { taskId });
    }
  }
}