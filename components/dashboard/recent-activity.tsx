'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Image as ImageIcon, Calendar, CheckCircle, AlertCircle, MoreHorizontal } from 'lucide-react';

interface Activity {
  id: string;
  unit: {
    id: string;
    name: string;
  };
  action: string;
  user: {
    id: string;
    name: string;
  };
  time: string;
  type: 'upload' | 'schedule' | 'update' | 'status';
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    // For now, we'll use mock data
    const mockActivities: Activity[] = [
      {
        id: '1',
        unit: { id: 'unit_hypermart_a', name: 'Hypermart A' },
        action: 'uploaded a new image for Medium Prize',
        user: { id: 'user1', name: 'John Doe' },
        time: '2 hours ago',
        type: 'upload'
      },
      {
        id: '2',
        unit: { id: 'unit_hypermart_c', name: 'Hypermart C' },
        action: 'scheduled images for tomorrow',
        user: { id: 'user2', name: 'Emily Chen' },
        time: '5 hours ago',
        type: 'schedule'
      },
      {
        id: '3',
        unit: { id: 'unit_hypermart_b', name: 'Hypermart B' },
        action: 'updated Top Prize image',
        user: { id: 'user3', name: 'Jane Smith' },
        time: '1 day ago',
        type: 'update'
      },
      {
        id: '4',
        unit: { id: 'unit_hypermart_d', name: 'Hypermart D' },
        action: 'is now inactive',
        user: { id: 'system', name: 'System' },
        time: '3 days ago',
        type: 'status'
      },
    ];

    // Simulate API delay
    setTimeout(() => {
      setActivities(mockActivities);
      setIsLoading(false);
    }, 500);
  }, []);

  // Helper function to get icon based on activity type
  const getActivityIcon = (type: Activity['type']) => {
    const iconStyles = {
      upload: "bg-blue-100 text-blue-600",
      schedule: "bg-purple-100 text-purple-600",
      update: "bg-green-100 text-green-600",
      status: "bg-red-100 text-red-600"
    };

    const getIcon = () => {
      switch (type) {
        case 'upload':
          return <ImageIcon size={14} />;
        case 'schedule':
          return <Calendar size={14} />;
        case 'update':
          return <CheckCircle size={14} />;
        case 'status':
          return <AlertCircle size={14} />;
        default:
          return <ImageIcon size={14} />;
      }
    };

    return (
      <div className={`h-8 w-8 rounded-full ${iconStyles[type]} flex items-center justify-center flex-shrink-0`}>
        {getIcon()}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="px-6 py-4 flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Recent Activity</h2>
        <button 
          onClick={() => router.push('/activity')} 
          className="text-sm text-blue-600 hover:underline flex items-center"
        >
          View all <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
      
      {activities.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          No recent activity found.
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 flex items-start space-x-4">
              {getActivityIcon(activity.type)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span 
                    className="font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/units/${activity.unit.id}`)}
                  >
                    {activity.unit.name}
                  </span>
                  <span className="text-gray-500"> {activity.action}</span>
                </p>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <span>{activity.user.name} • {activity.time}</span>
                </p>
              </div>
              
              <button className="text-gray-400 hover:text-gray-500">
                <MoreHorizontal size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}