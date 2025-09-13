import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Server, 
  Shield, 
  Database, 
  Eye, 
  EyeOff, 
  TestTube,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useState } from "react";

export interface ServerConnection {
  id?: string;
  name: string;
  hostname: string;
  port: number;
  protocol: "winrm" | "ssh";
  username: string;
  password: string;
  useHttps: boolean;
  skipCertValidation: boolean;
  timeout: number;
  roles: ("dc" | "ca" | "dns")[];
}

export interface ServerConnectionFormProps {
  connection?: ServerConnection;
  onSave?: (connection: ServerConnection) => void;
  onTest?: (connection: ServerConnection) => Promise<boolean>;
  onCancel?: () => void;
}

export default function ServerConnectionForm({ 
  connection, 
  onSave, 
  onTest, 
  onCancel 
}: ServerConnectionFormProps) {
  const [formData, setFormData] = useState<ServerConnection>({
    name: connection?.name || "",
    hostname: connection?.hostname || "",
    port: connection?.port || 5985,
    protocol: connection?.protocol || "winrm",
    username: connection?.username || "",
    password: connection?.password || "",
    useHttps: connection?.useHttps || false,
    skipCertValidation: connection?.skipCertValidation || false,
    timeout: connection?.timeout || 30,
    roles: connection?.roles || [],
    ...connection
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const updateField = (field: keyof ServerConnection, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null); // Reset test result when connection details change
  };

  const toggleRole = (role: "dc" | "ca" | "dns") => {
    const newRoles = formData.roles.includes(role)
      ? formData.roles.filter(r => r !== role)
      : [...formData.roles, role];
    updateField('roles', newRoles);
  };

  const handleTestConnection = async () => {
    if (!onTest) return;
    
    setIsTestingConnection(true);
    try {
      const result = await onTest(formData);
      setTestResult(result);
    } catch (error) {
      setTestResult(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
  };

  const isValid = formData.name && formData.hostname && formData.username && formData.password;

  return (
    <Card className="w-full max-w-2xl" data-testid="server-connection-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          {connection ? 'Edit Server Connection' : 'Add Server Connection'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="DC01 - Primary Domain Controller"
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname/IP</Label>
              <Input
                id="hostname"
                value={formData.hostname}
                onChange={(e) => updateField('hostname', e.target.value)}
                placeholder="dc01.contoso.com"
                data-testid="input-hostname"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select 
                value={formData.protocol} 
                onValueChange={(value) => updateField('protocol', value as "winrm" | "ssh")}
              >
                <SelectTrigger data-testid="select-protocol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="winrm">WinRM</SelectItem>
                  <SelectItem value="ssh">SSH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => updateField('port', parseInt(e.target.value))}
                data-testid="input-port"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={formData.timeout}
                onChange={(e) => updateField('timeout', parseInt(e.target.value))}
                data-testid="input-timeout"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Authentication */}
        <div className="space-y-4">
          <h4 className="font-medium">Authentication</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="contoso\\administrator"
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Connection Options */}
        <div className="space-y-4">
          <h4 className="font-medium">Connection Options</h4>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Use HTTPS</Label>
              <p className="text-sm text-muted-foreground">
                Encrypt the connection using SSL/TLS
              </p>
            </div>
            <Switch
              checked={formData.useHttps}
              onCheckedChange={(checked) => updateField('useHttps', checked)}
              data-testid="switch-https"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Skip Certificate Validation</Label>
              <p className="text-sm text-muted-foreground">
                Ignore SSL certificate errors (not recommended for production)
              </p>
            </div>
            <Switch
              checked={formData.skipCertValidation}
              onCheckedChange={(checked) => updateField('skipCertValidation', checked)}
              data-testid="switch-skip-cert"
            />
          </div>
        </div>

        <Separator />

        {/* Server Roles */}
        <div className="space-y-4">
          <h4 className="font-medium">Server Roles</h4>
          <p className="text-sm text-muted-foreground">
            Select the roles this server provides to enable relevant management features
          </p>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={formData.roles.includes('dc') ? 'default' : 'outline'}
              className="cursor-pointer hover-elevate"
              onClick={() => toggleRole('dc')}
              data-testid="badge-role-dc"
            >
              <Server className="h-3 w-3 mr-1" />
              Domain Controller
            </Badge>
            <Badge
              variant={formData.roles.includes('ca') ? 'default' : 'outline'}
              className="cursor-pointer hover-elevate"
              onClick={() => toggleRole('ca')}
              data-testid="badge-role-ca"
            >
              <Shield className="h-3 w-3 mr-1" />
              Certificate Authority
            </Badge>
            <Badge
              variant={formData.roles.includes('dns') ? 'default' : 'outline'}
              className="cursor-pointer hover-elevate"
              onClick={() => toggleRole('dns')}
              data-testid="badge-role-dns"
            >
              <Database className="h-3 w-3 mr-1" />
              DNS Server
            </Badge>
          </div>
        </div>

        {/* Test Connection */}
        {isValid && (
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Connection</Label>
                <p className="text-sm text-muted-foreground">
                  Verify that the server is reachable with these settings
                </p>
              </div>
              <div className="flex items-center gap-2">
                {testResult !== null && (
                  <div className="flex items-center gap-1">
                    {testResult ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-700 dark:text-green-400">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-400">Failed</span>
                      </>
                    )}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  data-testid="button-test-connection"
                >
                  <TestTube className="h-4 w-4 mr-1" />
                  {isTestingConnection ? 'Testing...' : 'Test'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} data-testid="button-cancel">
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!isValid}
            data-testid="button-save"
          >
            {connection ? 'Update Connection' : 'Add Connection'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}