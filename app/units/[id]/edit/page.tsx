'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useUnits } from '@/hooks/use-units';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import UnitForm from '@/components/units/unit-form';
import { Unit, UpdateUnitPayload } from '@/types/unit.types';
import { useToast } from '@/hooks/use-toast';

export default function EditUnitPage() {
  const params = useParams();
  const router = useRouter();
  const { getUnit, updateUnit, isLoading } = useUnits();
  const { isAdmin, canAccessUnit } = useAuth();
  const { success, error: showError } = useToast();
  
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  const unitId = params.id as string;

  useEffect(() => {
    const loadUnit = async () => {
      if (!unitId) return;
      
      try {
        // Check access
        if (!canAccessUnit(unitId)) {
          setLoadingError('You do not have permission to edit this unit');
          return;
        }

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
  }, [unitId, getUnit, canAccessUnit]);

  const handleSubmit = async (data: UpdateUnitPayload) => {
    if (!unit) return;
    
    setIsSubmitting(true);
    
    try {
      const updatedUnit = await updateUnit(unit.id, data);
      
      if (updatedUnit) {
        success({
          title: 'Unit updated',
          description: 'Unit has been updated successfully'
        });
        router.push(`/units/${unit.id}`);
      } else {
        showError({
          title: 'Update failed',
          description: 'Failed to update unit'
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

  const handleCancel = () => {
    router.push(`/units/${unitId}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading unit...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/units')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Units
          </Button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-red-800 mb-2">Unable to load unit</h2>
          <p className="text-red-700">{loadingError}</p>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/units')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Units
          </Button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">Unit not found</h2>
          <p className="text-yellow-700">The requested unit could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/units/${unitId}`)}
          className="flex items-center gap-2 mb-4"
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} />
          Back to Unit
        </Button>
        
        <div>
          <h1 className="text-2xl font-semibold">Edit Unit</h1>
          <p className="text-gray-600 mt-1">Update unit information and settings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <UnitForm
          initialData={{
            name: unit.name,
            assigned_manager_id: unit.assigned_manager_id
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
        
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="unit-form"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save size={16} />
                Update Unit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}