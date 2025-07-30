'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { UserMinimal } from '@/types/user.types';
import { CreateUnitPayload, UpdateUnitPayload } from '@/types/unit.types';
import { useUsers } from '@/hooks/use-users';
import { useAuth } from '@/hooks/use-auth';

// Form validation schema
const unitFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  assigned_manager_id: z.string().optional(),
});

type UnitFormValues = z.infer<typeof unitFormSchema>;

interface UnitFormProps {
  initialData?: {
    id?: string;
    name: string;
    assigned_manager_id?: string | null;
  };
  onSubmit: (data: CreateUnitPayload | UpdateUnitPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export default function UnitForm({ 
  initialData, 
  onSubmit, 
  isSubmitting = false 
}: UnitFormProps) {
  const [storeManagers, setStoreManagers] = useState<UserMinimal[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);
  const { isAdmin } = useAuth();
  const { getUsers } = useUsers();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      assigned_manager_id: initialData?.assigned_manager_id || '',
    },
  });

  // Load store managers for admin users
  useEffect(() => {
    if (isAdmin) {
      const fetchStoreManagers = async () => {
        setIsLoadingManagers(true);
        try {
          const users = await getUsers({ role: 'store_manager' });
          setStoreManagers(users || []);
        } catch (error) {
          console.error('Error fetching store managers:', error);
        } finally {
          setIsLoadingManagers(false);
        }
      };
      
      fetchStoreManagers();
    }
  }, [isAdmin, getUsers]);

  // Handle form submission
  const handleFormSubmit = async (data: UnitFormValues) => {
    await onSubmit({
      name: data.name,
      assigned_manager_id: data.assigned_manager_id || null,
    });
  };

  // Reset form with initial data
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        assigned_manager_id: initialData.assigned_manager_id || '',
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label 
          htmlFor="name" 
          className="block text-sm font-medium text-gray-700"
        >
          Unit Name
        </label>
        <Input
          id="name"
          placeholder="Enter unit name"
          {...register('name')}
          className={errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {isAdmin && (
        <div className="space-y-2">
          <label 
            htmlFor="assigned_manager_id" 
            className="block text-sm font-medium text-gray-700"
          >
            Assigned Manager
          </label>
          <div className="relative">
            <select
              id="assigned_manager_id"
              {...register('assigned_manager_id')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoadingManagers}
            >
              <option value="">None</option>
              {storeManagers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.email}
                </option>
              ))}
            </select>
            {isLoadingManagers && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData?.id ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            initialData?.id ? 'Update Unit' : 'Create Unit'
          )}
        </Button>
      </div>
    </form>
  );
}