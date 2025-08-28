// pages/dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [units, setUnits] = useState([]);
  const [products, setProducts] = useState([]);
  const [unitStock, setUnitStock] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/cs-dashboard');
      return;
    }

    setUser(user);
    setProfile(profile);
    loadData();
  };

  const loadData = async () => {
    try {
      // Load units
      const { data: unitsData } = await supabase
        .from('units')
        .select(`
          id, name, location, assigned_cs_id,
          user_profiles(full_name)
        `);

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Load unit stock
      const { data: stockData } = await supabase
        .from('unit_stock')
        .select('unit_id, product_id, quantity');

      // Process stock data
      const stockByUnit = {};
      stockData?.forEach(item => {
        if (!stockByUnit[item.unit_id]) stockByUnit[item.unit_id] = {};
        stockByUnit[item.unit_id][item.product_id] = item.quantity;
      });

      setUnits(unitsData || []);
      setProducts(productsData || []);
      setUnitStock(stockByUnit);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnitStats = (unitId) => {
    const stock = unitStock[unitId] || {};
    const totalStock = Object.values(stock).reduce((sum, qty) => sum + qty, 0);
    const emptyProducts = products.filter(p => !stock[p.id] || stock[p.id] === 0).length;
    const criticalProducts = products.filter(p => stock[p.id] > 0 && stock[p.id] <= 5).length;
    const availableProducts = products.filter(p => stock[p.id] > 5).length;
    
    return { totalStock, emptyProducts, criticalProducts, availableProducts };
  };

  const getUnitStatus = (unitId) => {
    const stats = getUnitStats(unitId);
    if (stats.totalStock === 0) return 'empty';
    if (stats.totalStock < 5) return 'critical';
    return 'available';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
              <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                SM
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Stock Manager</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.full_name}</span>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
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
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'stock', label: 'Stock Management' },
              { id: 'users', label: 'User Management' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Unit Overview</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {units.map(unit => {
                const stats = getUnitStats(unit.id);
                const status = getUnitStatus(unit.id);
                
                return (
                  <div key={unit.id} className={`bg-white rounded-lg shadow-sm border-2 p-4 ${
                    status === 'empty' ? 'border-red-500' :
                    status === 'critical' ? 'border-yellow-500' : 'border-green-500'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{unit.name}</h3>
                        <p className="text-xs text-gray-500">{unit.location}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="p-2 rounded-lg h-12 flex items-center text-xs bg-gray-50">
                        {unit.user_profiles ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{unit.user_profiles.full_name}</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Active
                            </span>
                          </div>
                        ) : (
                          <span className="text-red-700">No CS assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded-lg border mb-3">
                      <div className="flex justify-between items-center text-xs">
                        <div className="text-center">
                          <div className="font-bold text-gray-900">{stats.totalStock}</div>
                          <div className="text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">{stats.availableProducts}</div>
                          <div className="text-gray-500">OK</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-yellow-600">{stats.criticalProducts}</div>
                          <div className="text-gray-500">Critical</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-red-600">{stats.emptyProducts}</div>
                          <div className="text-gray-500">Empty</div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'empty' ? 'bg-red-100 text-red-800' :
                        status === 'critical' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {status === 'empty' ? 'Hadiah Habis' :
                         status === 'critical' ? 'Hadiah Hampir Habis' : 'Hadiah Tersedia'}
                      </span>
                    </div>

                    <button 
                      onClick={() => setActiveTab('stock')}
                      className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-xs hover:bg-blue-700"
                    >
                      Manage Stock
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Stock Management</h2>
            <p className="text-gray-600">Coming soon - Stock editing interface</p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Coming soon - User management interface</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;