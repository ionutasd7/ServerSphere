import type { 
  ServerConnection, 
  InsertServerConnection,
  PowerShellTask,
  InsertPowerShellTask,
  TaskLog,
  ADUser,
  Certificate,
  DnsRecord
} from '@shared/schema';

const API_BASE = '/api';

// Generic API request function
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Server Connection API
export const serverApi = {
  getAll: (): Promise<ServerConnection[]> => 
    apiRequest('/servers'),

  getById: (id: string): Promise<ServerConnection> =>
    apiRequest(`/servers/${id}`),

  create: (data: InsertServerConnection & { password: string }): Promise<ServerConnection> =>
    apiRequest('/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ success: boolean }> =>
    apiRequest(`/servers/${id}`, {
      method: 'DELETE',
    }),

  test: (id: string): Promise<{ success: boolean }> =>
    apiRequest(`/servers/${id}/test`, {
      method: 'POST',
    }),
};

// PowerShell Task API
export const taskApi = {
  getAll: (serverId?: string): Promise<PowerShellTask[]> =>
    apiRequest(`/tasks${serverId ? `?serverId=${serverId}` : ''}`),

  getById: (id: string): Promise<PowerShellTask> =>
    apiRequest(`/tasks/${id}`),

  create: (data: InsertPowerShellTask): Promise<PowerShellTask> =>
    apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLogs: (id: string): Promise<TaskLog[]> =>
    apiRequest(`/tasks/${id}/logs`),

  cancel: (id: string): Promise<{ success: boolean }> =>
    apiRequest(`/tasks/${id}/cancel`, {
      method: 'POST',
    }),

  retry: (id: string): Promise<{ taskId: string }> =>
    apiRequest(`/tasks/${id}/retry`, {
      method: 'POST',
    }),
};

// Active Directory API
export const adApi = {
  getUsers: (serverId: string): Promise<ADUser[]> =>
    apiRequest(`/servers/${serverId}/ad/users`),

  syncUsers: (serverId: string): Promise<{ taskId: string }> =>
    apiRequest(`/servers/${serverId}/ad/users/sync`, {
      method: 'POST',
    }),
};

// Certificate API
export const certificateApi = {
  getAll: (serverId: string): Promise<Certificate[]> =>
    apiRequest(`/servers/${serverId}/certificates`),
};

// DNS API
export const dnsApi = {
  getRecords: (serverId: string, zone?: string): Promise<DnsRecord[]> =>
    apiRequest(`/servers/${serverId}/dns/records${zone ? `?zone=${zone}` : ''}`),
};