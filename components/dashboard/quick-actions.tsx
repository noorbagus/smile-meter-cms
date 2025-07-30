'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, Image as ImageIcon, Calendar, Users, BarChart2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function QuickActions() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  
  const actions = [
    {
      title: 'Upload Image',
      description: 'Update unit rewards',
      icon: <ImageIcon size={20} className="text-blue-600" />,
      bgColor: 'bg-blue-100',
      onClick: () => router.push('/units'),
    },
    {
      title: 'Schedule Images',
      description: 'Plan future campaigns',
      icon: <Calendar size={20} className="text-purple-600" />,
      bgColor: 'bg-purple-100',
      onClick: () => router.push('/schedule'),
    },
    {
      title: 'Add Manager',
      description: 'Create new user account',
      icon: <Users size={20} className="text-indigo-600" />,
      bgColor: 'bg-indigo-100',
      onClick: () => router.push('/users'),
      adminOnly: true,
    },
    {
      title: 'View Analytics',
      description: 'Performance reports',
      icon: <BarChart2 size={20} className="text-green-600" />,
      bgColor: 'bg-green-100',
      onClick: () => router.push('/analytics'),
    },
  ];

  // Filter actions based on user role
  const filteredActions = actions.filter(action => !action.adminOnly || isAdmin);

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg">Quick Actions</h2>
      </div>
      <div className="p-6 space-y-4">
        {filteredActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center">
              <div className={`h-10 w-10 rounded-full ${action.bgColor} flex items-center justify-center mr-3`}>
                {action.icon}
              </div>
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}