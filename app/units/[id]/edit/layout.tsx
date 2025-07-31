'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/layout/breadcrumb';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';

export default function EditUnitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { isLoading: isAuthLoading, canAccessUnit } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  
  const unitId = params.id as string;

  // Check if user has access to this unit
  useEffect(() => {
    if (!isAuthLoading) {
      const checkAccess = async () => {
        const access = await canAccessUnit(unitId);
        setHasAccess(access);
        setIsCheckingAccess(false);
        
        if (!access) {
          // Redirect if no access
          router.push('/dashboard');
        }
      };
      
      checkAccess();
    }
  }, [unitId, canAccessUnit, isAuthLoading, router]);

  // Show loading state while checking
  if (isAuthLoading || isCheckingAccess) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-gray-300 rounded-full border-t-indigo-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  // Show not found or no access message
  if (!hasAccess) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
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
            You don't have permission to edit this unit. Please contact an administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <Breadcrumb extraItems={[
        { label: 'Unit Details', href: `/units/${unitId}` },
        { label: 'Edit Unit' }
      ]} />
      
      <Button 
        variant="outline" 
        onClick={() => router.push(`/units/${unitId}`)}
        className="flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        <span>Back to Unit</span>
      </Button>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6">Edit Unit</h1>
        {children}
      </div>
    </div>
  );
}