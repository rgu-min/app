import React from 'react';
import { Shield, Server, Users, Key, AlertTriangle, CheckCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, change, changeType }) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${getChangeColor()}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

const DashboardStats: React.FC = () => {
  const stats = [
    {
      title: 'Total Applications',
      value: 24,
      icon: Shield,
      color: 'bg-blue-600',
      change: '+2 this week',
      changeType: 'positive' as const
    },
    {
      title: 'Service Principals',
      value: 18,
      icon: Server,
      color: 'bg-green-600',
      change: '+1 this week',
      changeType: 'positive' as const
    },
    {
      title: 'Active Users',
      value: 156,
      icon: Users,
      color: 'bg-purple-600',
      change: '+8 this month',
      changeType: 'positive' as const
    },
    {
      title: 'Permissions Granted',
      value: 342,
      icon: Key,
      color: 'bg-orange-600',
      change: '+15 this week',
      changeType: 'positive' as const
    },
    {
      title: 'Security Alerts',
      value: 3,
      icon: AlertTriangle,
      color: 'bg-red-600',
      change: '-2 from last week',
      changeType: 'positive' as const
    },
    {
      title: 'Compliant Apps',
      value: 21,
      icon: CheckCircle,
      color: 'bg-teal-600',
      change: '87.5% compliance',
      changeType: 'neutral' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;