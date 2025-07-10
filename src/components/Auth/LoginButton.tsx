import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { authService } from '../../services/authService';

interface LoginButtonProps {
  isLoggedIn: boolean;
  userInfo?: any;
  onLoginSuccess: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ isLoggedIn, userInfo, onLoginSuccess }) => {
  const handleLogin = async () => {
    try {
      await authService.login();
      onLoginSuccess();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-white">{userInfo?.name || 'User'}</p>
            <p className="text-gray-300 text-xs">{userInfo?.username}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <LogIn className="w-4 h-4" />
      <span>Login to Azure AD</span>
    </button>
  );
};

export default LoginButton;