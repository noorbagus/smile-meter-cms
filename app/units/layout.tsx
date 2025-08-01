// app/units/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import Breadcrumb from '@/components/layout/breadcrumb';

export default function UnitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isUnitDetail = pathname?.includes('/units/') && pathname !== '/units';

  // AuthProvider + ClientLayout sudah handle auth protection
  // Layout ini hanya untuk UI structure dan breadcrumb
  
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