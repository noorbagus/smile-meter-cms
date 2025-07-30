'use client';

import { useState } from 'react';
import { 
  Image as ImageIcon, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Clock 
} from 'lucide-react';
import { UnitActivity } from '@/types/unit.types';
import { formatRelativeTime } from '@/lib/dashboard-utils';

interface ActivityLogProps {
  activities: UnitActivity[];
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  const [filter, setFilter] = useState<string>('all');
  
  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.action.includes(filter));

  const getActivityIcon = (action: string) => {
    if (action.includes('image')) {
      return <ImageIcon size={16} className="text-blue-500" />;
    } else if (action.includes('schedule')) {
      return <Calendar size={16} className="text-purple-500" />;
    } else if (action.includes('update')) {
      return <CheckCircle size={16} className="text-green-500" />;
    } else if (action.includes('inactive') || action.includes('delete')) {
      return <AlertCircle size={16} className="text-red-500" />;
    } else {
      return <CheckCircle size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Activity Log</h3>
        
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All activities</option>
            <option value="image">Images</option>
            <option value="schedule">Scheduling</option>
            <option value="update">Updates</option>
          </select>
        </div>
      </div>
      
      {filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No activity found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
            >
              <div className="mr-3 mt-0.5">
                {getActivityIcon(activity.action)}
              </div>
              
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.action}</span>
                </p>
                
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <div className="flex items-center">
                    <User size={12} className="mr-1" />
                    <span>{activity.userName}</span>
                  </div>
                  
                  <div className="mx-2">•</div>
                  
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    <span>{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                  
                  {activity.category && (
                    <>
                      <div className="mx-2">•</div>
                      <span className="capitalize">{activity.category.replace('_', ' ')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}