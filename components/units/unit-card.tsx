'use client';

import { useRouter } from 'next/navigation';
import { Clock, Image as ImageIcon, BarChart, CheckCircle, AlertCircle } from 'lucide-react';
import { UnitListItem } from '@/types/unit.types';
import { Button } from '@/components/ui/button';

interface UnitCardProps {
  unit: UnitListItem;
}

export default function UnitCard({ unit }: UnitCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{unit.name}</h3>
            <p className="text-sm text-gray-500">{unit.id}</p>
          </div>
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
                <AlertCircle size={12} className="mr-1" />
                Inactive
              </>
            )}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <div className="w-5 h-5 mr-2 text-gray-400">
              <ImageIcon size={16} />
            </div>
            <span>Manager: {unit.manager_name || 'Unassigned'}</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-5 h-5 mr-2 text-gray-400">
              <BarChart size={16} />
            </div>
            <span>Today: {unit.usage_today || 0} sessions</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-5 h-5 mr-2 text-gray-400">
              <Clock size={16} />
            </div>
            <span>Updated: {unit.last_updated ? new Date(unit.last_updated).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => router.push(`/units/${unit.id}`)}
          >
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
}