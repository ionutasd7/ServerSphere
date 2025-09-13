import ADUserTable from '../ADUserTable';
import { ADUser } from '../ADUserTable';

//todo: remove mock functionality
const mockUsers: ADUser[] = [
  {
    id: '1',
    username: 'jdoe',
    displayName: 'John Doe',
    email: 'john.doe@contoso.com',
    enabled: true,
    locked: false,
    lastLogon: new Date(Date.now() - 86400000), // 1 day ago
    passwordExpiry: new Date(Date.now() + 86400000 * 15), // 15 days from now
    ou: 'CN=Users,DC=contoso,DC=com',
    groups: ['Domain Users', 'IT Admin']
  },
  {
    id: '2',
    username: 'asmith',
    displayName: 'Alice Smith',
    email: 'alice.smith@contoso.com',
    enabled: true,
    locked: true,
    lastLogon: new Date(Date.now() - 86400000 * 7), // 1 week ago
    passwordExpiry: new Date(Date.now() + 86400000 * 45), // 45 days from now
    ou: 'OU=Finance,DC=contoso,DC=com',
    groups: ['Domain Users', 'Finance']
  },
  {
    id: '3',
    username: 'bwilson',
    displayName: 'Bob Wilson',
    email: 'bob.wilson@contoso.com',
    enabled: false,
    locked: false,
    lastLogon: new Date(Date.now() - 86400000 * 90), // 90 days ago
    passwordExpiry: new Date(Date.now() - 86400000 * 30), // expired 30 days ago
    ou: 'OU=Former Employees,DC=contoso,DC=com',
    groups: ['Domain Users']
  },
  {
    id: '4',
    username: 'mjohnson',
    displayName: 'Mary Johnson',
    email: 'mary.johnson@contoso.com',
    enabled: true,
    locked: false,
    lastLogon: new Date(Date.now() - 86400000 * 2), // 2 days ago
    passwordExpiry: new Date(Date.now() + 86400000 * 7), // 7 days from now (expiring soon)
    ou: 'OU=Sales,DC=contoso,DC=com',
    groups: ['Domain Users', 'Sales Team', 'CRM Users']
  }
];

export default function ADUserTableExample() {
  const handleUserAction = (action: string, user: ADUser) => {
    console.log(`Action: ${action} on user:`, user);
  };

  const handleCreateUser = () => {
    console.log('Create new user');
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <ADUserTable
        users={mockUsers}
        onUserAction={handleUserAction}
        onCreateUser={handleCreateUser}
        loading={false}
      />
    </div>
  );
}