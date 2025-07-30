'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className = '' 
}: StatCardProps) {
  return (
    <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="mt-1 text-sm text-gray-500">
              <span className={`font-medium ${trend.positive !== false ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value}
              </span> {trend.label}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}