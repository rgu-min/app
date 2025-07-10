import { Client } from "@microsoft/microsoft-graph-client";
import { authService } from "./authService";
import { Application, ServicePrincipal, User, Group, Permission, ApiResource } from "../types/entra";

class RealGraphApiService {
  private graphClient: Client;

  constructor() {
    this.graphClient = Client.init({
      authProvider: async (done) => {
        try {
          const token = await authService.getAccessToken();
          done(null, token);
        } catch (error) {
          done(error, null);
        }
      },
    });
  }

  async getApplications(): Promise<Application[]> {
    try {
      const response = await this.graphClient
        .api('/applications')
        .select('id,appId,displayName,description,createdDateTime,signInAudience,tags,requiredResourceAccess')
        .top(999)
        .get();

      return response.value.map((app: any) => ({
        id: app.id,
        appId: app.appId,
        displayName: app.displayName,
        description: app.description || '',
        createdDateTime: app.createdDateTime,
        signInAudience: app.signInAudience,
        tags: app.tags || [],
        isEnabled: true, // Applications don't have a direct enabled/disabled property
        requiredResourceAccess: app.requiredResourceAccess || [],
        owners: []
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  }

  async getServicePrincipals(): Promise<ServicePrincipal[]> {
    try {
      const response = await this.graphClient
        .api('/servicePrincipals')
        .select('id,appId,displayName,description,createdDateTime,accountEnabled,servicePrincipalType,tags,appRoles,oauth2PermissionScopes')
        .top(999)
        .get();

      return response.value.map((sp: any) => ({
        id: sp.id,
        appId: sp.appId,
        displayName: sp.displayName,
        description: sp.description || '',
        createdDateTime: sp.createdDateTime,
        accountEnabled: sp.accountEnabled,
        servicePrincipalType: sp.servicePrincipalType,
        tags: sp.tags || [],
        appRoles: sp.appRoles || [],
        oauth2PermissionScopes: sp.oauth2PermissionScopes || [],
        owners: []
      }));
    } catch (error) {
      console.error('Error fetching service principals:', error);
      throw error;
    }
  }

  async getApplicationAssignedPermissions(appId: string): Promise<Permission[]> {
    try {
      let app;
      try {
        // Get the application's required resource access
        app = await this.graphClient
          .api(`/applications/${appId}`)
          .select('requiredResourceAccess')
          .get();
      } catch (appError: any) {
        // If the application doesn't exist or is inaccessible, return empty permissions
        if (appError.code === 'Request_ResourceNotFound' || appError.status === 404) {
          console.warn(`Application ${appId} not found or inaccessible`);
          return [];
        }
        throw appError;
      }

      const permissions: Permission[] = [];
      
      if (!app.requiredResourceAccess || app.requiredResourceAccess.length === 0) {
        return permissions;
      }

      // For each required resource, get the details
      for (const resourceAccess of app.requiredResourceAccess) {
        try {
          // Get the service principal for this resource
          const spResponse = await this.graphClient
            .api('/servicePrincipals')
            .filter(`appId eq '${resourceAccess.resourceAppId}'`)
            .select('id,displayName,appRoles,oauth2PermissionScopes')
            .get();

          if (spResponse.value.length > 0) {
            const servicePrincipal = spResponse.value[0];
            
            // Process each permission in the resource access
            for (const access of resourceAccess.resourceAccess) {
              let permission: Permission | null = null;
              
              if (access.type === 'Role') {
                // Application permission (App Role)
                const appRole = servicePrincipal.appRoles?.find((role: any) => role.id === access.id);
                if (appRole) {
                  permission = {
                    id: appRole.id,
                    displayName: appRole.displayName,
                    description: appRole.description,
                    type: 'Application',
                    api: servicePrincipal.displayName,
                    apiId: resourceAccess.resourceAppId,
                    value: appRole.value,
                    isEnabled: appRole.isEnabled
                  };
                }
              } else if (access.type === 'Scope') {
                // Delegated permission (OAuth2 Permission Scope)
                const scope = servicePrincipal.oauth2PermissionScopes?.find((scope: any) => scope.id === access.id);
                if (scope) {
                  permission = {
                    id: scope.id,
                    displayName: scope.adminConsentDisplayName || scope.value,
                    description: scope.adminConsentDescription || scope.userConsentDescription,
                    type: 'Delegated',
                    api: servicePrincipal.displayName,
                    apiId: resourceAccess.resourceAppId,
                    value: scope.value,
                    isEnabled: scope.isEnabled,
                    consentType: scope.type === 'Admin' ? 'Admin' : 'User'
                  };
                }
              }
              
              if (permission) {
                permissions.push(permission);
              }
            }
          } else {
            console.warn(`Service principal not found for resource ${resourceAccess.resourceAppId}`);
          }
        } catch (resourceError) {
          // Handle cases where the resource service principal doesn't exist or is inaccessible
          const error = resourceError as any;
          if (error.code === 'Request_ResourceNotFound' || error.status === 404) {
            console.warn(`Resource ${resourceAccess.resourceAppId} not found or inaccessible`);
          } else {
            console.warn(`Could not fetch details for resource ${resourceAccess.resourceAppId}:`, resourceError);
          }
        }
      }

      return permissions;
    } catch (error) {
      console.error('Error fetching application assigned permissions:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  async getServicePrincipalAssignedPermissions(spId: string): Promise<Permission[]> {
    try {
      // Get app role assignments for this service principal
      const appRoleAssignments = await this.graphClient
        .api(`/servicePrincipals/${spId}/appRoleAssignments`)
        .get();

      // Get delegated permission grants for this service principal
      const oauth2PermissionGrants = await this.graphClient
        .api('/oauth2PermissionGrants')
        .filter(`clientId eq '${spId}'`)
        .get();

      const permissions: Permission[] = [];

      // Process app role assignments (Application permissions)
      for (const assignment of appRoleAssignments.value) {
        try {
          const resourceSp = await this.graphClient
            .api(`/servicePrincipals/${assignment.resourceId}`)
            .select('displayName,appRoles,appId')
            .get();

          const appRole = resourceSp.appRoles?.find((role: any) => role.id === assignment.appRoleId);
          if (appRole) {
            permissions.push({
              id: appRole.id,
              displayName: appRole.displayName,
              description: appRole.description,
              type: 'Application',
              api: resourceSp.displayName,
              apiId: resourceSp.appId,
              value: appRole.value,
              isEnabled: appRole.isEnabled
            });
          }
        } catch (error) {
          console.warn(`Could not fetch details for app role assignment ${assignment.id}:`, error);
        }
      }

      // Process OAuth2 permission grants (Delegated permissions)
      for (const grant of oauth2PermissionGrants.value) {
        try {
          const resourceSp = await this.graphClient
            .api(`/servicePrincipals/${grant.resourceId}`)
            .select('displayName,oauth2PermissionScopes,appId')
            .get();

          const scopes = grant.scope ? grant.scope.split(' ') : [];
          for (const scopeValue of scopes) {
            const scope = resourceSp.oauth2PermissionScopes?.find((s: any) => s.value === scopeValue);
            if (scope) {
              permissions.push({
                id: scope.id,
                displayName: scope.adminConsentDisplayName || scope.value,
                description: scope.adminConsentDescription || scope.userConsentDescription,
                type: 'Delegated',
                api: resourceSp.displayName,
                apiId: resourceSp.appId,
                value: scope.value,
                isEnabled: scope.isEnabled,
                consentType: grant.consentType === 'AllPrincipals' ? 'Admin' : 'User'
              });
            }
          }
        } catch (error) {
          console.warn(`Could not fetch details for OAuth2 permission grant ${grant.id}:`, error);
        }
      }

      return permissions;
    } catch (error) {
      console.error('Error fetching service principal assigned permissions:', error);
      throw error;
    }
  }

  async getAssignedUsers(targetId: string, isServicePrincipal: boolean): Promise<User[]> {
  try {
    let servicePrincipalId = targetId;

    if (!isServicePrincipal) {
      // For applications, we need to find the corresponding service principal first
      const app = await this.graphClient
        .api(`/applications/${targetId}`)
        .select('appId')
        .get();

      const spResponse = await this.graphClient
        .api('/servicePrincipals')
        .filter(`appId eq '${app.appId}'`)
        .select('id')
        .get();

      if (spResponse.value.length > 0) {
        servicePrincipalId = spResponse.value[0].id;
      } else {
        console.warn('No service principal found for application');
        return [];
      }
    }

    // Get app role assignments where this service principal is the resource
    const assignmentsResponse = await this.graphClient
      .api(`/servicePrincipals/${servicePrincipalId}/appRoleAssignedTo`)
      .get();

    const assignments = assignmentsResponse.value;
    const users: User[] = [];
    const processedUserIds = new Set<string>();

    for (const assignment of assignments) {
      if (assignment.principalType === 'User' && !processedUserIds.has(assignment.principalId)) {
        processedUserIds.add(assignment.principalId);
        try {
          const userResponse = await this.graphClient
            .api(`/users/${assignment.principalId}`)
            .select('id,displayName,userPrincipalName,mail,jobTitle,department')
            .get();

          if (userResponse) {
            users.push({
              id: userResponse.id,
              displayName: userResponse.displayName,
              userPrincipalName: userResponse.userPrincipalName,
              mail: userResponse.mail,
              jobTitle: userResponse.jobTitle,
              department: userResponse.department
            });
          }
        } catch (error) {
          console.warn(`Could not fetch user details for ${assignment.principalId}:`, error);
        }
      }
    }

    return users;
  } catch (error) {
    console.error('Error fetching assigned users:', error);
    throw error;
  }
}


  async getApiResources(): Promise<ApiResource[]> {
    try {
      // Get all service principals that expose APIs (have appRoles or oauth2PermissionScopes)
      const response = await this.graphClient
        .api('/servicePrincipals')
        .select('id,displayName,description,appId,appRoles,oauth2PermissionScopes')
        .top(999)
        .get();

      return response.value
        .filter((sp: any) => 
          (sp.appRoles && sp.appRoles.length > 0) || 
          (sp.oauth2PermissionScopes && sp.oauth2PermissionScopes.length > 0)
        )
        .map((sp: any) => ({
          id: sp.id,
          displayName: sp.displayName,
          description: sp.description || '',
          appId: sp.appId,
          appRoles: sp.appRoles || [],
          oauth2PermissionScopes: sp.oauth2PermissionScopes || []
        }));
    } catch (error) {
      console.error('Error fetching API resources:', error);
      
      // Fallback to well-known Microsoft APIs if the filter doesn't work
      const microsoftApis = [
        '00000003-0000-0000-c000-000000000000', // Microsoft Graph
        '00000003-0000-0ff1-ce00-000000000000', // SharePoint
        '00000002-0000-0000-c000-000000000000', // Azure AD Graph (legacy)
      ];

      const apiResources: ApiResource[] = [];

      for (const appId of microsoftApis) {
        try {
          const response = await this.graphClient
            .api(`/servicePrincipals`)
            .filter(`appId eq '${appId}'`)
            .select('id,displayName,description,appId,appRoles,oauth2PermissionScopes')
            .get();

          if (response.value.length > 0) {
            const sp = response.value[0];
            apiResources.push({
              id: sp.id,
              displayName: sp.displayName,
              description: sp.description || '',
              appId: sp.appId,
              appRoles: sp.appRoles || [],
              oauth2PermissionScopes: sp.oauth2PermissionScopes || []
            });
          }
        } catch (error) {
          console.warn(`Could not fetch API resource ${appId}:`, error);
        }
      }

      return apiResources;
    }
  }

  async updateApplicationStatus(appId: string, isEnabled: boolean): Promise<void> {
    // Note: Applications don't have a direct enabled/disabled property
    // This would typically involve updating the service principal
    console.log(`Application status update not directly supported. App ID: ${appId}, Enabled: ${isEnabled}`);
  }

  async updateServicePrincipalStatus(spId: string, accountEnabled: boolean): Promise<void> {
    try {
      await this.graphClient
        .api(`/servicePrincipals/${spId}`)
        .patch({
          accountEnabled: accountEnabled
        });
    } catch (error) {
      console.error('Error updating service principal status:', error);
      throw error;
    }
  }

  async addPermission(appId: string, permission: Permission): Promise<void> {
    try {
      // Get current application
      const app = await this.graphClient
        .api(`/applications/${appId}`)
        .select('requiredResourceAccess')
        .get();

      const requiredResourceAccess = app.requiredResourceAccess || [];
      
      // Find or create resource access entry
      let resourceAccess = requiredResourceAccess.find((rra: any) => 
        rra.resourceAppId === permission.apiId
      );

      if (!resourceAccess) {
        resourceAccess = {
          resourceAppId: permission.apiId,
          resourceAccess: []
        };
        requiredResourceAccess.push(resourceAccess);
      }

      // Check if permission already exists
      const accessType = permission.type === 'Application' ? 'Role' : 'Scope';
      const existingAccess = resourceAccess.resourceAccess.find((ra: any) => 
        ra.id === permission.id && ra.type === accessType
      );

      if (!existingAccess) {
        // Add the permission
        resourceAccess.resourceAccess.push({
          id: permission.id,
          type: accessType
        });

        // Update the application
        await this.graphClient
          .api(`/applications/${appId}`)
          .patch({
            requiredResourceAccess: requiredResourceAccess
          });
      }
    } catch (error) {
      console.error('Error adding permission:', error);
      throw error;
    }
  }

  async addServicePrincipalPermission(spId: string, permission: Permission): Promise<void> {
    try {
      // First, get the service principal object ID for the resource using the application ID
      const resourceSpResponse = await this.graphClient
        .api('/servicePrincipals')
        .filter(`appId eq '${permission.apiId}'`)
        .select('id')
        .get();

      if (resourceSpResponse.value.length === 0) {
        throw new Error(`Service principal not found for application ID: ${permission.apiId}`);
      }

      const resourceServicePrincipalId = resourceSpResponse.value[0].id;

      if (permission.type === 'Application') {
        // Add app role assignment
        await this.graphClient
          .api('/appRoleAssignments')
          .post({
            principalId: spId,
            resourceId: resourceServicePrincipalId,
            appRoleId: permission.id
          });
      } else {
        // Add OAuth2 permission grant
        await this.graphClient
          .api('/oauth2PermissionGrants')
          .post({
            clientId: spId,
            consentType: 'AllPrincipals',
            resourceId: resourceServicePrincipalId,
            scope: permission.value
          });
      }
    } catch (error) {
      console.error('Error adding service principal permission:', error);
      throw error;
    }
  }

  async removePermission(appId: string, permissionId: string): Promise<void> {
    try {
      // Get current application
      const app = await this.graphClient
        .api(`/applications/${appId}`)
        .select('requiredResourceAccess')
        .get();

      const requiredResourceAccess = app.requiredResourceAccess || [];
      
      // Remove the permission from all resource access entries
      requiredResourceAccess.forEach((rra: any) => {
        rra.resourceAccess = rra.resourceAccess.filter((ra: any) => ra.id !== permissionId);
      });

      // Remove empty resource access entries
      const filteredResourceAccess = requiredResourceAccess.filter((rra: any) => 
        rra.resourceAccess.length > 0
      );

      // Update the application
      await this.graphClient
        .api(`/applications/${appId}`)
        .patch({
          requiredResourceAccess: filteredResourceAccess
        });
    } catch (error) {
      console.error('Error removing permission:', error);
      throw error;
    }
  }

  async removeServicePrincipalPermission(spId: string, permissionId: string): Promise<void> {
    try {
      // Find and remove app role assignments
      const appRoleAssignments = await this.graphClient
        .api(`/servicePrincipals/${spId}/appRoleAssignments`)
        .get();

      for (const assignment of appRoleAssignments.value) {
        if (assignment.appRoleId === permissionId) {
          await this.graphClient
            .api(`/servicePrincipals/${spId}/appRoleAssignments/${assignment.id}`)
            .delete();
        }
      }

      // Find and remove OAuth2 permission grants
      const oauth2Grants = await this.graphClient
        .api('/oauth2PermissionGrants')
        .filter(`clientId eq '${spId}'`)
        .get();

      for (const grant of oauth2Grants.value) {
        const scopes = grant.scope ? grant.scope.split(' ') : [];
        // Find the permission by ID in the scopes (this is a simplified approach)
        // In reality, you'd need to match the permission ID to the scope value
        const updatedScopes = scopes.filter((scope: string) => scope !== permissionId);
        
        if (updatedScopes.length !== scopes.length) {
          if (updatedScopes.length === 0) {
            // Remove the entire grant if no scopes left
            await this.graphClient
              .api(`/oauth2PermissionGrants/${grant.id}`)
              .delete();
          } else {
            // Update the grant with remaining scopes
            await this.graphClient
              .api(`/oauth2PermissionGrants/${grant.id}`)
              .patch({
                scope: updatedScopes.join(' ')
              });
          }
        }
      }
    } catch (error) {
      console.error('Error removing service principal permission:', error);
      throw error;
    }
  }

  async grantDelegatedPermission(appId: string, userId: string, permissionId: string): Promise<void> {
    try {
      // This requires creating an OAuth2PermissionGrant
      await this.graphClient
        .api('/oauth2PermissionGrants')
        .post({
          clientId: appId,
          consentType: 'Principal',
          principalId: userId,
          resourceId: permissionId, // This should be the service principal ID of the resource
          scope: permissionId // This should be the scope value
        });
    } catch (error) {
      console.error('Error granting delegated permission:', error);
      throw error;
    }
  }

  async revokeDelegatedPermission(appId: string, userId: string, permissionId: string): Promise<void> {
    try {
      // Find and delete the OAuth2PermissionGrant
      const grants = await this.graphClient
        .api('/oauth2PermissionGrants')
        .filter(`clientId eq '${appId}' and principalId eq '${userId}'`)
        .get();

      for (const grant of grants.value) {
        await this.graphClient
          .api(`/oauth2PermissionGrants/${grant.id}`)
          .delete();
      }
    } catch (error) {
      console.error('Error revoking delegated permission:', error);
      throw error;
    }
  }

  async assignUserToApplication(targetId: string, userId: string, isServicePrincipal: boolean): Promise<void> {
    try {
      let servicePrincipalId = targetId;
      let appId = '';

      if (!isServicePrincipal) {
        // For applications, find the corresponding service principal
        const app = await this.graphClient
          .api(`/applications/${targetId}`)
          .select('id,appId')
          .get();
        
        appId = app.appId;

        const spResponse = await this.graphClient
          .api('/servicePrincipals')
          .filter(`appId eq '${app.appId}'`)
          .select('id')
          .get();

        if (spResponse.value.length === 0) {
          throw new Error('No service principal found for this application');
        }
        servicePrincipalId = spResponse.value[0].id;
      } else {
        // Get the appId for the service principal
        const sp = await this.graphClient
          .api(`/servicePrincipals/${servicePrincipalId}`)
          .select('appId')
          .get();
        appId = sp.appId;
      }

      // Get available app roles from the service principal
      const servicePrincipal = await this.graphClient
        .api(`/servicePrincipals/${servicePrincipalId}`)
        .select('appRoles')
        .get();

      // Find a suitable app role (default role with value 'User' or the first available)
      let appRoleId = '00000000-0000-0000-0000-000000000000'; // Default role ID
      
      if (servicePrincipal.appRoles && servicePrincipal.appRoles.length > 0) {
        const defaultRole = servicePrincipal.appRoles.find((role: any) => 
          role.value === 'User' || role.displayName === 'User' || role.isDefault
        ) || servicePrincipal.appRoles[0];
        appRoleId = defaultRole.id;
      }

      // Use New-MgUserAppRoleAssignment equivalent
      await this.graphClient
        .api(`/users/${userId}/appRoleAssignments`)
        .post({
          principalId: userId,
          resourceId: servicePrincipalId,
          appRoleId: appRoleId
        });
    } catch (error) {
      console.error('Error assigning user to application:', error);
      throw error;
    }
  }

  async removeUserFromApplication(targetId: string, userId: string, isServicePrincipal: boolean): Promise<void> {
  try {
    let servicePrincipalId = targetId;

    if (!isServicePrincipal) {
      // Buscar el service principal relacionado con la aplicación
      const app = await this.graphClient
        .api(`/applications/${targetId}`)
        .select('appId')
        .get();

      const spResponse = await this.graphClient
        .api('/servicePrincipals')
        .filter(`appId eq '${app.appId}'`)
        .select('id')
        .get();

      if (spResponse.value.length > 0) {
        servicePrincipalId = spResponse.value[0].id;
      } else {
        console.warn('No service principal found for application');
        return;
      }
    }

    // Buscar asignaciones del usuario hacia ese service principal
    const userAssignments = await this.graphClient
      .api(`/users/${userId}/appRoleAssignments`)
      .filter(`resourceId eq ${servicePrincipalId}`)  // 👈 sin comillas
      .get();

    if (!userAssignments.value || userAssignments.value.length === 0) {
      console.log('No role assignments found for this user and app.');
      return;
    }

    // Eliminar cada asignación encontrada
    for (const assignment of userAssignments.value) {
      await this.graphClient
        .api(`/users/${userId}/appRoleAssignments/${assignment.id}`)
        .delete();

      console.log(`Removed assignment ${assignment.id} from user ${userId}`);
    }
  } catch (error) {
    console.error('Error removing user from application:', error);
    throw error;
  }
}


async getAssignedGroups(targetId: string, isServicePrincipal: boolean): Promise<Group[]> {
  try {
    let servicePrincipalId = targetId;

    if (!isServicePrincipal) {
      // Obtener el appId y luego buscar su servicePrincipal
      const app = await this.graphClient
        .api(`/applications/${targetId}`)
        .select('appId')
        .get();

      const spResponse = await this.graphClient
        .api('/servicePrincipals')
        .filter(`appId eq '${app.appId}'`)
        .select('id')
        .get();

      if (spResponse.value.length > 0) {
        servicePrincipalId = spResponse.value[0].id;
      } else {
        console.warn('No service principal found for application');
        return [];
      }
    }

    // Obtener asignaciones de rol donde este service principal es el recurso
    const assignmentsResponse = await this.graphClient
      .api(`/servicePrincipals/${servicePrincipalId}/appRoleAssignedTo`)
      .get();

    const assignments = assignmentsResponse.value;
    const groups: Group[] = [];
    const processedGroupIds = new Set<string>();

    for (const assignment of assignments) {
      if (assignment.principalType === 'Group' && !processedGroupIds.has(assignment.principalId)) {
        processedGroupIds.add(assignment.principalId);
        try {
          const groupResponse = await this.graphClient
            .api(`/groups/${assignment.principalId}`)
            .select('id,displayName,description,mail,groupTypes,securityEnabled')
            .get();

          if (groupResponse) {
            groups.push({
              id: groupResponse.id,
              displayName: groupResponse.displayName,
              description: groupResponse.description,
              mail: groupResponse.mail,
              groupTypes: groupResponse.groupTypes || [],
              securityEnabled: groupResponse.securityEnabled
            });
          }
        } catch (error) {
          console.warn(`Could not fetch group details for ${assignment.principalId}:`, error);
        }
      }
    }

    return groups;
  } catch (error) {
    console.error('Error fetching assigned groups:', error);
    throw error;
  }
}

  
  async assignGroupToApplication(targetId: string, groupId: string, isServicePrincipal: boolean): Promise<void> {
    try {
      let servicePrincipalId = targetId;

      if (!isServicePrincipal) {
        // For applications, find the corresponding service principal
        const app = await this.graphClient
          .api(`/applications/${targetId}`)
          .select('id,appId')
          .get();

        const spResponse = await this.graphClient
          .api('/servicePrincipals')
          .filter(`appId eq '${app.appId}'`)
          .select('id')
          .get();

        if (spResponse.value.length === 0) {
          throw new Error('No service principal found for this application');
        }
        servicePrincipalId = spResponse.value[0].id;
      }

      // Get available app roles from the service principal
      const servicePrincipal = await this.graphClient
        .api(`/servicePrincipals/${servicePrincipalId}`)
        .select('appRoles')
        .get();

      // Find a suitable app role
      let appRoleId = '00000000-0000-0000-0000-000000000000'; // Default role ID
      
      if (servicePrincipal.appRoles && servicePrincipal.appRoles.length > 0) {
        const defaultRole = servicePrincipal.appRoles.find((role: any) => 
          role.value === 'User' || role.displayName === 'User' || role.isDefault
        ) || servicePrincipal.appRoles[0];
        appRoleId = defaultRole.id;
      }

      // Use New-MgGroupAppRoleAssignment equivalent
      await this.graphClient
        .api(`/groups/${groupId}/appRoleAssignments`)
        .post({
          principalId: groupId,
          resourceId: servicePrincipalId,
          appRoleId: appRoleId
        });
    } catch (error) {
      console.error('Error assigning group to application:', error);
      throw error;
    }
  }

  async removeGroupFromApplication(targetId: string, groupId: string, isServicePrincipal: boolean): Promise<void> {
  try {
    let servicePrincipalId = targetId;

    if (!isServicePrincipal) {
      // Obtener el appId y buscar su servicePrincipal
      const app = await this.graphClient
        .api(`/applications/${targetId}`)
        .select('appId')
        .get();

      const spResponse = await this.graphClient
        .api('/servicePrincipals')
        .filter(`appId eq '${app.appId}'`)
        .select('id')
        .get();

      if (spResponse.value.length > 0) {
        servicePrincipalId = spResponse.value[0].id;
      } else {
        console.warn('No service principal found for application');
        return;
      }
    }

    // Buscar asignaciones del grupo hacia ese service principal
    const groupAssignments = await this.graphClient
      .api(`/groups/${groupId}/appRoleAssignments`)
      .filter(`resourceId eq ${servicePrincipalId}`) // 👈 SIN comillas
      .get();

    if (!groupAssignments.value || groupAssignments.value.length === 0) {
      console.log('No role assignments found for this group and app.');
      return;
    }

    // Eliminar cada asignación encontrada
    for (const assignment of groupAssignments.value) {
      await this.graphClient
        .api(`/groups/${groupId}/appRoleAssignments/${assignment.id}`)
        .delete();

      console.log(`Removed assignment ${assignment.id} from group ${groupId}`);
    }
  } catch (error) {
    console.error('Error removing group from application:', error);
    throw error;
  }
}

  async searchGroups(query: string): Promise<Group[]> {
    try {
      const response = await this.graphClient
        .api('/groups')
        .filter(`startswith(displayName,'${query}') or startswith(mail,'${query}')`)
        .select('id,displayName,description,mail,groupTypes,securityEnabled')
        .top(10)
        .get();

      return response.value.map((group: any) => ({
        id: group.id,
        displayName: group.displayName,
        description: group.description,
        mail: group.mail,
        groupTypes: group.groupTypes || [],
        securityEnabled: group.securityEnabled
      }));
    } catch (error) {
      console.error('Error searching groups:', error);
      throw error;
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await this.graphClient
        .api('/users')
        .filter(`startswith(displayName,'${query}') or startswith(userPrincipalName,'${query}')`)
        .select('id,displayName,userPrincipalName,mail,jobTitle,department')
        .top(10)
        .get();

      return response.value.map((user: any) => ({
        id: user.id,
        displayName: user.displayName,
        userPrincipalName: user.userPrincipalName,
        mail: user.mail,
        jobTitle: user.jobTitle,
        department: user.department
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  async getUsersWithPermission(appId: string, permissionId: string): Promise<User[]> {
    try {
      let servicePrincipalId: string;

      // If appId looks like a UUID (app registration), find the corresponding service principal
      if (appId.length === 36 && appId.includes('-')) {
        try {
          // First, try to get the application to get its appId
          const app = await this.graphClient
            .api(`/applications/${appId}`)
            .select('appId')
            .get();

          // Then find the service principal for this app
          const spResponse = await this.graphClient
            .api('/servicePrincipals')
            .filter(`appId eq '${app.appId}'`)
            .select('id')
            .get();

          if (spResponse.value.length > 0) {
            servicePrincipalId = spResponse.value[0].id;
          } else {
            console.warn('No service principal found for application');
            return [];
          }
        } catch (error) {
          // If application not found, assume appId is already a service principal ID
          servicePrincipalId = appId;
        }
      } else {
        servicePrincipalId = appId;
      }

      // Get OAuth2 permission grants for this service principal (delegated permissions)
      const permissionGrants = await this.graphClient
        .api('/oauth2PermissionGrants')
        .filter(`clientId eq '${servicePrincipalId}'`)
        .get();

      const usersWithPermission: User[] = [];
      const processedUserIds = new Set<string>();

      // Check each grant to see if it includes the specific permission
      for (const grant of permissionGrants.value) {
        if (grant.consentType === 'Principal' && grant.principalId) {
          // This is a user-specific grant
          const scopes = grant.scope ? grant.scope.split(' ') : [];
          
          // Find the scope that matches our permission ID
          try {
            const resourceSp = await this.graphClient
              .api(`/servicePrincipals/${grant.resourceId}`)
              .select('oauth2PermissionScopes')
              .get();

            const matchingScope = resourceSp.oauth2PermissionScopes?.find((scope: any) => 
              scope.id === permissionId && scopes.includes(scope.value)
            );

            if (matchingScope && !processedUserIds.has(grant.principalId)) {
              processedUserIds.add(grant.principalId);
              
              try {
                const userResponse = await this.graphClient
                  .api(`/users/${grant.principalId}`)
                  .select('id,displayName,userPrincipalName,mail,jobTitle,department')
                  .get();

                usersWithPermission.push({
                  id: userResponse.id,
                  displayName: userResponse.displayName,
                  userPrincipalName: userResponse.userPrincipalName,
                  mail: userResponse.mail,
                  jobTitle: userResponse.jobTitle,
                  department: userResponse.department
                });
              } catch (userError) {
                console.warn(`Could not fetch user details for ${grant.principalId}:`, userError);
              }
            }
          } catch (resourceError) {
            console.warn(`Could not fetch resource details for ${grant.resourceId}:`, resourceError);
          }
        }
      }

      return usersWithPermission;
    } catch (error) {
      console.error('Error fetching users with permission:', error);
      throw error;
    }
  }

 /**
 * Revoca todos los permisos (delegados y de aplicación) de un Service Principal.
 * Equivalente al script de PowerShell proporcionado.
 */
async revokeAllPermissionsFromServicePrincipal(servicePrincipalId: string): Promise<void> {
  try {
    // 1. Revocar todos los permisos delegados (OAuth2PermissionGrants)
    const oAuth2Grants = await this.graphClient
      .api(`/servicePrincipals/${servicePrincipalId}/oauth2PermissionGrants`)
      .get();

    if (oAuth2Grants.value && oAuth2Grants.value.length > 0) {
      for (const grant of oAuth2Grants.value) {
        await this.graphClient
          .api(`/oauth2PermissionGrants/${grant.id}`)
          .delete();
      }
    }

    // 2. Revocar todos los permisos de aplicación (AppRoleAssignments)
    const appRoleAssignments = await this.graphClient
      .api(`/servicePrincipals/${servicePrincipalId}/appRoleAssignments`)
      .get();

    if (appRoleAssignments.value && appRoleAssignments.value.length > 0) {
      for (const assignment of appRoleAssignments.value) {
        await this.graphClient
          .api(`/servicePrincipals/${servicePrincipalId}/appRoleAssignments/${assignment.id}`)
          .delete();
      }
    }
  } catch (error) {
    console.error('Error revocando todos los permisos del Service Principal:', error);
    throw error;
  }
}

async revokeAllAdminConsents(app: Application): Promise<void> {
  try {
    if (app.isServicePrincipal) {
      const permissions = await this.getServicePrincipalAssignedPermissions(app.servicePrincipalId || app.id);
      for (const perm of permissions.filter(p => p.type === 'Delegated' && p.consentType === 'Admin')) {
        await this.removeServicePrincipalPermission(app.servicePrincipalId || app.id, perm.id);
      }
    } else {
      const permissions = await this.getApplicationAssignedPermissions(app.id);
      for (const perm of permissions.filter(p => p.type === 'Delegated' && p.consentType === 'Admin')) {
        await this.removePermission(app.id, perm.id);
      }
    }
  } catch (error) {
    console.error('Error revocando admin consent:', error);
    throw error;
  }
}

/**
 * Elimina una asignación de permiso de aplicación (AppRoleAssignment) de un Service Principal.
 * Busca el AppRoleAssignment por el appRoleId (permissionId) y lo elimina.
 */
async revokeAdminConsentForPermission(servicePrincipalId: string, appRoleId: string): Promise<void> {
  try {
    // 1. Obtener todos los AppRoleAssignments del Service Principal
    const assignments = await this.graphClient
      .api(`/servicePrincipals/${servicePrincipalId}/appRoleAssignments`)
      .get();

    // 2. Buscar el assignment que corresponde al appRoleId (permissionId)
    const assignment = assignments.value.find((a: any) => a.appRoleId === appRoleId);

    if (!assignment) {
      throw new Error('No se encontró el AppRoleAssignment para este permiso.');
    }

    // 3. Eliminar el AppRoleAssignment
    await this.graphClient
      .api(`/servicePrincipals/${servicePrincipalId}/appRoleAssignments/${assignment.id}`)
      .delete();

    console.log(`AppRoleAssignment ${assignment.id} eliminado del Service Principal ${servicePrincipalId}`);
  } catch (error) {
    console.error('Error eliminando AppRoleAssignment:', error);
    throw error;
  }
}

}
export const realGraphApiService = new RealGraphApiService();

