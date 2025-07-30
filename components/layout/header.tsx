// components/layout/header.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  ChevronDown, 
  Menu, 
  Users
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

  // Get current page title based on path
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/units')) return 'Unit Management';
    if (pathname.startsWith('/users')) return 'User Management';
    if (pathname.startsWith('/schedule')) return 'Schedule Images';
    if (pathname.startsWith('/analytics')) return 'Analytics';
    return '';
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <header className="h-16 bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center">
        <button 
          className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
          onClick={onMobileMenuToggle}
          aria-label="Toggle mobile menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications dropdown */}
        <div className="relative">
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors relative"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-medium">Notifications</h3>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                <div className="text-center text-sm text-gray-500 py-4">
                  No new notifications
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* User menu dropdown */}
        <div className="relative">
          <button 
            className="flex items-center gap-2 hover:bg-gray-100 rounded-full py-1 pl-1 pr-2 transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
          >
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              {profile.email ? profile.email.charAt(0).toUpperCase() : <Users size={18} className="text-gray-600" />}
            </div>
            <span className="text-sm font-medium hidden sm:block">
              {profile.email}
            </span>
            <ChevronDown size={16} className="text-gray-500 hidden sm:block" />
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 text-sm font-medium border-b border-gray-200">
                  {profile.role === 'admin' ? 'Administrator' : 'Store Manager'}
                </div>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors">
                  Profile
                </button>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors">
                  Settings
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button 
                  onClick={() => signOut()}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}