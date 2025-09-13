import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusTile from "./StatusTile";
import TaskPanel from "./TaskPanel";
import { 
  Server, 
  Shield, 
  Database, 
  Users, 
  AlertTriangle, 
  Settings,
  FileText,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { Task } from "./TaskPanel";
import { taskApi, serverApi } from "@/lib/api";
import { socketService } from "@/lib/socket";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { PowerShellTask } from "@shared/schema";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch tasks using React Query
  const { data: powerShellTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: () => taskApi.getAll(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch servers for status tiles
  const { data: servers = [], isLoading: serversLoading } = useQuery({
    queryKey: ['/api/servers'],
    queryFn: () => serverApi.getAll(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Convert PowerShell tasks to Task format
  useEffect(() => {
    const convertedTasks: Task[] = powerShellTasks.map((task: PowerShellTask) => ({
      id: task.id,
      command: task.command,
      status: task.status as 'queued' | 'running' | 'success' | 'failed',
      startTime: task.startTime ? new Date(task.startTime) : undefined,
      endTime: task.endTime ? new Date(task.endTime) : undefined,
      output: task.outputSummary || '',
      error: task.errorSummary || undefined,
    }));
    setTasks(convertedTasks);
  }, [powerShellTasks]);

  // Setup Socket.IO for real-time task updates
  useEffect(() => {
    const socket = socketService.connect();

    socketService.onTaskOutput((data) => {
      setTasks(prev => prev.map(task => 
        task.id === data.taskId 
          ? { ...task, output: (task.output || '') + data.chunk + '\n' }
          : task
      ));
    });

    socketService.onTaskStarted((data) => {
      setTasks(prev => prev.map(task => 
        task.id === data.taskId 
          ? { ...task, status: 'running' as const, startTime: new Date() }
          : task
      ));
    });

    socketService.onTaskCompleted((data) => {
      setTasks(prev => prev.map(task => 
        task.id === data.taskId 
          ? { ...task, status: 'success' as const, endTime: new Date() }
          : task
      ));
      // Refresh tasks data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    });

    socketService.onTaskFailed((data) => {
      setTasks(prev => prev.map(task => 
        task.id === data.taskId 
          ? { ...task, status: 'failed' as const, endTime: new Date(), error: data.error }
          : task
      ));
      // Refresh tasks data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    });

    socketService.onTaskCancelled((data) => {
      setTasks(prev => prev.filter(task => task.id !== data.taskId));
      // Refresh tasks data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  // Join task rooms for active tasks to receive real-time updates
  useEffect(() => {
    if (tasks.length > 0) {
      tasks.forEach(task => {
        if (task.status === 'running' || task.status === 'queued') {
          socketService.joinTask(task.id);
        }
      });
    }
  }, [tasks]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    console.log('Refreshing dashboard data...');
    setLastRefresh(new Date());
    // Invalidate queries to force refresh
    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
  };

  const handleCancelTask = async (taskId: string) => {
    console.log('Cancel task:', taskId);
    try {
      await taskApi.cancel(taskId);
      // Tasks will be updated via Socket.IO event
    } catch (error) {
      console.error('Failed to cancel task:', error);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    console.log('Retry task:', taskId);
    try {
      const result = await taskApi.retry(taskId);
      
      // Join the new task for real-time updates
      socketService.joinTask(result.taskId);
      
      // Refresh tasks
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    } catch (error) {
      console.error('Failed to retry task:', error);
    }
  };

  const handleClearCompleted = () => {
    console.log('Clear completed tasks');
    setTasks(prev => prev.filter(t => t.status === 'running' || t.status === 'queued'));
  };

  return (
    <div className="p-6 space-y-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Windows Server Management</h1>
          <p className="text-muted-foreground">
            Manage Active Directory, ADCS, and DNS services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            data-testid="button-refresh-dashboard"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {serversLoading ? (
          // Loading skeleton for servers
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatusTile
              title="Domain Controller"
              value={servers.filter(s => s.roles.includes('dc')).length > 0 ? "Online" : "Offline"}
              status={servers.filter(s => s.roles.includes('dc')).length > 0 ? "online" : "error"}
              description="Replication healthy"
              icon={Server}
              actionButton={<Button size="sm" variant="outline">View Details</Button>}
            />
            
            <StatusTile
              title="Certificate Authority"
              value={servers.filter(s => s.roles.includes('ca')).length > 0 ? "Active" : "Inactive"}
              status={servers.filter(s => s.roles.includes('ca')).length > 0 ? "online" : "error"}
              description="CRL valid for 7 days"
              icon={Shield}
              actionButton={<Button size="sm" variant="outline">Manage CA</Button>}
            />
            
            <StatusTile
              title="DNS Service"
              value={servers.filter(s => s.roles.includes('dns')).length > 0 ? "Active" : "Inactive"}
              status={servers.filter(s => s.roles.includes('dns')).length > 0 ? "online" : "error"}
              description="2 zones need attention"
              icon={Database}
              actionButton={<Button size="sm" variant="outline">Fix Issues</Button>}
            />
            
            <StatusTile
              title="Expiring Certificates"
              value="12"
              status="error"
              description="Expiring in 30 days"
              icon={AlertTriangle}
              actionButton={<Button size="sm" variant="destructive">Review</Button>}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" data-testid="button-quick-manage-users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-quick-issue-cert">
                <Shield className="h-4 w-4 mr-2" />
                Issue Certificate
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-quick-dns-records">
                <Database className="h-4 w-4 mr-2" />
                DNS Records
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-quick-audit-logs">
                <FileText className="h-4 w-4 mr-2" />
                Audit Logs
              </Button>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded-md bg-amber-500/10">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">DNS Zone Transfer Failed</p>
                    <p className="text-xs text-muted-foreground">contoso.com zone - 5 minutes ago</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 border rounded-md bg-red-500/10">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Certificate Expiring Soon</p>
                    <p className="text-xs text-muted-foreground">WebServer template - 2 days left</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Task Panel */}
        <div className="lg:col-span-2">
          <TaskPanel
            tasks={tasks}
            onCancelTask={handleCancelTask}
            onRetryTask={handleRetryTask}
            onClearCompleted={handleClearCompleted}
          />
        </div>
      </div>
    </div>
  );
}