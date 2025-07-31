// components/layout/Layout.tsx
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Users, 
  Calendar, 
  BarChart2, 
  LogOut, 
  Bell, 
  ChevronDown, 
  Menu, 
  X
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon, label, href, active }: SidebarItemProps) {
  return (
    <Link 
      href={href}
      className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-600' 
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

export default function Layout({ children }: LayoutProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();

  if (!user || !profile) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile menu */}
      <div className={`${showMobileMenu ? 'block' : 'hidden'} fixed inset-0 z-40 lg:hidden`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setShowMobileMenu(false)}></div>
        
        <div className="fixed inset-y-0 left-0 flex flex-col z-40 w-64 bg-white shadow-lg">
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                SM
              </div>
              <span className="font-semibold text-lg">Smile Meter</span>
            </div>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowMobileMenu(false)}
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              href="/" 
              active={router.pathname === '/'} 
            />
            <SidebarItem 
              icon={<ImageIcon size={20} />} 
              label="Unit Management" 
              href="/units" 
              active={router.pathname.startsWith('/units')} 
            />
            {isAdmin && (
              <SidebarItem 
                icon={<Users size={20} />} 
                label="User Management" 
                href="/users" 
                active={router.pathname.startsWith('/users')} 
              />
            )}
            <SidebarItem 
              icon={<Calendar size={20} />} 
              label="Schedule Images" 
              href="/schedule" 
              active={router.pathname.startsWith('/schedule')} 
            />
            <SidebarItem 
              icon={<BarChart2 size={20} />} 
              label="Analytics" 
              href="/analytics" 
              active={router.pathname.startsWith('/analytics')} 
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
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-200">
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
            href="/" 
            active={router.pathname === '/'} 
          />
          <SidebarItem 
            icon={<ImageIcon size={20} />} 
            label="Unit Management" 
            href="/units" 
            active={router.pathname.startsWith('/units')} 
          />
          {isAdmin && (
            <SidebarItem 
              icon={<Users size={20} />} 
              label="User Management" 
              href="/users" 
              active={router.pathname.startsWith('/users')} 
            />
          )}
          <SidebarItem 
            icon={<Calendar size={20} />} 
            label="Schedule Images" 
            href="/schedule" 
            active={router.pathname.startsWith('/schedule')} 
          />
          <SidebarItem 
            icon={<BarChart2 size={20} />} 
            label="Analytics" 
            href="/analytics" 
            active={router.pathname.startsWith('/analytics')} 
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold">
              {router.pathname === '/' && 'Dashboard'}
              {router.pathname.startsWith('/units') && 'Unit Management'}
              {router.pathname.startsWith('/users') && 'User Management'}
              {router.pathname.startsWith('/schedule') && 'Schedule Images'}
              {router.pathname.startsWith('/analytics') && 'Analytics'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors relative"
                onClick={() => setShowNotifications(!showNotifications)}
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
            
            <div className="relative">
              <button 
                className="flex items-center gap-2 hover:bg-gray-100 rounded-full py-1 pl-1 pr-2 transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : <Users size={18} className="text-gray-600" />}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {profile.name || profile.email}
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}