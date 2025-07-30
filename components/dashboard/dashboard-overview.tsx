'use client';

import { useEffect, useState } from 'react';
import { BarChart2, CheckCircle, Image as ImageIcon, Users } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import UnitsTable from '@/components/dashboard/units-table';
import RecentActivity from '@/components/dashboard/recent-activity';
import QuickActions from '@/components/dashboard/quick-actions';
import { UnitListItem } from '@/types/unit.types';
import { useUnits } from '@/hooks/use-units';

export interface DashboardStats {
  totalUnits: number;
  activeUnits: number;
  totalUsers: number;
  totalSessions: number;
  usersTrend: { value: string; label: string };
  sessionsTrend: { value: string; label: string };
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUnits: 0,
    activeUnits: 0,
    totalUsers: 8, // Mocked for now
    totalSessions: 1293, // Mocked for now
    usersTrend: { value: '+2', label: 'new this week' },
    sessionsTrend: { value: '+12%', label: 'from last week' }
  });
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getUnits, error } = useUnits();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const unitsData = await getUnits();
        setUnits(unitsData);
        
        // Update stats based on units data
        setStats(prevStats => ({
          ...prevStats,
          totalUnits: unitsData.length,
          activeUnits: unitsData.filter(u => u.status === 'active').length
        }));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [getUnits]);
  
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-6 rounded-xl h-32"></div>
            ))}
          </div>
          <div className="bg-gray-100 rounded-xl h-64"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Units" 
          value={stats.totalUnits} 
          trend={{ value: "+1", label: "from last month" }}
          icon={<ImageIcon className="h-5 w-5 text-blue-600" />}
        />
        <StatCard 
          title="Active Units" 
          value={stats.activeUnits} 
          trend={{ 
            value: stats.totalUnits > 0 ? `${Math.round((stats.activeUnits / stats.totalUnits) * 100)}%` : "0%", 
            label: "operational rate" 
          }}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        />
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          trend={stats.usersTrend}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
        />
        <StatCard 
          title="Total Sessions" 
          value={stats.totalSessions.toLocaleString()} 
          trend={stats.sessionsTrend}
          icon={<BarChart2 className="h-5 w-5 text-purple-600" />}
        />
      </div>

      {/* Units Overview */}
      <div className="mb-8">
        <UnitsTable units={units} isLoading={isLoading} />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}