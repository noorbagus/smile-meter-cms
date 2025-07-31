'use client';

import { BarChart2, TrendingUp, Users, Target, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
  const mockStats = [
    { title: 'Total Sessions', value: '12,847', trend: '+12%', icon: <BarChart2 className="h-5 w-5 text-blue-600" /> },
    { title: 'Avg Smile Score', value: '78%', trend: '+5%', icon: <Target className="h-5 w-5 text-green-600" /> },
    { title: 'Active Units', value: '24', trend: '+2', icon: <Users className="h-5 w-5 text-purple-600" /> },
    { title: 'Success Rate', value: '85%', trend: '+3%', icon: <TrendingUp className="h-5 w-5 text-orange-600" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-gray-600 mt-1">Performance metrics and insights</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          Export Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-green-600">{stat.trend} from last week</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Usage Trends</h3>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart2 className="mx-auto h-12 w-12 mb-2" />
              <p>Chart placeholder</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Reward Distribution</h3>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Target className="mx-auto h-12 w-12 mb-2" />
              <p>Pie chart placeholder</p>
            </div>
          </div>
        </div>
      </div>

      {/* Units Performance */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Unit Performance</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <Calendar className="mx-auto h-12 w-12 mb-2" />
            <p>Unit performance table coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}