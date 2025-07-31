'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnitForm from '@/components/units/unit-form';
import { useUnits } from '@/hooks/use-units';
import { useRequireAdmin } from '@/hooks/use-auth';
import { CreateUnitPayload, UpdateUnitPayload } from '@/types/unit.types';

export default function CreateUnitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createUnit } = useUnits();
  const { isLoading } = useRequireAdmin();
  const router = useRouter();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-gray-300 rounded-full border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

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