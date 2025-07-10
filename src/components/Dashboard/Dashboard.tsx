import React from 'react';
import DashboardStats from './DashboardStats';
import { Activity, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const recentActivity = [
    {
      id: 1,
      action: 'Permission granted',
      details: 'User.Read.All granted to Sales Dashboard',
      time: '2 minutes ago',
      type: 'success'
    },
    {
      id: 2,
      action: 'Application disabled',
      details: 'Legacy CRM application disabled',
      time: '1 hour ago',
      type: 'warning'
    },
    {
      id: 3,
      action: 'New application created',
      details: 'Marketing Analytics App created',
      time: '3 hours ago',
      type: 'info'
    },
    {
      id: 4,
      action: 'Service principal updated',
      details: 'HR Portal service principal updated',
      time: '5 hours ago',
      type: 'info'
    }
  ];

  const securityAlerts = [
    {
      id: 1,
      title: 'Excessive Permissions',
      description: 'Sales Dashboard has more permissions than necessary',
      severity: 'medium',
      time: '1 hour ago'
    },
    {
      id: 2,
      title: 'Unused Application',
      description: 'Legacy CRM has not been used in 30 days',
      severity: 'low',
      time: '2 days ago'
    },
    {
      id: 3,
      title: 'Admin Consent Required',
      description: 'Marketing App requires admin consent for new permissions',
      severity: 'high',
      time: '3 days ago'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <DashboardStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start space-x-3">
                  <div className="text-lg">{getActivityIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.action}</p>
                    <p className="text-sm text-gray-500">{item.details}</p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all activity
              </button>
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
              <AlertTriangle className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{alert.title}</h4>
                      <p className="text-sm mt-1 opacity-90">{alert.description}</p>
                      <div className="flex items-center mt-2">
                        <Clock className="w-3 h-3 opacity-60 mr-1" />
                        <span className="text-xs opacity-75">{alert.time}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                      alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all alerts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-sm font-medium text-gray-700">Create Application</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
              <div className="text-2xl mb-2">🔑</div>
              <p className="text-sm font-medium text-gray-700">Manage Permissions</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-sm font-medium text-gray-700">Assign Users</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium text-gray-700">View Reports</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;