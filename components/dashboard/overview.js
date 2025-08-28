import React, { useState, useEffect } from 'react';
import { Store, AlertTriangle, Package, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../pages/_app';

const Overview = ({ onUnitSelect, onTabChange }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useAuth();

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      // Fetch units with CS assignments and stock data
      const { data: unitsData } = await supabase
        .from('units')
        .select(`
          id, name, location, is_active,
          user_profiles!units_assigned_cs_id_fkey (
            id, full_name
          )
        `)
        .eq('is_active', true)
        .order('name');

      // Fetch unit stock with products
      const { data: stockData } = await supabase
        .from('unit_stock')
        .select(`
          unit_id, quantity,
          products!inner (
            id, name, is_active
          )
        `)
        .eq('products.is_active', true);

      // Process data for each unit
      const enrichedUnits = (unitsData || []).map(unit => {
        const unitStock = stockData?.filter(s => s.unit_id === unit.id) || [];
        
        const totalStock = unitStock.reduce((sum, item) => sum + item.quantity, 0);
        const emptyProducts = unitStock.filter(item => item.quantity === 0).length;
        const criticalProducts = unitStock.filter(item => item.quantity > 0 && item.quantity <= 5).length;
        const availableProducts = unitStock.filter(item => item.quantity > 5).length;

        return {
          ...unit,
          cs: unit.user_profiles?.full_name || null,
          stats: {
            totalStock,
            totalProducts: unitStock.length,
            emptyProducts,
            criticalProducts,
            availableProducts
          },
          status: getUnitStatus({ totalStock, emptyProducts, criticalProducts })
        };
      });

      setUnits(enrichedUnits);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnitStatus = (stats) => {
    if (stats.totalStock === 0) return 'empty';
    if (stats.totalStock < 5) return 'critical';
    if (stats.emptyProducts >= 2 || stats.criticalProducts >= 2) return 'warning';
    return 'available';
  };

  const getPriorityColor = (status) => {
    switch (status) {
      case 'empty': return 'border-red-500 bg-red-50';
      case 'critical': return 'border-yellow-500 bg-yellow-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const getPriorityBadge = (status) => {
    switch (status) {
      case 'empty': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-yellow-100 text-yellow-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'empty': return 'Hadiah Habis';
      case 'critical': return 'Hadiah Hampir Habis';
      case 'warning': return 'Perlu Perhatian';
      default: return 'Hadiah Tersedia';
    }
  };

  const totalStats = units.reduce((acc, unit) => ({
    totalStock: acc.totalStock + unit.stats.totalStock,
    totalUnits: acc.totalUnits + 1,
    activeUnits: acc.activeUnits + (unit.stats.totalStock > 0 ? 1 : 0),
    criticalUnits: acc.criticalUnits + (['critical', 'warning', 'empty'].includes(unit.status) ? 1 : 0)
  }), { totalStock: 0, totalUnits: 0, activeUnits: 0, criticalUnits: 0 });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Unit Overview</h2>
        <p className="text-gray-600">Monitor stock levels across all HPM units</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalStock}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalUnits}</p>
            </div>
            <Store className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Units</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.activeUnits}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Need Attention</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.criticalUnits}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map(unit => (
          <div 
            key={unit.id} 
            className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all hover:shadow-md ${getPriorityColor(unit.status)}`}
          >
            {/* Unit Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Store className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{unit.name}</h3>
                  <p className="text-xs text-gray-500">ID: {unit.id}</p>
                </div>
              </div>
              
              {(['critical', 'warning', 'empty'].includes(unit.status)) && (
                <AlertTriangle size={14} className={`${
                  unit.status === 'empty' ? 'text-red-600' : 
                  unit.status === 'critical' ? 'text-yellow-600' : 'text-orange-600'
                }`} />
              )}
            </div>

            {/* CS Assignment */}
            <div className="mb-3">
              <div className={`p-2 rounded-lg h-12 flex items-center text-xs ${
                unit.cs ? 'bg-white border' : 'bg-white border border-red-200'
              }`}>
                {unit.cs ? (
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="font-medium text-gray-900">{unit.cs}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <p className="text-red-700">No CS assigned</p>
                    <button 
                      onClick={() => onTabChange('users')}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Stats */}
            <div className="bg-white p-2 rounded-lg border mb-3">
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-gray-900">{unit.stats.totalStock}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{unit.stats.availableProducts}</div>
                  <div className="text-xs text-gray-500">OK</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-yellow-600">{unit.stats.criticalProducts}</div>
                  <div className="text-xs text-gray-500">Critical</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-red-600">{unit.stats.emptyProducts}</div>
                  <div className="text-xs text-gray-500">Empty</div>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(unit.status)}`}>
                {getStatusText(unit.status)}
              </span>
            </div>

            {/* Action Button */}
            <button 
              onClick={() => {
                onUnitSelect(unit.id);
                onTabChange('stock');
              }}
              className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-xs hover:bg-blue-700 transition-colors"
            >
              Manage Stock
            </button>
          </div>
        ))}
      </div>

      {units.length === 0 && (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No units found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a unit.</p>
        </div>
      )}
    </div>
  );
};

export default Overview;