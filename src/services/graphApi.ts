import { Application, ServicePrincipal, User, Permission, ApiResource, Group } from '../types/entra';
import { realGraphApiService } from './realGraphApi';
import { authService } from './authService';

// Mock data for demonstration - in production, this would use Microsoft Graph API
const mockApplications: Application[] = [
  {
    id: 'app-1',
    appId: '12345678-1234-1234-1234-123456789012',
    displayName: 'Sales Dashboard',
    description: 'Customer relationship management application',
    createdDateTime: '2024-01-15T10:30:00Z',
    signInAudience: 'AzureADMyOrg',
    tags: ['WindowsAzureActiveDirectoryIntegratedApp'],
    isEnabled: true,
    requiredResourceAccess: [],
    owners: []
  },
  {
    id: 'app-2',
    appId: '87654321-4321-4321-4321-210987654321',
    displayName: 'HR Portal',
    description: 'Human resources management system',
    createdDateTime: '2024-02-20T14:15:00Z',
    signInAudience: 'AzureADMyOrg',
    tags: ['WindowsAzureActiveDirectoryIntegratedApp'],
    isEnabled: true,
    requiredResourceAccess: [],
    owners: []
  }
];

const mockServicePrincipals: ServicePrincipal[] = [
  {
    id: 'sp-1',
    appId: '12345678-1234-1234-1234-123456789012',
    displayName: 'Sales Dashboard',
    description: 'Service principal for Sales Dashboard',
    createdDateTime: '2024-01-15T10:30:00Z',
    accountEnabled: true,
    servicePrincipalType: 'Application',
    tags: [],
    appRoles: [],
    oauth2PermissionScopes: [],
    owners: []
  }
];

const mockApiResources: ApiResource[] = [
  {
    id: 'graph-api',
    displayName: 'Microsoft Graph',
    description: 'Microsoft Graph API',
    appId: '00000003-0000-0000-c000-000000000000',
    appRoles: [
      {
        id: 'role-1',
        allowedMemberTypes: ['Application'],
        description: 'Read all users',
        displayName: 'User.Read.All',
        isEnabled: true,
        value: 'User.Read.All'
      },
      {
        id: 'role-2',
        allowedMemberTypes: ['Application'],
        description: 'Read and write all users',
        displayName: 'User.ReadWrite.All',
        isEnabled: true,
        value: 'User.ReadWrite.All'
      }
    ],
    oauth2PermissionScopes: [
      {
        id: 'scope-1',
        adminConsentDescription: 'Read user profile',
        adminConsentDisplayName: 'Read user profile',
        isEnabled: true,
        type: 'User',
        userConsentDescription: 'Read your profile',
        userConsentDisplayName: 'Read your profile',
        value: 'User.Read'
      }
    ]
  }
];

export const graphApiService = {
  async getApplications(): Promise<Application[]> {
    if (authService.isLoggedIn()) {
      try {
        return await realGraphApiService.getApplications();
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        return mockApplications;
      }
    }
    return mockApplications;
  },

  async getServicePrincipals(): Promise<ServicePrincipal[]> {
    if (authService.isLoggedIn()) {
      try {
        return await realGraphApiService.getServicePrincipals();
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        return mockServicePrincipals;
      }
    }
    return mockServicePrincipals;
  },

  async getApplicationAssignedPermissions(appId: string): Promise<Permission[]> {
    if (authService.isLoggedIn()) {
      try {
        return await realGraphApiService.getApplicationAssignedPermissions(appId);
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        // Return mock permissions for demonstration
        return [
          {
            id: '951183d1-1a61-466f-a6d1-1fde911bfd95',
            displayName: 'User.Read.All',
            description: 'Read all users',
            type: 'Application',
            api: 'Microsoft Graph',
            apiId: '00000003-0000-0000-c000-000000000000',
            value: 'User.Read.All',
            isEnabled: true
          }
        ];
      }
    }
    return [];
  },

  async getServicePrincipalAssignedPermissions(spId: string): Promise<Permission[]> {
    if (authService.isLoggedIn()) {
      try {
        return await realGraphApiService.getServicePrincipalAssignedPermissions(spId);
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        return [
          {
            id: '951183d1-1a61-466f-a6d1-1fde911bfd95',
            displayName: 'User.Read.All',
            description: 'Read all users',
            type: 'Application',
            api: 'Microsoft Graph',
            apiId: '00000003-0000-0000-c000-000000000000',
            value: 'User.Read.All',
            isEnabled: true
          }
        ];
      }
    }
    return [];
  },

  async getAssignedUsers(targetId: string, isServicePrincipal: boolean): Promise<User[]> {
    if (authService.isLoggedIn()) {
      try {
        return await realGraphApiService.getAssignedUsers(targetId, isServicePrincipal);
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        return [
          {
            id: 'user-1',
            displayName: 'John Doe',
            userPrincipalName: 'john.doe@company.com',
            mail: 'john.doe@company.com',
            jobTitle: 'Sales Manager',
            department: 'Sales'
          }
        ];
      }
    }
    return [];
  },
  async getApiResources(): Promise<ApiResource[]> {
    if (authService.isLoggedIn()) {
      try {
        return await realGraphApiService.getApiResources();
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        return mockApiResources;
      }
    }
    return mockApiResources;
  },

  async updateApplicationStatus(appId: string, isEnabled: boolean): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.updateApplicationStatus(appId, isEnabled);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    // Mock behavior
    await new Promise(resolve => setTimeout(resolve, 300));
    const app = mockApplications.find(a => a.id === appId);
    if (app) {
      app.isEnabled = isEnabled;
    }
  },

  async updateServicePrincipalStatus(spId: string, accountEnabled: boolean): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.updateServicePrincipalStatus(spId, accountEnabled);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    // Mock behavior
    await new Promise(resolve => setTimeout(resolve, 300));
    const sp = mockServicePrincipals.find(s => s.id === spId);
    if (sp) {
      sp.accountEnabled = accountEnabled;
    }
  },

  async addPermission(appId: string, permission: Permission): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.addPermission(appId, permission);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Adding permission:', permission, 'to app:', appId);
  },

  async addServicePrincipalPermission(spId: string, permission: Permission): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.addServicePrincipalPermission(spId, permission);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Adding permission:', permission, 'to service principal:', spId);
  },
  
  async revokeAdminConsentForPermission(appId: string, permissionId: string): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.revokeAdminConsentForPermission(appId, permissionId);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Removing permission:', permissionId, 'from app:', appId);
  },

  async removeServicePrincipalPermission(spId: string, permissionId: string): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.removeServicePrincipalPermission(spId, permissionId);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Removing permission:', permissionId, 'from service principal:', spId);
  },
  async grantDelegatedPermission(appId: string, userId: string, permissionId: string): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.grantDelegatedPermission(appId, userId, permissionId);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Granting delegated permission:', permissionId, 'to user:', userId, 'for app:', appId);
  },

  async revokeDelegatedPermission(appId: string, userId: string, permissionId: string): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.revokeDelegatedPermission(appId, userId, permissionId);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Revoking delegated permission:', permissionId, 'from user:', userId, 'for app:', appId);
  },

  async assignUserToApplication(targetId: string, userId: string, isServicePrincipal: boolean): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.assignUserToApplication(targetId, userId, isServicePrincipal);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Assigning user:', userId, 'to', isServicePrincipal ? 'service principal' : 'application', ':', targetId);
  },

  async removeUserFromApplication(targetId: string, userId: string, isServicePrincipal: boolean): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.removeUserFromApplication(targetId, userId, isServicePrincipal);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Removing user:', userId, 'from', isServicePrincipal ? 'service principal' : 'application', ':', targetId);
  },
  async searchUsers(query: string): Promise<User[]> {
    if (authService.isLoggedIn()) {
      try {
        return await realGraphApiService.searchUsers(query);
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
      }
    }
    
    // Mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: 'user-1',
        displayName: 'John Doe',
        userPrincipalName: 'john.doe@company.com',
        mail: 'john.doe@company.com',
        jobTitle: 'Sales Manager',
        department: 'Sales'
      },
      {
        id: 'user-2',
        displayName: 'Jane Smith',
        userPrincipalName: 'jane.smith@company.com',
        mail: 'jane.smith@company.com',
        jobTitle: 'HR Specialist',
        department: 'Human Resources'
      }
    ].filter(user => 
      user.displayName.toLowerCase().includes(query.toLowerCase()) ||
      user.userPrincipalName.toLowerCase().includes(query.toLowerCase())
    );
  },

  async getAssignedGroups(targetId: string, isServicePrincipal: boolean): Promise<Group[]> {
    if (authService.isLoggedIn()) {
      try {
        return await realGraphApiService.getAssignedGroups(targetId, isServicePrincipal);
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
        return [
          {
            id: 'group-1',
            displayName: 'Sales Team',
            description: 'Sales department group',
            groupTypes: [],
            securityEnabled: true
          }
        ];
      }
    }
    return [];
  },

  async assignGroupToApplication(targetId: string, groupId: string, isServicePrincipal: boolean): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.assignGroupToApplication(targetId, groupId, isServicePrincipal);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Assigning group:', groupId, 'to', isServicePrincipal ? 'service principal' : 'application', ':', targetId);
  },

  async removeGroupFromApplication(targetId: string, groupId: string, isServicePrincipal: boolean): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.removeGroupFromApplication(targetId, groupId, isServicePrincipal);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Removing group:', groupId, 'from', isServicePrincipal ? 'service principal' : 'application', ':', targetId);
  },

  async searchGroups(query: string): Promise<Group[]> {
    if (authService.isLoggedIn()) {
      try {
        return await realGraphApiService.searchGroups(query);
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
      }
    }
    
    // Mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: 'group-1',
        displayName: 'Sales Team',
        description: 'Sales department group',
        groupTypes: [],
        securityEnabled: true
      },
      {
        id: 'group-2',
        displayName: 'HR Department',
        description: 'Human resources department',
        groupTypes: [],
        securityEnabled: true
      }
    ].filter(group => 
      group.displayName.toLowerCase().includes(query.toLowerCase()) ||
      (group.description || '').toLowerCase().includes(query.toLowerCase())
    );
  },

  async getUsersWithPermission(appId: string, permissionId: string): Promise<User[]> {
    if (authService.isLoggedIn()) {
      try {
        // This method might not exist in realGraphApiService yet
        return [];
      } catch (error) {
        console.warn('Using mock data due to API error:', error);
      }
    }
    
    // Mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: 'user-1',
        displayName: 'John Doe',
        userPrincipalName: 'john.doe@company.com',
        mail: 'john.doe@company.com',
        jobTitle: 'Sales Manager',
        department: 'Sales'
      }
    ];
  },

  async removePermission(appId: string, permissionId: string): Promise<void> {
    if (authService.isLoggedIn()) {
      try {
        await realGraphApiService.removePermission(appId, permissionId);
        return;
      } catch (error) {
        console.warn('Using mock behavior due to API error:', error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Removing permission:', permissionId, 'from app:', appId);
  }
};