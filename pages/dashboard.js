// pages/dashboard.js - Fixed version
import { useState } from 'react';
import { Package, Users, BarChart3 } from 'lucide-react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { supabase } from '../lib/supabase';
import Overview from '../components/dashboard/overview';
import StockManagement from '../components/dashboard/stock-management';
import UserManagement from '../components/dashboard/user-management';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUnit, setSelectedUnit] = useState(null);
  
  // Use auth guard with admin role requirement
  const { user, profile, loading } = useAuthGuard('admin');

  const handleUnitSelect = (unitId) => {
    setSelectedUnit(unitId);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force redirect after logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even on error
      window.location.href = '/login';
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a93ce] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-[#2a93ce] rounded flex items-center justify-center text-white font-bold">
                SM
              </div>
              <h1 className="text-xl font-semibold text-gray-900">HPM Stock Manager</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.full_name}</span>
              <button 
                onClick={handleLogout}
                className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-[#2a93ce] text-[#2a93ce]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="inline w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stock'
                  ? 'border-[#2a93ce] text-[#2a93ce]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="inline w-4 h-4 mr-2" />
              Stock Management
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-[#2a93ce] text-[#2a93ce]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="inline w-4 h-4 mr-2" />
              User Management
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <Overview 
            onUnitSelect={handleUnitSelect}
            onTabChange={handleTabChange}
          />
        )}

        {activeTab === 'stock' && (
          <StockManagement user={user} />
        )}

        {activeTab === 'users' && (
          <UserManagement user={user} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;