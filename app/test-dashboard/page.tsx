// app/test-dashboard/page.tsx - TESTING ONLY
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
      id: 'unit_1',
      name: 'Test Unit 1',
      status: 'active',
      usage_today: 25,
      last_updated: '2 hours ago'
    },
    {
      id: 'unit_2', 
      name: 'Test Unit 2',
      status: 'active',
      usage_today: 18,
      last_updated: '1 day ago'
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Test Dashboard</h1>
      
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">Units Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Unit Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Usage Today</th>
                <th className="px-6 py-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{unit.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {unit.usage_today} sessions
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {unit.last_updated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}