import React, { useState, useEffect } from 'react';
import { Shield, MoreVertical, Power, Edit, Trash2, Eye, Clock, Users, Server, Search } from 'lucide-react';
import { Application, ServicePrincipal } from '../../types/entra';
import { graphApiService } from '../../services/graphApi';

interface ApplicationsListProps {
  onSelectApplication: (app: Application) => void;
}

const ApplicationsList: React.FC<ApplicationsListProps> = ({ onSelectApplication }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [servicePrincipals, setServicePrincipals] = useState<ServicePrincipal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'applications' | 'servicePrincipals' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apps, sps] = await Promise.all([
        graphApiService.getApplications(),
        graphApiService.getServicePrincipals()
      ]);
      setApplications(apps);
      setServicePrincipals(sps);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApplicationStatus = async (appId: string, currentStatus: boolean) => {
    try {
      await graphApiService.updateApplicationStatus(appId, !currentStatus);
      await loadData();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const toggleServicePrincipalStatus = async (spId: string, currentStatus: boolean) => {
    try {
      await graphApiService.updateServicePrincipalStatus(spId, !currentStatus);
      await loadData();
    } catch (error) {
      console.error('Error updating service principal status:', error);
    }
  };

  // Combine applications and service principals for unified view
  const getCombinedData = () => {
    const combined: Array<{
      type: 'application' | 'servicePrincipal';
      data: Application | ServicePrincipal;
    }> = [];

    if (viewMode === 'all' || viewMode === 'applications') {
      applications.forEach(app => {
        combined.push({ type: 'application', data: app });
      });
    }

    if (viewMode === 'all' || viewMode === 'servicePrincipals') {
      servicePrincipals.forEach(sp => {
        // Convert ServicePrincipal to Application-like structure for display
        const appLike: Application = {
          id: sp.id,
          appId: sp.appId,
          displayName: sp.displayName,
          description: sp.description,
          createdDateTime: sp.createdDateTime,
          signInAudience: 'N/A',
          tags: sp.tags,
          isEnabled: sp.accountEnabled,
          requiredResourceAccess: [],
          owners: sp.owners
        };
        combined.push({ type: 'servicePrincipal', data: appLike });
      });
    }

    return combined;
  };

  const filteredData = getCombinedData()
    .filter(item => {
      // Filter by status
      if (filter === 'enabled') return item.data.isEnabled;
      if (filter === 'disabled') return !item.data.isEnabled;
      return true;
    })
    .filter(item => {
      // Filter by search query
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        item.data.displayName.toLowerCase().includes(query) ||
        (item.data.description || '').toLowerCase().includes(query) ||
        item.data.appId.toLowerCase().includes(query)
      );
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All (App Registrations + Enterprise Apps)</option>
            <option value="applications">App Registrations Only</option>
            <option value="servicePrincipals">Enterprise Applications Only</option>
          </select>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Showing {filteredData.length} of {applications.length + servicePrincipals.length} items
          </span>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            New Application
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application / Service Principal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  App ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => {
                const isServicePrincipal = item.type === 'servicePrincipal';
                const data = item.data;
                
                return (
                  <tr key={`${item.type}-${data.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          isServicePrincipal ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {isServicePrincipal ? (
                            <Server className={`w-5 h-5 ${isServicePrincipal ? 'text-green-600' : 'text-blue-600'}`} />
                          ) : (
                            <Shield className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{data.displayName}</div>
                          <div className="text-sm text-gray-500">{data.description || 'No description'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isServicePrincipal 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isServicePrincipal ? 'Enterprise App' : 'App Registration'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        data.isEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {data.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {data.appId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(data.createdDateTime).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {!isServicePrincipal && (
                        <button
                          onClick={() => onSelectApplication(data)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {isServicePrincipal && (
                        <button
                          onClick={() => {
                            // Convert ServicePrincipal to Application format for editing
                            const appForEditing: Application = {
                              ...data,
                              isServicePrincipal: true,
                              servicePrincipalId: data.id
                            };
                            onSelectApplication(appForEditing);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Manage Enterprise App"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => 
                          isServicePrincipal 
                            ? toggleServicePrincipalStatus(data.id, data.isEnabled)
                            : toggleApplicationStatus(data.id, data.isEnabled)
                        }
                        className={`p-1 rounded transition-colors ${
                          data.isEnabled 
                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={data.isEnabled ? 'Disable' : 'Enable'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="relative inline-block">
                        <button className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching applications found' : 'No applications found'}
            </h3>
            <p className="text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search terms or clearing the search filter.'
                : filter !== 'all' 
                  ? `No ${filter} applications found. Try changing the filter.`
                  : 'No applications or service principals found.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsList;