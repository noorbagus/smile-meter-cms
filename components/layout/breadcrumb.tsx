'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  active: boolean;
}

interface BreadcrumbProps {
  extraItems?: { label: string; href?: string }[];
  homeLabel?: string;
}

export default function Breadcrumb({ extraItems = [], homeLabel = 'Dashboard' }: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (!pathname) return [];
    
    // Remove trailing slash and split path segments
    const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
    
    // Start with home
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: homeLabel,
        href: '/dashboard',
        active: segments.length === 1 && segments[0] === 'dashboard'
      }
    ];
    
    // Build the rest of the breadcrumbs
    let currPath = '';
    segments.forEach((segment, i) => {
      if (segment === 'dashboard') return; // Skip dashboard in the path
      
      currPath += `/${segment}`;
      
      // Format label (convert kebab-case to title case)
      const rawLabel = segment.includes('-') 
        ? segment.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
        : segment.charAt(0).toUpperCase() + segment.slice(1);
        
      // Check if it's a dynamic route parameter
      const isId = segment.match(/^\[.*\]$/);
      let label = isId ? 'Details' : rawLabel;
      
      // If it's the ID segment and we have extra items, use the first extra item
      if (isId && extraItems.length > 0) {
        label = extraItems.shift()?.label || 'Details';
      }
      
      breadcrumbs.push({
        label,
        href: currPath,
        active: i === segments.length - 1
      });
    });
    
    // Add any remaining extra items
    extraItems.forEach((item, i) => {
      breadcrumbs.push({
        label: item.label,
        href: item.href || '#',
        active: i === extraItems.length - 1
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on the home page
  }
  
  return (
    <nav className="flex items-center text-sm font-medium text-gray-500 mb-4">
      <Link 
        href="/dashboard" 
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home size={16} className="mr-1" />
        <span className="sr-only sm:not-sr-only">{homeLabel}</span>
      </Link>
      
      {breadcrumbs.slice(1).map((item, i) => (
        <div key={i} className="flex items-center">
          <ChevronRight size={14} className="mx-2 text-gray-400" />
          {item.active ? (
            <span className="text-gray-900">{item.label}</span>
          ) : (
            <Link 
              href={item.href} 
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}