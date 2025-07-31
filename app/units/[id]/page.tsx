'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUnits } from '@/hooks/use-units';
import { useToast } from '@/hooks/use-toast';
import UnitForm from '@/components/units/unit-form';
import { UpdateUnitPayload } from '@/types/unit.types';
import { Loader2 } from 'lucide-react';

export default function EditUnitPage() {
  const params = useParams();
  const router = useRouter();
  const { getUnit, updateUnit, error, isLoading } = useUnits();
  const { success, error: showError } = useToast();
  const [unit, setUnit] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  const unitId = params.id as string;

  // Load unit data
  useEffect(() => {
    const loadUnit = async () => {
      try {
        const unitData = await getUnit(unitId);
        if (!unitData) {
          setLoadingError('Unit not found');
          return;
        }
        setUnit(unitData);
      } catch (err: any) {
        setLoadingError(err.message || 'Failed to load unit');
      }
    };
    
    loadUnit();
  }, [unitId, getUnit]);

  // Handle form submission
  const handleSubmit = async (data: UpdateUnitPayload) => {
    setIsSubmitting(true);
    try {
      const updated = await updateUnit(unitId, data);
      if (updated) {
        success({ 
          title: 'Unit updated', 
          description: 'Unit has been successfully updated' 
        });
        // Redirect back to unit detail page
        router.push(`/units/${unitId}`);
      } else {
        showError({ 
          title: 'Update failed', 
          description: error || 'Failed to update unit' 
        });
      }
    } catch (err: any) {
      showError({ 
        title: 'Update failed', 
        description: err.message || 'An error occurred while updating the unit' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading || !unit) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading unit data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadingError) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <h2 className="text-lg font-medium text-red-800 mb-2">Error</h2>
        <p className="text-red-700">{loadingError}</p>
      </div>
    );
  }

  // Return the form with unit data
  return (
    <UnitForm
      initialData={{
        id: unit.id,
        name: unit.name,
        assigned_manager_id: unit.assigned_manager_id
      }}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}