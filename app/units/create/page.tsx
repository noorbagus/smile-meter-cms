// app/units/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnitForm from '@/components/units/unit-form';
import { useUnits } from '@/hooks/use-units';
import { useAuth } from '@/hooks/use-auth';
import { CreateUnitPayload, UpdateUnitPayload } from '@/types/unit.types';

export default function CreateUnitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createUnit } = useUnits();
  const { user, isAdmin } = useAuth(); // Use centralized auth
  const router = useRouter();

  // AuthProvider + ClientLayout already handles basic auth
  // Just check admin access here
  if (!user) return null;
  
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/units')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Units
          </Button>
          <h1 className="text-2xl font-semibold">Create New Unit</h1>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">Access Restricted</h2>
          <p className="text-yellow-700">
            You need administrator privileges to create new units.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: CreateUnitPayload | UpdateUnitPayload) => {
    setIsSubmitting(true);
    try {
      const newUnit = await createUnit(data as CreateUnitPayload);
      if (newUnit) {
        router.push(`/units/${newUnit.id}`);
      }
    } catch (error) {
      console.error('Error creating unit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/units')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Units
        </Button>
        <h1 className="text-2xl font-semibold">Create New Unit</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <UnitForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}