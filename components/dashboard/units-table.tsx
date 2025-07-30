'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, Search } from 'lucide-react';
import { useState } from 'react';

interface Unit {
  id: string;
  name: string;
  manager_name?: string;
  status: 'active' | 'inactive';
  last_updated?: string;
  usage_today?: number;
}

interface UnitsTableProps {
  units: Unit[];
  isLoading?: boolean;
}

export default function UnitsTable({ units, isLoading = false }: UnitsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.manager_name && unit.manager_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-lg">Units Overview</h2>
          <div className="animate-pulse bg-gray-200 h-8 w-40 rounded"></div>
        </div>
        <div className="animate-pulse p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="font-semibold text-lg">Units Overview</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search units..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-auto"
          />
        </div>
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
            {filteredUnits.map((unit) => (
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
            
            {filteredUnits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {units.length === 0 
                    ? 'No units found. Create your first unit to get started.' 
                    : 'No units match your search criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}