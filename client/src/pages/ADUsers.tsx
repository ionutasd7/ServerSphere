import ADUserTable from "@/components/ADUserTable";
import { ADUser } from "@/components/ADUserTable";

//todo: remove mock functionality
const mockUsers: ADUser[] = [
  {
    id: '1',
    username: 'jdoe',
    displayName: 'John Doe',
    email: 'john.doe@contoso.com',
    enabled: true,
    locked: false,
    lastLogon: new Date(Date.now() - 86400000),
    passwordExpiry: new Date(Date.now() + 86400000 * 15),
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
    lastLogon: new Date(Date.now() - 86400000 * 7),
    passwordExpiry: new Date(Date.now() + 86400000 * 45),
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
    lastLogon: new Date(Date.now() - 86400000 * 90),
    passwordExpiry: new Date(Date.now() - 86400000 * 30),
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
    lastLogon: new Date(Date.now() - 86400000 * 2),
    passwordExpiry: new Date(Date.now() + 86400000 * 7),
    ou: 'OU=Sales,DC=contoso,DC=com',
    groups: ['Domain Users', 'Sales Team', 'CRM Users']
  }
];

export default function ADUsers() {
  const handleUserAction = (action: string, user: ADUser) => {
    console.log(`Action: ${action} on user:`, user);
  };

  const handleCreateUser = () => {
    console.log('Create new user');
  };

  return (
    <div className="p-6" data-testid="ad-users-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Active Directory Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts, permissions, and group memberships
        </p>
      </div>
      
      <ADUserTable
        users={mockUsers}
        onUserAction={handleUserAction}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
}