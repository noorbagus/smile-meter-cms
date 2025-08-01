// app/units/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import UnitDetail from '@/components/units/unit-detail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const unitId = params.id as string;

  // AuthProvider + ClientLayout sudah handle basic auth
  // Hanya perlu basic user check, bukan access control
  if (!user) return null;

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