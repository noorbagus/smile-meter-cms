// components/layout/app-shell.tsx
'use client';

import { useState, ReactNode } from 'react';
import Header from './header';
import Sidebar from './sidebar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // AuthProvider + ClientLayout sudah handle auth check
  // AppShell hanya untuk UI layout structure
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}