'use client';

import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export default function Loading({
  size = 'md',
  fullScreen = false,
  text,
  className,
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-gray-50/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col'
    : 'flex items-center justify-center flex-col';

  return (
    <div className={cn(containerClasses, className)}>
      <div
        className={cn(
          'border-gray-300 rounded-full border-t-indigo-600 animate-spin',
          sizeClasses[size]
        )}
      />
      {text && <p className="mt-4 text-gray-600 text-sm">{text}</p>}
    </div>
  );
}

export function TableRowSkeleton({ cols = 5, className }: { cols?: number; className?: string }) {
  return (
    <tr className={cn("animate-pulse", className)}>
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-6 animate-pulse", className)}>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("space-y-6 animate-pulse", className)}>
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="h-10 bg-gray-200 rounded w-1/3 mt-8"></div>
    </div>
  );
}