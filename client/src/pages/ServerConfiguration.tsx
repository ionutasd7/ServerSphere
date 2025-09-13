import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ServerConnectionForm from "@/components/ServerConnectionForm";
import { Server, Plus, Edit, Trash2, TestTube } from "lucide-react";
import { useState } from "react";
import { ServerConnection } from "@/components/ServerConnectionForm";
import { serverApi } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ServerConnection as DBServerConnection } from "@shared/schema";

export default function ServerConfiguration() {
  const [editingConnection, setEditingConnection] = useState<ServerConnection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  // Fetch server connections
  const { data: dbConnections = [], isLoading } = useQuery({
    queryKey: ['/api/servers'],
    queryFn: () => serverApi.getAll(),
  });

  // Convert DB connections to form format
  const connections = dbConnections.map((conn: DBServerConnection) => ({
    id: conn.id,
    name: conn.name,
    hostname: conn.hostname,
    port: conn.port,
    protocol: conn.protocol as 'winrm' | 'ssh',
    username: conn.username,
    password: '***', // Never show real password
    useHttps: conn.useHttps,
    skipCertValidation: conn.skipCertValidation,
    timeout: conn.timeout,
    roles: conn.roles as string[]
  }));

  // Create connection mutation
  const createMutation = useMutation({
    mutationFn: serverApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      setShowForm(false);
      setEditingConnection(null);
      toast({
        title: "Success",
        description: "Server connection created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create server connection.",
        variant: "destructive",
      });
    },
  });

  // Delete connection mutation
  const deleteMutation = useMutation({
    mutationFn: serverApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      toast({
        title: "Success",
        description: "Server connection deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete server connection.",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: serverApi.test,
    onSuccess: (data, serverId) => {
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.success 
          ? "Server is reachable and authentication succeeded."
          : "Unable to connect to server or authentication failed.",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test server connection.",
        variant: "destructive",
      });
    },
  });

  const handleSaveConnection = (connection: ServerConnection) => {
    // Only create new connections for now - editing will be added later
    if (!editingConnection) {
      createMutation.mutate(connection);
    } else {
      // TODO: Implement update functionality
      toast({
        title: "Not Implemented",
        description: "Server connection editing is not yet implemented.",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async (connection: ServerConnection & { id: string }): Promise<boolean> => {
    try {
      const result = await testMutation.mutateAsync(connection.id);
      return result.success;
    } catch (error) {
      return false;
    }
  };

  const handleEditConnection = (connection: ServerConnection & { id: string }) => {
    setEditingConnection(connection);
    setShowForm(true);
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (window.confirm('Are you sure you want to delete this server connection? This action cannot be undone.')) {
      deleteMutation.mutate(connectionId);
    }
  };

  const getRoleBadges = (roles: string[]) => {
    const roleMap = {
      dc: { label: 'DC', color: 'default' as const },
      ca: { label: 'CA', color: 'secondary' as const },
      dns: { label: 'DNS', color: 'outline' as const }
    };

    return roles.map(role => {
      const config = roleMap[role as keyof typeof roleMap];
      return (
        <Badge key={role} variant={config.color} className="text-xs">
          {config.label}
        </Badge>
      );
    });
  };

  if (showForm) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => { setShowForm(false); setEditingConnection(null); }}
              data-testid="button-back-to-list"
            >
              ← Back to Server List
            </Button>
          </div>
          <ServerConnectionForm
            connection={editingConnection || undefined}
            onSave={handleSaveConnection}
            onTest={handleTestConnection}
            onCancel={() => { setShowForm(false); setEditingConnection(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="server-configuration">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Server Configuration</h1>
          <p className="text-muted-foreground">
            Manage Windows Server connections and authentication
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-server">
          <Plus className="h-4 w-4 mr-2" />
          Add Server
        </Button>
      </div>

      <div className="grid gap-4">
        {connections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No servers configured</h3>
              <p className="text-muted-foreground mb-4">
                Add your first Windows Server to start managing Active Directory, ADCS, and DNS services.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Server Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          connections.map((connection) => (
            <Card key={connection.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{connection.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{connection.hostname}:{connection.port}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-muted-foreground">Connected</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Protocol:</span>
                      <Badge variant="outline" className="text-xs">
                        {connection.protocol.toUpperCase()}
                      </Badge>
                      {connection.useHttps && (
                        <Badge variant="outline" className="text-xs">
                          HTTPS
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Roles:</span>
                      <div className="flex gap-1">
                        {getRoleBadges(connection.roles)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">User:</span>
                      <span className="text-sm font-mono">{connection.username}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTestConnection(connection)}
                      data-testid={`button-test-${connection.id}`}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditConnection(connection)}
                      data-testid={`button-edit-${connection.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteConnection(connection.id)}
                      data-testid={`button-delete-${connection.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}