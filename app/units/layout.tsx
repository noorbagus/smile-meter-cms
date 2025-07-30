'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/hooks/use-auth';
import Breadcrumb from '@/components/layout/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePathname } from 'next/navigation';

export default function UnitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useRequireAuth();
  const pathname = usePathname();
  const isUnitDetail = pathname !== '/units';

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-gray-100 p-6 rounded-xl h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <Breadcrumb extraItems={isUnitDetail ? [{ label: 'Unit Details' }] : []} />
      
      {/* Section Title */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        {isUnitDetail ? 'Unit Details' : 'Unit Management'}
      </h1>

      {children}
    </div>
  );
}