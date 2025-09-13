import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusTileProps {
  title: string;
  value: string | number;
  status: "online" | "warning" | "error" | "loading";
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionButton?: React.ReactNode;
}

const statusColors = {
  online: "bg-green-500/10 text-green-700 dark:text-green-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400", 
  error: "bg-red-500/10 text-red-700 dark:text-red-400",
  loading: "bg-blue-500/10 text-blue-700 dark:text-blue-400"
};

const statusBadgeColors = {
  online: "bg-green-500",
  warning: "bg-amber-500",
  error: "bg-red-500", 
  loading: "bg-blue-500"
};

export default function StatusTile({ 
  title, 
  value, 
  status, 
  description, 
  icon: Icon,
  actionButton 
}: StatusTileProps) {
  return (
    <Card className="hover-elevate" data-testid={`tile-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            Icon && <Icon className="h-4 w-4 text-muted-foreground" />
          )}
          <Badge 
            variant="secondary" 
            className={cn("h-2 w-2 p-0 border-0", statusBadgeColors[status])}
            data-testid={`status-${status}`}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {actionButton && (
          <div className="mt-3">
            {actionButton}
          </div>
        )}
      </CardContent>
    </Card>
  );
}