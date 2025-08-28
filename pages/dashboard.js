// pages/dashboard.js - Complete refactored version
import { useState, useEffect } from 'react';
import { Package, Users, BarChart3, Settings } from 'lucide-react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { supabase } from '../lib/supabase';
import Overview from '../components/dashboard/overview';
import StockTable from '../components/dashboard/stock-table';
import UserManagement from '../components/dashboard/user-management';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [units, setUnits] = useState([]);
  
  // Use auth guard with admin role requirement
  const { user, profile, loading } = useAuthGuard('admin');

  // Load units on component mount
  useEffect(() => {
    if (user && profile) {
      loadUnits();
    }
  }, [user, profile]);

  const loadUnits = async () => {
    try {
      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      setUnits(unitsData || []);
      
      // Set first unit as default if none selected
      if (unitsData?.length > 0 && !selectedUnit) {
        setSelectedUnit(unitsData[0].id);
      }
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };
  const formatUnitName = (unitName) => {
    return unitName
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const handleUnitSelect = (unitId) => {
    console.log('🎯 Unit selected:', unitId);
    setSelectedUnit(unitId);
  };

  const handleTabChange = (tab) => {
    console.log('📋 Tab changed to:', tab);
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Admin logout initiated');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
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
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
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
              onClick={() => handleTabChange('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#2a93ce] text-[#2a93ce]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => handleTabChange('stock')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stock'
                  ? 'border-[#2a93ce] text-[#2a93ce]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="inline w-4 h-4 mr-2" />
              Stock Management
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-[#2a93ce] text-[#2a93ce]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            selectedUnit={selectedUnit}
          />
        )}

        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Stock Management {selectedUnit && `${units.find(u => u.id === selectedUnit)?.name}`}</h2>
                <p className="text-gray-600">Manage product inventory across units</p>
                {selectedUnit && (
                  <p className="text-sm text-blue-600 mt-1">
                  
                  </p>
                )}
              </div>
            </div>
            <StockTable 
              selectedUnit={selectedUnit} 
              user={user} 
              units={units}
              onUnitChange={setSelectedUnit}
            />
          </div>
        )}

        {activeTab === 'users' && (
          <UserManagement user={user} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;