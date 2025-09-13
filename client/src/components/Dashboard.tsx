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

//todo: remove mock functionality
const mockTasks: Task[] = [
  {
    id: '1',
    command: 'Get-ADReplicationFailure -Target "DC01.contoso.com"',
    status: 'running',
    startTime: new Date(Date.now() - 45000),
    output: 'Checking replication status...\nNo replication failures detected.'
  },
  {
    id: '2', 
    command: 'Get-CertificationAuthority | Get-CATemplate',
    status: 'success',
    startTime: new Date(Date.now() - 180000),
    endTime: new Date(Date.now() - 120000),
    output: 'Retrieved 12 certificate templates successfully.'
  }
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [lastRefresh, setLastRefresh] = useState(new Date());

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
  };

  const handleCancelTask = (taskId: string) => {
    console.log('Cancel task:', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleRetryTask = (taskId: string) => {
    console.log('Retry task:', taskId);
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: 'queued' as const, error: undefined }
        : t
    ));
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
        <StatusTile
          title="Domain Controller"
          value="Online"
          status="online"
          description="Replication healthy"
          icon={Server}
          actionButton={<Button size="sm" variant="outline">View Details</Button>}
        />
        
        <StatusTile
          title="Certificate Authority"
          value="Active"
          status="online"
          description="CRL valid for 7 days"
          icon={Shield}
          actionButton={<Button size="sm" variant="outline">Manage CA</Button>}
        />
        
        <StatusTile
          title="DNS Service"
          value="Warning"
          status="warning"
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