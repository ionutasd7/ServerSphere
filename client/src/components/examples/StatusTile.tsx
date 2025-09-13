import StatusTile from '../StatusTile';
import { Server, Database, Shield, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function StatusTileExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
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
      
      <StatusTile
        title="Stale Users"
        value="Loading..."
        status="loading"
        description="Checking last logon dates"
        icon={Server}
      />
    </div>
  );
}