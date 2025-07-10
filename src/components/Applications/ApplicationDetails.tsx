import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Key, Users, Settings, Power, Edit, Plus, X, Search, Filter, Server, UserPlus, UsersIcon } from 'lucide-react';
import { Application, Permission, User, Group, ApiResource } from '../../types/entra';
import { graphApiService } from '../../services/graphApi';
import { realGraphApiService } from '../../services/realGraphApi';

interface ApplicationDetailsProps {
  application: Application;
  onBack: () => void;
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ application, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [assignedPermissions, setAssignedPermissions] = useState<Permission[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [apiResources, setApiResources] = useState<ApiResource[]>([]);
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [groupSearchResults, setGroupSearchResults] = useState<Group[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [activePermissionTab, setActivePermissionTab] = useState<'admin' | 'user'>('admin');
  const [usersWithSelectedPermission, setUsersWithSelectedPermission] = useState<User[]>([]);
  const [loadingUsersWithPermission, setLoadingUsersWithPermission] = useState(false);

  useEffect(() => {
    loadApplicationPermissions();
    loadAvailablePermissions();
    loadAssignedUsers();
    loadAssignedGroups();
  }, []);

  const loadApplicationPermissions = async () => {
    try {
      setLoading(true);
      let permissions: Permission[] = [];
      
      if (application.isServicePrincipal) {
        permissions = await graphApiService.getServicePrincipalAssignedPermissions(application.servicePrincipalId || application.id);
      } else {
        permissions = await graphApiService.getApplicationAssignedPermissions(application.id);
      }
      
      setAssignedPermissions(permissions);
    } catch (error) {
      console.error('Error loading application permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePermissions = async () => {
    try {
      const resources = await graphApiService.getApiResources();
      setApiResources(resources);
      
      // Convertir recursos de API a formato de permisos disponibles
      const allPermissions: Permission[] = [];
      resources.forEach(resource => {
        resource.appRoles.forEach(role => {
          allPermissions.push({
            id: role.id,
            displayName: role.displayName,
            description: role.description,
            type: 'Application',
            api: resource.displayName,
            apiId: resource.appId,
            value: role.value,
            isEnabled: role.isEnabled
          });
        });
        
        resource.oauth2PermissionScopes.forEach(scope => {
          allPermissions.push({
            id: scope.id,
            displayName: scope.adminConsentDisplayName || scope.value,
            description: scope.adminConsentDescription || scope.userConsentDescription,
            type: 'Delegated',
            api: resource.displayName,
            apiId: resource.appId,
            value: scope.value,
            isEnabled: scope.isEnabled,
            consentType: scope.type === 'Admin' ? 'Admin' : 'User'
          });
        });
      });
      
      setAvailablePermissions(allPermissions);
    } catch (error) {
      console.error('Error loading available permissions:', error);
    }
  };

  const loadAssignedUsers = async () => {
    try {
      setUsersLoading(true);
      const users = await graphApiService.getAssignedUsers(
        application.isServicePrincipal ? (application.servicePrincipalId || application.id) : application.id,
        !!application.isServicePrincipal
      );
      setAssignedUsers(users);
    } catch (error) {
      console.error('Error loading assigned users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAssignedGroups = async () => {
    try {
      setGroupsLoading(true);
      const groups = await graphApiService.getAssignedGroups(
        application.isServicePrincipal ? (application.servicePrincipalId || application.id) : application.id,
        !!application.isServicePrincipal
      );
      setAssignedGroups(groups);
    } catch (error) {
      console.error('Error loading assigned groups:', error);
    } finally {
      setGroupsLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const users = await graphApiService.searchUsers(query);
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const searchGroups = async (query: string) => {
    if (query.length < 2) {
      setGroupSearchResults([]);
      return;
    }
    
    try {
      const groups = await graphApiService.searchGroups(query);
      setGroupSearchResults(groups);
    } catch (error) {
      console.error('Error searching groups:', error);
    }
  };

  const handleAddPermission = async (permission: Permission) => {
    try {
      if (application.isServicePrincipal) {
        await graphApiService.addServicePrincipalPermission(application.servicePrincipalId || application.id, permission);
      } else {
        await graphApiService.addPermission(application.id, permission);
      }
      setShowAddPermission(false);
      setPermissionSearchQuery('');
      // Recargar permisos asignados
      await loadApplicationPermissions();
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  };

 

  const handleAddUser = async (userId: string) => {
    try {
      await graphApiService.assignUserToApplication(
        application.isServicePrincipal ? (application.servicePrincipalId || application.id) : application.id,
        userId,
        !!application.isServicePrincipal
      );
      setShowAddUserModal(false);
      setUserSearchQuery('');
      setSearchResults([]);
      // Recargar usuarios asignados
      await loadAssignedUsers();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await graphApiService.removeUserFromApplication(
        application.isServicePrincipal ? (application.servicePrincipalId || application.id) : application.id,
        userId,
        !!application.isServicePrincipal
      );
      // Recargar usuarios asignados
      await loadAssignedUsers();
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const handleAddGroup = async (groupId: string) => {
    try {
      await graphApiService.assignGroupToApplication(
        application.isServicePrincipal ? (application.servicePrincipalId || application.id) : application.id,
        groupId,
        !!application.isServicePrincipal
      );
      setShowAddGroupModal(false);
      setGroupSearchQuery('');
      setGroupSearchResults([]);
      // Recargar grupos asignados
      await loadAssignedGroups();
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    try {
      await graphApiService.removeGroupFromApplication(
        application.isServicePrincipal ? (application.servicePrincipalId || application.id) : application.id,
        groupId,
        !!application.isServicePrincipal
      );
      // Recargar grupos asignados
      await loadAssignedGroups();
    } catch (error) {
      console.error('Error removing group:', error);
    }
  };

  const handleGrantToUser = async (userId: string, permissionId: string) => {
    try {
      await graphApiService.grantDelegatedPermission(application.id, userId, permissionId);
      setShowUserModal(false);
      setUserSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error granting permission to user:', error);
    }
  };

  const handleRevokeAllPermissions = async () => {
    if (window.confirm('¿Estás seguro de que quieres revocar todos los permisos de esta aplicación?')) {
      try {
        await realGraphApiService.revokeAllPermissions(application.id);
        alert('Todos los permisos han sido revocados.');
        // Opcional: refrescar datos
      } catch (error) {
        alert('Error al revocar los permisos.');
      }
    }
  };

  const handleRevokeAllAdminConsents = async () => {
    if (window.confirm('¿Estás seguro de que quieres revocar el admin consent de todos los permisos?')) {
      try {
        await realGraphApiService.revokeAllAdminConsents(application.id);
        alert('Admin consent revocado para todos los permisos.');
        await loadApplicationPermissions();
      } catch (error) {
        alert('Error al revocar el admin consent.');
      }
    }
  };

  const handleRevokeAllDelegatedPermissions = async () => {
    if (window.confirm('¿Estás seguro de que quieres revocar todos los permisos delegados de esta aplicación?')) {
      try {
        // Lógica para revocar todos los permisos delegados
        await Promise.all(
          assignedPermissions
            .filter(permission => permission.type === 'Delegated')
            .map(permission => {
              if (application.isServicePrincipal) {
                return graphApiService.removeServicePrincipalPermission(application.servicePrincipalId || application.id, permission.id);
              } else {
                return graphApiService.removePermission(application.id, permission.id);
              }
            })
        );
        
        alert('Todos los permisos delegados han sido revocados.');
        // Recargar permisos asignados
        await loadApplicationPermissions();
      } catch (error) {
        alert('Error al revocar los permisos delegados.');
      }
    }
  };

  const handleRemoveAdminConsentPermission = async (permissionId: string) => {
    try {
      const permission = assignedPermissions.find(p => p.id === permissionId);

      // Revoca el admin consent si es Delegated con admin consent
      if (permission?.type === 'Delegated' && permission.consentType === 'Admin') {
        if (realGraphApiService.revokeAdminConsentForPermission) {
          await realGraphApiService.revokeAdminConsentForPermission(application.id, permissionId);
        }
      }

      // Elimina el permiso (Application o Delegated)
      if (application.isServicePrincipal) {
        await realGraphApiService.removeServicePrincipalPermission(application.servicePrincipalId || application.id, permissionId);
      } else {
        await realGraphApiService.removePermission(application.id, permissionId);
      }
      await loadApplicationPermissions();
    } catch (error) {
      console.error('Error removing admin consent permission:', error);
    }
  };

const loadUsersWithPermission = async (permissionId: string) => {
  setLoadingUsersWithPermission(true);
  try {
    // Aquí debes llamar a tu servicio que devuelva los usuarios con ese permiso
    // Por ejemplo, si tienes una función en graphApiService:
    const users = await graphApiService.getUsersWithPermission(application.id, permissionId);
    setUsersWithSelectedPermission(users);
  } catch (error) {
    setUsersWithSelectedPermission([]);
    console.error('Error loading users with permission:', error);
  } finally {
    setLoadingUsersWithPermission(false);
  }
};
  
  // Filtrar permisos disponibles que no están asignados y que coinciden con la búsqueda
  const getFilteredAvailablePermissions = () => {
    const assignedPermissionIds = assignedPermissions.map(p => p.id);
    const unassignedPermissions = availablePermissions.filter(p => 
      !assignedPermissionIds.includes(p.id)
    );

    if (!permissionSearchQuery) {
      return unassignedPermissions;
    }

    const query = permissionSearchQuery.toLowerCase();
    return unassignedPermissions.filter(permission =>
      permission.displayName.toLowerCase().includes(query) ||
      (permission.description || '').toLowerCase().includes(query) ||
      (permission.api || '').toLowerCase().includes(query) ||
      (permission.value || '').toLowerCase().includes(query)
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'permissions', label: 'Permissions', icon: Key },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              application.isServicePrincipal ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {application.isServicePrincipal ? (
                <Server className="w-6 h-6 text-green-600" />
              ) : (
                <Shield className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{application.displayName}</h1>
              <p className="text-sm text-gray-500">{application.description}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  application.isServicePrincipal 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {application.isServicePrincipal ? 'Enterprise Application' : 'App Registration'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">App ID: {application.appId}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              application.isEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <Power className="w-4 h-4 mr-2 inline" />
            {application.isEnabled ? 'Disable' : 'Enable'}
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Edit className="w-4 h-4 mr-2 inline" />
            Edit
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Application ID</dt>
                    <dd className="text-sm text-gray-900 font-mono">{application.appId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Object ID</dt>
                    <dd className="text-sm text-gray-900 font-mono">{application.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Sign-in Audience</dt>
                    <dd className="text-sm text-gray-900">{application.signInAudience}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(application.createdDateTime).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Application Status</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      application.isEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {application.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Assigned Permissions</span>
                    <span className="text-sm text-gray-900">
                      {assignedPermissions.length} granted
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Required Resource Access</span>
                    <span className="text-sm text-gray-900">
                      {application.requiredResourceAccess?.length || 0} resources
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Assigned API Permissions</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Permisos actualmente asignados a esta aplicación ({assignedPermissions.length} total)
                </p>
              </div>
              <button
                onClick={() => setShowAddPermission(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Add Permission
              </button>
            </div>

            {/* Tabs para Admin/User Consent */}
            <div className="flex space-x-4 mb-4">
              <button
                className={`px-4 py-2 rounded ${activePermissionTab === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setActivePermissionTab('admin')}
              >
                Admin Consent
              </button>
              <button
                className={`px-4 py-2 rounded ${activePermissionTab === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setActivePermissionTab('user')}
              >
                User Consent
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedPermissions
                  .filter(permission =>
                    activePermissionTab === 'admin'
                      ? (permission.type === 'Application' || permission.consentType === 'Admin')
                      : permission.consentType === 'User'
                  )
                  .map((permission) => (
                    <div key={permission.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-gray-900">{permission.displayName}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              permission.type === 'Application' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {permission.type}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {permission.api}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">
                              <strong>Value:</strong> {permission.value}
                            </span>
                            {permission.consentType && (
                              <span className="text-xs text-gray-500">
                                <strong>Consent:</strong> {permission.consentType}
                              </span>
                            )}
                            {permission.apiId && (
                              <span className="text-xs text-gray-400 font-mono">
                                API ID: {permission.apiId}
                              </span>
                            )}
                          </div>
                        </div>
                                                <div className="flex items-center space-x-2">
                          {activePermissionTab === 'admin' && permission.type === 'Application' && (
                            <button
                              onClick={async () => {
                                await realGraphApiService.revokeAdminConsentForPermission(
                                  application.servicePrincipalId || application.id,
                                  permission.id
                                );
                                await loadApplicationPermissions();
                              }}
                              className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors"
                              title="Eliminar completamente este permiso y su admin consent"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {activePermissionTab === 'user' && permission.type === 'Delegated' && (
                            <button
                              onClick={async () => {
                                setSelectedPermission(permission);
                                await loadUsersWithPermission(permission.id);
                                setShowUserModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              Ver usuarios asignados
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {assignedPermissions.filter(permission =>
                  activePermissionTab === 'admin'
                    ? permission.consentType === 'Admin'
                    : permission.consentType === 'User'
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay permisos asignados para esta categoría.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-6">
            <div className="space-y-8">
              {/* Users Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Assigned Users</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Usuarios asignados a esta {application.isServicePrincipal ? 'enterprise application' : 'aplicación'} ({assignedUsers.length} total)
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-2 inline" />
                    Add User
                  </button>
                </div>

                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : assignedUsers.length === 0 ? (
                  <div className="text-center py-8 border border-gray-200 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No users assigned</h4>
                    <p className="text-xs text-gray-500 mb-3">Esta aplicación no tiene usuarios asignados aún.</p>
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      <UserPlus className="w-3 h-3 mr-1 inline" />
                      Add First User
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedUsers.map((user) => (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                              <p className="text-xs text-gray-500">{user.userPrincipalName}</p>
                              {user.jobTitle && (
                                <p className="text-xs text-gray-400">{user.jobTitle}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove user"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Groups Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Assigned Groups</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Grupos asignados a esta {application.isServicePrincipal ? 'enterprise application' : 'aplicación'} ({assignedGroups.length} total)
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddGroupModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <UsersIcon className="w-4 h-4 mr-2 inline" />
                    Add Group
                  </button>
                </div>

                {groupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : assignedGroups.length === 0 ? (
                  <div className="text-center py-8 border border-gray-200 rounded-lg">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-900 mb-1">No groups assigned</h4>
                    <p className="text-xs text-gray-500 mb-3">Esta aplicación no tiene grupos asignados aún.</p>
                    <button
                      onClick={() => setShowAddGroupModal(true)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      <UsersIcon className="w-3 h-3 mr-1 inline" />
                      Add First Group
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedGroups.map((group) => (
                      <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <UsersIcon className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{group.displayName}</p>
                              {group.description && (
                                <p className="text-xs text-gray-500">{group.description}</p>
                              )}
                              {group.mail && (
                                <p className="text-xs text-gray-400">{group.mail}</p>
                              )}
                              <div className="flex items-center space-x-2 mt-1">
                                {group.securityEnabled && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Security</span>
                                )}
                                {group.groupTypes.includes('Unified') && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Microsoft 365</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveGroup(group.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove group"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                    </div>
                  </div>        
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {application.isServicePrincipal ? 'Enterprise Application' : 'Application'} Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    {application.isServicePrincipal ? 'Enterprise Application' : 'Application'} Status
                  </label>
                  <p className="text-sm text-gray-500">
                    Enable or disable this {application.isServicePrincipal ? 'enterprise application' : 'application'}
                  </p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    application.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                      application.isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Permissions
                  </label>
                  <p className="text-sm text-gray-500">
                    Manage permissions assigned to this application
                  </p>
                </div>
                <button
                  onClick={handleRevokeAllPermissions}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Revocar todos los permisos
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Admin Consent
                  </label>
                  <p className="text-sm text-gray-500">
                    Revoca el admin consent de todos los permisos delegados
                  </p>
                </div>
                <button
                  onClick={handleRevokeAllAdminConsents}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Revocar admin consent
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Permisos Delegados
                  </label>
                  <p className="text-sm text-gray-500">
                    Revoca todos los permisos delegados asignados a esta aplicación
                  </p>
                </div>
                <button
                  onClick={handleRevokeAllDelegatedPermissions}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Revocar permisos delegados
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Permission Modal */}
      {showAddPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Add API Permission</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Busca y selecciona permisos para agregar a la aplicación
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddPermission(false);
                    setPermissionSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar permisos por nombre, descripción o API..."
                    value={permissionSearchQuery}
                    onChange={(e) => setPermissionSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const filteredPermissions = getFilteredAvailablePermissions();
                
                if (filteredPermissions.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {permissionSearchQuery ? 'No permissions found' : 'All permissions assigned'}
                      </h3>
                      <p className="text-gray-500">
                        {permissionSearchQuery 
                          ? 'Try adjusting your search terms'
                          : 'Esta aplicación ya tiene todos los permisos disponibles asignados'
                        }
                      </p>
                    </div>
                  );
                }

                // Group permissions by API
                const permissionsByApi = filteredPermissions.reduce((acc, permission) => {
                  if (!acc[permission.api]) {
                    acc[permission.api] = [];
                  }
                  acc[permission.api].push(permission);
                  return acc;
                }, {} as Record<string, Permission[]>);

                return (
                  <div className="space-y-6">
                    {Object.entries(permissionsByApi).map(([apiName, permissions]) => (
                      <div key={apiName} className="border border-gray-200 rounded-lg">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h4 className="font-medium text-gray-900">{apiName}</h4>
                          <p className="text-sm text-gray-500">{permissions.length} available permissions</p>
                        </div>
                        <div className="p-4 space-y-3">
                          {permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">{permission.displayName}</span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    permission.type === 'Application' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {permission.type}
                                  </span>
                                  {permission.consentType && (
                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                      {permission.consentType} consent
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mb-1">{permission.description}</p>
                                <p className="text-xs text-gray-500">
                                  <strong>Value:</strong> {permission.value}
                                </p>
                              </div>
                              <button
                                onClick={() => handleAddPermission(permission)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Add User</h3>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setUserSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Buscar y asignar usuarios a esta {application.isServicePrincipal ? 'enterprise application' : 'aplicación'}
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.length === 0 && userSearchQuery.length >= 2 && (
                  <p className="text-sm text-gray-500 text-center py-4">No users found</p>
                )}
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.userPrincipalName}</p>
                        {user.jobTitle && (
                          <p className="text-xs text-gray-400">{user.jobTitle}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddUser(user.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      disabled={assignedUsers.some(assignedUser => assignedUser.id === user.id)}
                    >
                      {assignedUsers.some(assignedUser => assignedUser.id === user.id) ? 'Assigned' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Add Group</h3>
                <button
                  onClick={() => {
                    setShowAddGroupModal(false);
                    setGroupSearchQuery('');
                    setGroupSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Buscar y asignar grupos a esta {application.isServicePrincipal ? 'enterprise application' : 'aplicación'}
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={groupSearchQuery}
                    onChange={(e) => {
                      setGroupSearchQuery(e.target.value);
                      searchGroups(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groupSearchResults.length === 0 && groupSearchQuery.length >= 2 && (
                  <p className="text-sm text-gray-500 text-center py-4">No groups found</p>
                )}
                {groupSearchResults.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{group.displayName}</p>
                        {group.description && (
                          <p className="text-xs text-gray-500">{group.description}</p>
                        )}
                        {group.mail && (
                          <p className="text-xs text-gray-400">{group.mail}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddGroup(group.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      disabled={assignedGroups.some(assignedGroup => assignedGroup.id === group.id)}
                    >
                      {assignedGroups.some(assignedGroup => assignedGroup.id === group.id) ? 'Assigned' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

     {/* User Permission Modal */}
      {showUserModal && selectedPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Usuarios con el permiso "{selectedPermission.displayName}"
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setUsersWithSelectedPermission([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {loadingUsersWithPermission ? (
                <div className="text-center py-4">Cargando usuarios...</div>
              ) : usersWithSelectedPermission.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No hay usuarios con este permiso.</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {usersWithSelectedPermission.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.userPrincipalName}</p>
                        {user.jobTitle && (
                          <p className="text-xs text-gray-400">{user.jobTitle}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;