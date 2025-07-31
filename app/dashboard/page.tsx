'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
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

// Loading component
function DashboardLoading() {
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

export default function DashboardPage() {
  const { user, profile, isLoading } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  
  useEffect(() => {
    const fetchUnits = async () => {
      if (!user || !profile) return;
      
      try {
        console.log('Fetching units for user:', user.id, 'role:', profile.role);
        
        // Build query based on user role
        let query = supabase
          .from('units')
          .select(`
            id,
            name,
            assigned_manager_id,
            created_at,
            updated_at
          `);

        // For non-admin users, only show units they manage
        if (profile.role !== 'admin') {
          query = query.eq('assigned_manager_id', user.id);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching units:', error);
          return;
        }
        
        console.log('Units fetched:', data);
        
        // Transform data to include mock status and usage
        const transformedUnits: Unit[] = data.map(unit => ({
          id: unit.id,
          name: unit.name,
          manager_name: 'Store Manager', // Will be replaced with actual data
          status: 'active' as const,
          last_updated: new Date(unit.updated_at).toLocaleDateString(),
          usage_today: Math.floor(Math.random() * 50) // Mock data
        }));
        
        setUnits(transformedUnits);
      } catch (error) {
        console.error('Error in fetchUnits:', error);
      } finally {
        setIsLoadingUnits(false);
      }
    };
    
    if (user && profile) {
      fetchUnits();
    } else if (!isLoading) {
      setIsLoadingUnits(false);
    }
  }, [user, profile, isLoading]);
  
  // Show loading while auth is being determined
  if (isLoading) {
    return <DashboardLoading />;
  }
  
  // Show loading while units are being fetched
  if (isLoadingUnits) {
    return <DashboardLoading />;
  }
  
  // If no user or profile, the AuthProvider will handle redirect
  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {profile.email}</p>
      </div>
      
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
          value={profile.role === 'admin' ? 8 : 1} 
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
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-lg">Your Units</h2>
          <span className="text-sm text-gray-500">
            {units.length} {units.length === 1 ? 'unit' : 'units'}
          </span>
        </div>
        
        {units.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No units assigned</h3>
            <p>Contact your administrator to get assigned to units.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Unit Name</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={12} className="mr-1" />
                        Active
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
                        onClick={() => window.location.href = `/units/${unit.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}