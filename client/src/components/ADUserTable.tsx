import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Shield, 
  ShieldOff, 
  Unlock, 
  RotateCcw,
  Eye,
  Users
} from "lucide-react";
import { useState } from "react";

export interface ADUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  enabled: boolean;
  locked: boolean;
  lastLogon?: Date;
  passwordExpiry?: Date;
  ou: string;
  groups: string[];
}

export interface ADUserTableProps {
  users: ADUser[];
  onUserAction?: (action: string, user: ADUser) => void;
  onCreateUser?: () => void;
  loading?: boolean;
}

export default function ADUserTable({ 
  users, 
  onUserAction, 
  onCreateUser,
  loading = false 
}: ADUserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(term.toLowerCase()) ||
      user.displayName.toLowerCase().includes(term.toLowerCase()) ||
      user.email?.toLowerCase().includes(term.toLowerCase()) ||
      user.ou.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const getStatusBadge = (user: ADUser) => {
    if (!user.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    if (user.locked) {
      return <Badge variant="destructive">Locked</Badge>;
    }
    return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">Active</Badge>;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const isPasswordExpiring = (user: ADUser) => {
    if (!user.passwordExpiry) return false;
    const daysUntilExpiry = Math.ceil((user.passwordExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  return (
    <Card className="w-full" data-testid="ad-user-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Directory Users
          </CardTitle>
          <Button onClick={onCreateUser} data-testid="button-create-user">
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
              data-testid="input-search-users"
            />
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredUsers.length} users
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Logon</TableHead>
                  <TableHead>Password Expiry</TableHead>
                  <TableHead>OU</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No users found matching your search' : 'No users found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.username}`}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.displayName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email || '-'}</TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.lastLogon)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isPasswordExpiring(user) ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                            {formatDate(user.passwordExpiry)}
                          </span>
                          {isPasswordExpiring(user) && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                              Expiring
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.ou}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-menu-${user.username}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onUserAction?.('view', user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.enabled ? (
                              <DropdownMenuItem onClick={() => onUserAction?.('disable', user)}>
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Disable Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => onUserAction?.('enable', user)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Enable Account
                              </DropdownMenuItem>
                            )}
                            {user.locked && (
                              <DropdownMenuItem onClick={() => onUserAction?.('unlock', user)}>
                                <Unlock className="h-4 w-4 mr-2" />
                                Unlock Account
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onUserAction?.('resetPassword', user)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}