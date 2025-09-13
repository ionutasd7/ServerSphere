import TaskPanel from '../TaskPanel';
import { Task } from '../TaskPanel';

//todo: remove mock functionality
const mockTasks: Task[] = [
  {
    id: '1',
    command: 'Get-ADUser -Filter * -Properties LastLogonDate | Where-Object {$_.LastLogonDate -lt (Get-Date).AddDays(-90)}',
    status: 'running',
    startTime: new Date(Date.now() - 30000),
    output: 'Searching for stale user accounts...\nFound 5 users with no recent logon activity'
  },
  {
    id: '2', 
    command: 'Get-CertificationAuthority | Get-CertificationTemplate',
    status: 'success',
    startTime: new Date(Date.now() - 120000),
    endTime: new Date(Date.now() - 60000),
    output: 'Template Name: WebServer\nSubject Name: CN=%SubjectName%\nKey Usage: Digital Signature, Key Encipherment\n\nTemplate Name: DomainController\nSubject Name: CN=%SubjectName%\nKey Usage: Digital Signature, Key Encipherment'
  },
  {
    id: '3',
    command: 'Add-DnsServerResourceRecord -ZoneName "contoso.com" -A -Name "server01" -IPv4Address "192.168.1.100"',
    status: 'failed',
    startTime: new Date(Date.now() - 180000),
    endTime: new Date(Date.now() - 150000),
    error: 'Access denied. You must have administrator privileges to perform this operation.'
  },
  {
    id: '4',
    command: 'Get-ADReplicationFailure -Target "DC01.contoso.com"',
    status: 'queued'
  }
];

export default function TaskPanelExample() {
  const handleCancelTask = (taskId: string) => {
    console.log('Cancel task:', taskId);
  };

  const handleRetryTask = (taskId: string) => {
    console.log('Retry task:', taskId);
  };

  const handleClearCompleted = () => {
    console.log('Clear completed tasks');
  };

  return (
    <div className="h-96 w-96 p-4">
      <TaskPanel
        tasks={mockTasks}
        onCancelTask={handleCancelTask}
        onRetryTask={handleRetryTask}
        onClearCompleted={handleClearCompleted}
      />
    </div>
  );
}