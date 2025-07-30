'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { BarChart2, CheckCircle, Image as ImageIcon, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    label: string;
  };
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="mt-1 text-sm text-gray-500">
              <span className="font-medium text-green-600">{trend.value}</span> {trend.label}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

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
        // Temporarily using mock data since your 'units' table doesn't have these columns yet
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
        
        // When your database has the proper columns, use this:
        /*
        const { data, error } = await supabase
          .from('units')
          .select('id, name, manager_name, status, last_updated, usage_today');
          
        if (error) throw error;
        setUnits(data as Unit[]);
        */
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
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
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-lg">Units Overview</h2>
          <button 
            onClick={() => router.push('/units')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Unit Name</th>
                <th className="px-6 py-3">Manager</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Usage Today</th>
                <th className="px-6 py-3">Last Updated</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{unit.name}</div>
                    <div className="text-xs text-gray-500">{unit.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{unit.manager_name || 'Unassigned'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        unit.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {unit.status === 'active' ? (
                        <>
                          <CheckCircle size={12} className="mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 bg-red-400 rounded-full mr-1"></span>
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="mr-2 font-medium">{unit.usage_today || 0}</div>
                      {(unit.usage_today || 0) > 0 && (
                        <div className="text-xs text-gray-500">sessions</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {unit.last_updated || 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => router.push(`/units/${unit.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No units found. Create your first unit to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}