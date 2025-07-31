// app/test-dashboard/page.tsx - TANPA AUTH
'use client';

import { BarChart2, CheckCircle, Image as ImageIcon, Users } from 'lucide-react';

function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
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

export default function TestDashboard() {
  const mockUnits = [
    {
      id: 'unit_hypermart_a',
      name: 'Hypermart A',
      status: 'active',
      usage_today: 37,
      last_updated: '2 hours ago'
    },
    {
      id: 'unit_hypermart_b',
      name: 'Hypermart B', 
      status: 'active',
      usage_today: 29,
      last_updated: '1 day ago'
    },
    {
      id: 'unit_hypermart_c',
      name: 'Hypermart C',
      status: 'active', 
      usage_today: 45,
      last_updated: '5 hours ago'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              SM
            </div>
            <h1 className="text-xl font-semibold">Test Dashboard (No Auth)</h1>
          </div>
          <div className="text-sm text-gray-500">
            Testing UI Components
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Units" 
            value={mockUnits.length} 
            trend={{ value: "+1", label: "from last month" }}
            icon={<ImageIcon className="h-5 w-5 text-blue-600" />}
          />
          <StatCard 
            title="Active Units" 
            value={mockUnits.filter(u => u.status === 'active').length} 
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

        {/* Units Table */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-lg">Units Overview</h2>
            <span className="text-sm text-gray-500">{mockUnits.length} units</span>
          </div>
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
                {mockUnits.map((unit) => (
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
                        <div className="mr-2 font-medium">{unit.usage_today}</div>
                        <div className="text-xs text-gray-500">sessions</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {unit.last_updated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Debug Info</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>✅ This page bypasses authentication</li>
            <li>✅ UI components are working</li>
            <li>✅ Tailwind CSS is loaded</li>
            <li>✅ Icons are rendering</li>
            <li>📍 Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}