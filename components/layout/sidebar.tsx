// components/layout/sidebar.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Users, 
  Calendar, 
  BarChart2, 
  LogOut
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, href, active, onClick }: SidebarItemProps) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-600 border-blue-200' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className={`mr-3 ${active ? 'text-blue-600' : ''}`}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar({ isMobileMenuOpen, onCloseMobileMenu }: SidebarProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const pathname = usePathname();

  if (!user || !profile) {
    return null;
  }

  // Determine which menu item is active
  const isActive = (path: string) => {
    if (path === '/' || path === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  // Sidebar content (shared between mobile and desktop)
  const sidebarContent = (
    <>
      <div className="flex h-16 items-center px-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            SM
          </div>
          <span className="font-semibold text-lg">Smile Meter</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <SidebarItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          href="/dashboard" 
          active={isActive('/dashboard')} 
          onClick={onCloseMobileMenu}
        />
        <SidebarItem 
          icon={<ImageIcon size={20} />} 
          label="Unit Management" 
          href="/units" 
          active={isActive('/units')} 
          onClick={onCloseMobileMenu}
        />
        {isAdmin && (
          <SidebarItem 
            icon={<Users size={20} />} 
            label="User Management" 
            href="/users" 
            active={isActive('/users')} 
            onClick={onCloseMobileMenu}
          />
        )}
        <SidebarItem 
          icon={<Calendar size={20} />} 
          label="Schedule Images" 
          href="/schedule" 
          active={isActive('/schedule')} 
          onClick={onCloseMobileMenu}
        />
        <SidebarItem 
          icon={<BarChart2 size={20} />} 
          label="Analytics" 
          href="/analytics" 
          active={isActive('/analytics')} 
          onClick={onCloseMobileMenu}
        />
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={() => signOut()}
          className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  // Mobile sidebar (slide-in)
  const mobileSidebar = isMobileMenuOpen && (
    <div className="lg:hidden fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
        onClick={onCloseMobileMenu}
      ></div>
      
      {/* Sidebar panel */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
        {sidebarContent}
      </div>
    </div>
  );

  // Desktop sidebar (always visible)
  const desktopSidebar = (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
          {sidebarContent}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileSidebar}
      {desktopSidebar}
    </>
  );
}