export interface Application {
  id: string;
  appId: string;
  displayName: string;
  description?: string;
  createdDateTime: string;
  signInAudience: string;
  tags: string[];
  isEnabled: boolean;
  requiredResourceAccess: RequiredResourceAccess[];
  owners: User[];
  isServicePrincipal?: boolean;
  servicePrincipalId?: string;
}

export interface ServicePrincipal {
  id: string;
  appId: string;
  displayName: string;
  description?: string;
  createdDateTime: string;
  accountEnabled: boolean;
  servicePrincipalType: string;
  tags: string[];
  appRoles: AppRole[];
  oauth2PermissionScopes: OAuth2PermissionScope[];
  owners: User[];
}

export interface RequiredResourceAccess {
  resourceAppId: string;
  resourceAccess: ResourceAccess[];
}

export interface ResourceAccess {
  id: string;
  type: 'Role' | 'Scope';
}

export interface AppRole {
  id: string;
  allowedMemberTypes: string[];
  description: string;
  displayName: string;
  isEnabled: boolean;
  value: string;
}

export interface OAuth2PermissionScope {
  id: string;
  adminConsentDescription: string;
  adminConsentDisplayName: string;
  isEnabled: boolean;
  type: string;
  userConsentDescription?: string;
  userConsentDisplayName?: string;
  value: string;
}

export interface User {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail?: string;
  jobTitle?: string;
  department?: string;
}

export interface Group {
  id: string;
  displayName: string;
  description?: string;
  mail?: string;
  groupTypes: string[];
  securityEnabled: boolean;
}

export interface Permission {
  id: string;
  displayName: string;
  description: string;
  type: 'Application' | 'Delegated';
  api: string;
  apiId?: string; // Added to store the actual API ID (appId)
  value: string;
  isEnabled: boolean;
  consentType?: 'Admin' | 'User';
  users?: User[];
}

export interface ApiResource {
  id: string;
  displayName: string;
  description: string;
  appId: string;
  appRoles: AppRole[];
  oauth2PermissionScopes: OAuth2PermissionScope[];
}

export interface UserPermission {
  userId: string;
  user: User;
  permissions: Permission[];
  grantedAt: string;
  grantedBy: string;
}

export interface GroupPermission {
  groupId: string;
  group: Group;
  permissions: Permission[];
  grantedAt: string;
  grantedBy: string;
}