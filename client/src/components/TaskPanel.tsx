import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Terminal,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface Task {
  id: string;
  command: string;
  status: "queued" | "running" | "success" | "failed";
  startTime?: Date;
  endTime?: Date;
  output?: string;
  error?: string;
}

export interface TaskPanelProps {
  tasks: Task[];
  onCancelTask?: (taskId: string) => void;
  onRetryTask?: (taskId: string) => void;
  onClearCompleted?: () => void;
}

const statusIcons = {
  queued: Clock,
  running: Play,
  success: CheckCircle,
  failed: XCircle
};

const statusColors = {
  queued: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  running: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  success: "bg-green-500/10 text-green-700 dark:text-green-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400"
};

export default function TaskPanel({ 
  tasks, 
  onCancelTask, 
  onRetryTask, 
  onClearCompleted 
}: TaskPanelProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const queuedTasks = tasks.filter(t => t.status === 'queued').length;

  return (
    <Card className="h-full flex flex-col" data-testid="task-panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">
          PowerShell Tasks
        </CardTitle>
        <div className="flex items-center gap-2">
          {runningTasks > 0 && (
            <Badge variant="default" className="text-xs">
              {runningTasks} running
            </Badge>
          )}
          {queuedTasks > 0 && (
            <Badge variant="secondary" className="text-xs">
              {queuedTasks} queued
            </Badge>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onClearCompleted}
            disabled={!tasks.some(t => t.status === 'success' || t.status === 'failed')}
            data-testid="button-clear-completed"
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tasks running</p>
              </div>
            ) : (
              tasks.map((task, index) => {
                const StatusIcon = statusIcons[task.status];
                const isExpanded = expandedTasks.has(task.id);
                
                return (
                  <div key={task.id}>
                    <div className={cn(
                      "p-3 rounded-md border",
                      statusColors[task.status]
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium capitalize">
                              {task.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {task.startTime && new Date(task.startTime).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs font-mono break-all text-foreground/90 mb-2">
                            {task.command}
                          </p>
                          {(task.output || task.error) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleExpanded(task.id)}
                              data-testid={`button-expand-${task.id}`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Hide Output
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Show Output
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          {task.status === 'running' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => onCancelTask?.(task.id)}
                              data-testid={`button-cancel-${task.id}`}
                            >
                              <Square className="h-3 w-3" />
                            </Button>
                          )}
                          {task.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => onRetryTask?.(task.id)}
                              data-testid={`button-retry-${task.id}`}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && (task.output || task.error) && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          {task.output && (
                            <pre className="text-xs font-mono bg-background/50 p-2 rounded whitespace-pre-wrap overflow-x-auto">
                              {task.output}
                            </pre>
                          )}
                          {task.error && (
                            <pre className="text-xs font-mono bg-destructive/10 text-destructive p-2 rounded whitespace-pre-wrap overflow-x-auto mt-1">
                              {task.error}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                    {index < tasks.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}