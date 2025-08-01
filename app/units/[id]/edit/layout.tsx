// app/units/[id]/edit/layout.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/layout/breadcrumb';

export default function EditUnitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const unitId = params?.id as string;

  // AuthProvider + ClientLayout sudah handle auth protection
  // Access control akan dihandle di component level, bukan layout level
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <Breadcrumb extraItems={[
        { label: 'Unit Details', href: `/units/${unitId}` },
        { label: 'Edit Unit' }
      ]} />
      
      <Link href={`/units/${unitId}`}>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>Back to Unit</span>
        </Button>
      </Link>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6">Edit Unit</h1>
        {children}
      </div>
    </div>
  );
}