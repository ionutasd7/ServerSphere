import ADUserTable from "@/components/ADUserTable";
import { ADUser } from "@/components/ADUserTable";
import { adApi, serverApi } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Server } from "lucide-react";
import type { ADUser as DBADUser } from "@shared/schema";

export default function ADUsers() {
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const { toast } = useToast();

  // Fetch server connections to get the first available server
  const { data: servers = [] } = useQuery({
    queryKey: ['/api/servers'],
    queryFn: () => serverApi.getAll(),
  });

  // Set the first server as default if available
  useEffect(() => {
    if (servers.length > 0 && !selectedServerId) {
      setSelectedServerId(servers[0].id);
    }
  }, [servers, selectedServerId]);

  // Fetch AD users for the selected server
  const { data: dbUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/servers', selectedServerId, 'ad', 'users'],
    queryFn: () => adApi.getUsers(selectedServerId),
    enabled: !!selectedServerId,
  });

  // Convert DB users to component format
  const users: ADUser[] = dbUsers.map((user: DBADUser) => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    email: user.email || '',
    enabled: user.enabled,
    locked: user.locked,
    lastLogon: user.lastLogon ? new Date(user.lastLogon) : undefined,
    passwordExpiry: user.passwordExpiry ? new Date(user.passwordExpiry) : undefined,
    ou: user.ou || '',
    groups: user.groups || []
  }));

  // Sync AD users mutation
  const syncMutation = useMutation({
    mutationFn: () => adApi.syncUsers(selectedServerId),
    onSuccess: (data) => {
      toast({
        title: "Sync Started",
        description: `AD user sync initiated. Task ID: ${data.taskId}`,
      });
      // Refresh users after a delay to allow sync to complete
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/servers', selectedServerId, 'ad', 'users'] });
      }, 5000);
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to start AD user sync.",
        variant: "destructive",
      });
    },
  });

  const handleUserAction = (action: string, user: ADUser) => {
    console.log(`Action: ${action} on user:`, user);
    // TODO: Implement user actions (enable/disable, reset password, etc.)
    toast({
      title: "Not Implemented",
      description: `User action "${action}" is not yet implemented.`,
      variant: "destructive",
    });
  };

  const handleCreateUser = () => {
    console.log('Create new user');
    // TODO: Implement user creation
    toast({
      title: "Not Implemented",
      description: "User creation is not yet implemented.",
      variant: "destructive",
    });
  };

  const handleSyncUsers = () => {
    if (!selectedServerId) {
      toast({
        title: "No Server Selected",
        description: "Please configure a server connection first.",
        variant: "destructive",
      });
      return;
    }
    syncMutation.mutate();
  };

  return (
    <div className="p-6" data-testid="ad-users-page">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Active Directory Users</h1>
            <p className="text-muted-foreground">
              Manage user accounts, permissions, and group memberships
            </p>
          </div>
          <div className="flex items-center gap-2">
            {servers.length > 1 && (
              <Select value={selectedServerId} onValueChange={setSelectedServerId}>
                <SelectTrigger className="w-64" data-testid="select-server">
                  <Server className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select a server" />
                </SelectTrigger>
                <SelectContent>
                  {servers.map(server => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              variant="outline" 
              onClick={handleSyncUsers}
              disabled={syncMutation.isPending || !selectedServerId}
              data-testid="button-sync-ad-users"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync Users'}
            </Button>
          </div>
        </div>
        {servers.length === 0 && (
          <div className="mt-4 p-4 border rounded-md bg-amber-500/10 border-amber-500/20">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              No server connections configured. Please add a Windows Server connection to manage AD users.
            </p>
          </div>
        )}
      </div>
      
      <ADUserTable
        users={users}
        onUserAction={handleUserAction}
        onCreateUser={handleCreateUser}
        isLoading={isLoading}
      />
    </div>
  );
}