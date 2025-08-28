import React, { useState, useEffect } from 'react';
import { Store, AlertTriangle, Package, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../pages/_app';

const Overview = ({ onUnitSelect, onTabChange }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { supabase } = useAuth();

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      
      // Fetch units with CS assignments using view
      const { data: unitsData, error: unitsError } = await supabase
        .from('unit_stock_overview')
        .select('*');

      if (unitsError) {
        console.error('Units fetch error:', unitsError);
        setError('Failed to load units data');
      } else {
        setUnits(unitsData || []);
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
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

  const getUnitStatus = (unit) => {
    if (!unit.total_stock) return 'empty';
    if (unit.total_stock < 5 || unit.empty_products >= 2) return 'critical';
    if (unit.critical_products >= 2) return 'warning';
    return 'available';
  };

  const totalStats = units.reduce((acc, unit) => ({
    totalStock: acc.totalStock + (unit.total_stock || 0),
    totalUnits: acc.totalUnits + 1,
    activeUnits: acc.activeUnits + (unit.total_stock > 0 ? 1 : 0),
    criticalUnits: acc.criticalUnits + (['critical', 'warning', 'empty'].includes(getUnitStatus(unit)) ? 1 : 0)
  }), { totalStock: 0, totalUnits: 0, activeUnits: 0, criticalUnits: 0 });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchOverviewData}
            className="mt-2 text-red-600 hover:text-red-700 underline"
          >
            Try Again
          </button>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {units.map(unit => {
          const status = getUnitStatus(unit);
          
          return (
            <div 
              key={unit.unit_id} 
              className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all hover:shadow-md ${getPriorityColor(status)}`}
            >
              {/* Unit Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Store className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{unit.unit_name}</h3>
                    <p className="text-xs text-gray-500">ID: {unit.unit_id}</p>
                  </div>
                </div>
                
                {(['critical', 'warning', 'empty'].includes(status)) && (
                  <AlertTriangle size={14} className={`${
                    status === 'empty' ? 'text-red-600' : 
                    status === 'critical' ? 'text-yellow-600' : 'text-orange-600'
                  }`} />
                )}
              </div>

              {/* CS Assignment */}
              <div className="mb-3">
                <div className={`p-2 rounded-lg h-12 flex items-center text-xs ${
                  unit.cs_name ? 'bg-white border' : 'bg-white border border-red-200'
                }`}>
                  {unit.cs_name ? (
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="font-medium text-gray-900">{unit.cs_name}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <p className="text-red-700">No CS assigned</p>
                      <button 
                        onClick={() => onTabChange && onTabChange('users')}
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
                    <div className="font-bold text-gray-900">{unit.total_stock || 0}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">{unit.available_products || 0}</div>
                    <div className="text-xs text-gray-500">OK</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-yellow-600">{unit.critical_products || 0}</div>
                    <div className="text-xs text-gray-500">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-600">{unit.empty_products || 0}</div>
                    <div className="text-xs text-gray-500">Empty</div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(status)}`}>
                  {getStatusText(status)}
                </span>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => {
                  if (onUnitSelect) onUnitSelect(unit.unit_id);
                  if (onTabChange) onTabChange('stock');
                }}
                className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-xs hover:bg-blue-700 transition-colors"
              >
                Manage Stock
              </button>
            </div>
          );
        })}
      </div>

      {units.length === 0 && !loading && (
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