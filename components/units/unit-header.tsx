'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, User, CheckCircle, AlertCircle, BarChart2, Clock } from 'lucide-react';
import { UnitWithImages, UnitStats } from '@/types/unit.types';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/dashboard-utils';

interface UnitHeaderProps {
  unit: UnitWithImages;
  stats?: UnitStats | null;
}

export default function UnitHeader({ unit, stats }: UnitHeaderProps) {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const router = useRouter();

  const getStatusBadge = () => {
    const status = unit.status || 'active';
    
    return (
      <div 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}
      >
        {status === 'active' ? (
          <>
            <CheckCircle size={12} className="mr-1" />
            Active
          </>
        ) : (
          <>
            <AlertCircle size={12} className="mr-1" />
            Inactive
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{unit.name}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-500">ID: {unit.id}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/units/${unit.id}/edit`)}
            className="flex items-center gap-1"
          >
            <Edit size={16} />
            <span>Edit</span>
          </Button>
          
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex items-center gap-1"
            onClick={() => setIsConfirmDeleteOpen(true)}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </Button>
        </div>
      </div>
      
      {/* Unit Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-50 p-2 rounded-full">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Manager</p>
            <p className="font-medium">{unit.manager?.email || 'Unassigned'}</p>
          </div>
        </div>
        
        {stats && (
          <>
            <div className="flex items-center space-x-3">
              <div className="bg-green-50 p-2 rounded-full">
                <BarChart2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sessions</p>
                <p className="font-medium">{stats.totalSessions.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-purple-50 p-2 rounded-full">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Activity</p>
                <p className="font-medium">
                  {stats.lastActivity ? formatRelativeTime(stats.lastActivity) : 'No activity yet'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Confirmation dialog */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Delete Unit</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this unit? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  // Handle delete action
                  setIsConfirmDeleteOpen(false);
                  // Redirect to units list after deletion
                  router.push('/units');
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}