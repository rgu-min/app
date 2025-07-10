import React from 'react';
import { 
  Shield, 
  Users, 
  Settings, 
  FileText, 
  Activity,
  Search,
  Home,
  Key,
  Server
} from 'lucide-react';
import LoginButton from '../Auth/LoginButton';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoggedIn: boolean;
  userInfo?: any;
  onLoginSuccess: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isLoggedIn, userInfo, onLoginSuccess }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'applications', label: 'Applications', icon: Shield },
    { id: 'service-principals', label: 'Service Principals', icon: Server },
    { id: 'permissions', label: 'Permissions', icon: Key },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Entra ID Manager</h1>
            <p className="text-xs text-gray-400">Permissions & Apps</p>
          </div>
        </div>
      </div>

      {isLoggedIn && (
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <div className="p-4 border-t border-gray-700">
        <LoginButton 
          isLoggedIn={isLoggedIn} 
          userInfo={userInfo} 
          onLoginSuccess={onLoginSuccess}
        />
      </div>
    </div>
  );
};

export default Sidebar;