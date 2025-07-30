// components/users/user-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserRoleSelect from './user-role-select';
import { UserMinimal } from '@/types/user.types';

// Form validation schema
const userFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['admin', 'store_manager']),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: Partial<UserMinimal>;
  onSubmit: (data: UserFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export default function UserForm({ 
  initialData, 
  onSubmit, 
  isSubmitting = false 
}: UserFormProps) {
  const isEditMode = !!initialData?.id;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: initialData?.email || '',
      password: '',
      role: initialData?.role || 'store_manager',
    },
  });

  const selectedRole = watch('role');

  // Handle form submission
  const handleFormSubmit = async (data: UserFormValues) => {
    // In edit mode, if password is empty, remove it from the data
    if (isEditMode && !data.password) {
      const { password, ...restData } = data;
      await onSubmit(restData as UserFormValues);
    } else {
      await onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-gray-700"
        >
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="Enter email address"
          {...register('email')}
          className={errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label 
          htmlFor="password" 
          className="block text-sm font-medium text-gray-700"
        >
          {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
        </label>
        <Input
          id="password"
          type="password"
          placeholder={isEditMode ? 'Enter new password (optional)' : 'Enter password'}
          {...register('password')}
          className={errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label 
          htmlFor="role" 
          className="block text-sm font-medium text-gray-700"
        >
          User Role
        </label>
        <UserRoleSelect 
          value={selectedRole} 
          onChange={(value) => setValue('role', value as 'admin' | 'store_manager')}
        />
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset({
            email: initialData?.email || '',
            password: '',
            role: initialData?.role || 'store_manager',
          })}
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
              {isEditMode ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditMode ? 'Update User' : 'Create User'
          )}
        </Button>
      </div>
    </form>
  );
}