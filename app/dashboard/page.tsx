'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, CheckCircle, Image as ImageIcon, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/dashboard/stat-card';
import UnitsTable from '@/components/dashboard/units-table';
import QuickActions from '@/components/dashboard/quick-actions';

interface Unit {
  id: string;
  name: string;
  manager_name?: string;
  status: 'active' | 'inactive';
  last_updated?: string;
  usage_today?: number;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);
  
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        // Mock data for simple implementation
        const mockUnits: Unit[] = [
          {
            id: 'unit_hypermart_a',
            name: 'Hypermart A',
            manager_name: 'John Doe',
            status: 'active',
            last_updated: '2 hours ago',
            usage_today: 37
          },
          {
            id: 'unit_hypermart_b',
            name: 'Hypermart B',
            manager_name: 'Jane Smith',
            status: 'active',
            last_updated: '1 day ago',
            usage_today: 29
          },
          {
            id: 'unit_hypermart_c',
            name: 'Hypermart C',
            manager_name: 'Emily Chen',
            status: 'active',
            last_updated: '5 hours ago',
            usage_today: 45
          }
        ];
        
        setUnits(mockUnits);
        setIsLoadingUnits(false);
      } catch (error) {
        console.error('Error fetching units:', error);
        setIsLoadingUnits(false);
      }
    };
    
    if (user) {
      fetchUnits();
    }
  }, [user]);
  
  if (isLoading || isLoadingUnits) {
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
          value={units.length} 
          trend={{ value: "+1", label: "from last month" }}
          icon={<ImageIcon className="h-5 w-5 text-blue-600" />}
        />
        <StatCard 
          title="Active Units" 
          value={units.filter(u => u.status === 'active').length} 
          trend={{ value: "100%", label: "operational rate" }}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        />
        <StatCard 
          title="Total Users" 
          value={8} 
          trend={{ value: "+2", label: "new this week" }}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
        />
        <StatCard 
          title="Total Sessions" 
          value="1,293" 
          trend={{ value: "+12%", label: "from last week" }}
          icon={<BarChart2 className="h-5 w-5 text-purple-600" />}
        />
      </div>

      {/* Units Overview */}
      <div className="mb-8">
        <UnitsTable units={units} isLoading={isLoadingUnits} />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions />
      </div>
    </div>
  );
}