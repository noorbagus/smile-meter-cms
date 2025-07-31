// File: app/units/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import UnitDetail from '@/components/units/unit-detail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { canAccessUnit } = useAuth();
  
  const unitId = params.id as string;
  const hasAccess = canAccessUnit(unitId);

  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/units')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>Back to Units</span>
        </Button>
        
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">
            You don't have permission to view this unit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        onClick={() => router.push('/units')}
        className="flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        <span>Back to Units</span>
      </Button>
      
      <UnitDetail unitId={unitId} />
    </div>
  );
}