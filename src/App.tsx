import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import ApplicationsList from './components/Applications/ApplicationsList';
import ApplicationDetails from './components/Applications/ApplicationDetails';
import { Application } from './types/entra';
import { authService } from './services/authService';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await authService.initialize();
      const loggedIn = authService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const account = authService.getAccount();
        setUserInfo(account);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const handleLoginSuccess = () => {
    const account = authService.getAccount();
    setIsLoggedIn(true);
    setUserInfo(account);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'applications': return 'Applications';
      case 'service-principals': return 'Service Principals';
      case 'permissions': return 'Permissions';
      case 'users': return 'Users';
      case 'audit': return 'Audit Logs';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Entra ID Manager</h2>
            <p className="text-gray-600 mb-6">Please login with your Azure AD account to manage applications and permissions.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-medium text-blue-900 mb-2">Required Permissions:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Application.ReadWrite.All</li>
                <li>• Directory.ReadWrite.All</li>
                <li>• User.Read.All</li>
                <li>• AppRoleAssignment.ReadWrite.All</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    if (selectedApplication) {
      return (
        <ApplicationDetails
          application={selectedApplication}
          onBack={() => setSelectedApplication(null)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'applications':
        return <ApplicationsList onSelectApplication={setSelectedApplication} />;
      case 'service-principals':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Service Principals</h3>
            <p className="text-gray-500">Service principals management coming soon...</p>
          </div>
        );
      case 'permissions':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Permissions Management</h3>
            <p className="text-gray-500">Global permissions management coming soon...</p>
          </div>
        );
      case 'users':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Users</h3>
            <p className="text-gray-500">User management coming soon...</p>
          </div>
        );
      case 'audit':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Logs</h3>
            <p className="text-gray-500">Audit logging coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-500">Application settings coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedApplication(null);
        }}
        isLoggedIn={isLoggedIn}
        userInfo={userInfo}
        onLoginSuccess={handleLoginSuccess}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={selectedApplication ? selectedApplication.displayName : getPageTitle()}
          onRefresh={() => window.location.reload()}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;