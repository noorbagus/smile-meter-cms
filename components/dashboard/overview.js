// components/dashboard/overview.js - Fixed version
import React, { useState, useEffect } from 'react';
import { Store, AlertTriangle, Package, Users, TrendingUp, TrendingDown, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Overview = ({ onUnitSelect, onTabChange }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [criticalProducts, setCriticalProducts] = useState([]);
  const [emptyProducts, setEmptyProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 4;

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      // Fetch units with CS assignments
      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Get CS names for assigned units
      const assignedCSIds = unitsData?.filter(u => u.assigned_cs_id).map(u => u.assigned_cs_id) || [];
      let csNames = {};

      if (assignedCSIds.length > 0) {
        const { data: csData } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', assignedCSIds);

        csData?.forEach(cs => {
          csNames[cs.id] = cs.full_name;
        });
      }

      // Fetch all unit stock data
      const { data: allStockData } = await supabase
        .from('unit_stock')
        .select(`
          unit_id, quantity,
          products!inner (
            id, name, is_active
          )
        `)
        .eq('products.is_active', true);

      // Collect critical and empty products across all units
      const allCriticalProducts = [];
      const allEmptyProducts = [];
      
      // Process data for each unit
      const enrichedUnits = (unitsData || []).map(unit => {
        const unitStock = allStockData?.filter(s => s.unit_id === unit.id) || [];
        
        // Collect critical/empty products for this unit
        unitStock.forEach(stock => {
          if (stock.quantity === 0) {
            allEmptyProducts.push({
              name: stock.products.name,
              unitName: unit.name,
              unitId: unit.id
            });
          } else if (stock.quantity > 0 && stock.quantity <= 5) {
            allCriticalProducts.push({
              name: stock.products.name,
              unitName: unit.name,
              unitId: unit.id,
              quantity: stock.quantity
            });
          }
        });

        const totalStock = unitStock.reduce((sum, item) => sum + item.quantity, 0);
        const emptyProducts = unitStock.filter(item => item.quantity === 0).length;
        const criticalProducts = unitStock.filter(item => item.quantity > 0 && item.quantity <= 5).length;
        const availableProducts = unitStock.filter(item => item.quantity > 5).length;

        const status = getUnitStatus({ totalStock });
        const priority = getUnitPriority(status);

        return {
          ...unit,
          cs_name: unit.assigned_cs_id ? csNames[unit.assigned_cs_id] : null,
          stats: {
            totalStock,
            totalProducts: unitStock.length,
            emptyProducts,
            criticalProducts,
            availableProducts
          },
          status,
          priority
        };
      });

      setCriticalProducts(allCriticalProducts);
      setEmptyProducts(allEmptyProducts);

      // Sort by priority (most critical first)
      const sortedUnits = enrichedUnits.sort((a, b) => {
        const priorityOrder = { 'empty': 0, 'critical': 1, 'warning': 2, 'good': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      setUnits(sortedUnits);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnitStatus = (stats) => {
    if (stats.totalStock === 0) return 'empty';
    if (stats.totalStock < 10) return 'critical';
    if (stats.totalStock < 50) return 'warning';
    return 'available';
  };

  const getUnitPriority = (status) => {
    switch (status) {
      case 'empty': return 'empty';
      case 'critical': return 'critical'; 
      case 'warning': return 'warning';
      default: return 'good';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'empty': return 'border-red-500 bg-red-50';
      case 'critical': return 'border-yellow-500 bg-yellow-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
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

  const getAlertIcon = (priority) => {
    if (priority === 'good') return null;
    
    const color = priority === 'empty' ? 'text-red-600' : 
                  priority === 'critical' ? 'text-yellow-600' : 'text-orange-600';
    
    return <AlertTriangle size={16} className={color} />;
  };

  const getMostActiveUnit = () => {
    if (units.length === 0) return 'No data';
    return units.reduce((most, unit) => 
      unit.stats.totalStock > most.stats.totalStock ? unit : most
    ).name;
  };

  // Calculate global stats
  const globalStats = {
    totalStock: units.reduce((sum, unit) => sum + unit.stats.totalStock, 0),
    criticalCount: criticalProducts.length,
    emptyCount: emptyProducts.length,
    mostActive: getMostActiveUnit()
  };

  const ProductModal = ({ isOpen, onClose, title, products, type }) => {
    if (!isOpen) return null;

    const totalPages = Math.ceil(products.length / productsPerPage);
    const paginatedProducts = products.slice(
      (currentPage - 1) * productsPerPage,
      currentPage * productsPerPage
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-96">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 max-h-80 overflow-y-auto">
            {paginatedProducts.length > 0 ? (
              <div className="space-y-0 divide-y divide-gray-100">
                {paginatedProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center py-3 bg-white">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.unitName}</div>
                    </div>
                    <div className="flex items-center">
                      {type === 'critical' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          {product.quantity} left
                        </span>
                      )}
                      {type === 'empty' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          Empty
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No products found</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * productsPerPage) + 1} to{' '}
                  {Math.min(currentPage * productsPerPage, products.length)} of {products.length} products
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border h-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border h-48"></div>
            ))}
          </div>
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
              <p className="text-2xl font-bold text-gray-900">{globalStats.totalStock.toLocaleString()}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          setCurrentPage(1);
          setShowCriticalModal(true);
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Products</p>
              <p className="text-2xl font-bold text-yellow-600">{globalStats.criticalCount}</p>
              <p className="text-xs text-blue-600 mt-1 hover:underline">View Details →</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          setCurrentPage(1);
          setShowEmptyModal(true);
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Empty Products</p>
              <p className="text-2xl font-bold text-red-600">{globalStats.emptyCount}</p>
              <p className="text-xs text-blue-600 mt-1 hover:underline">View Details →</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Most Active Unit</p>
              <p className="text-lg font-bold text-green-600 truncate">{globalStats.mostActive}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map(unit => (
          <div 
            key={unit.id} 
            className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all hover:shadow-md ${getPriorityColor(unit.priority)}`}
          >
            {/* Unit Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Store className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{unit.name}</h3>
                  <p className="text-xs text-gray-500"></p>
                </div>
              </div>
              {getAlertIcon(unit.priority)}
            </div>

            {/* CS Assignment */}
            <div className="mb-3">
              <div className={`p-2 rounded-lg h-12 flex items-center text-xs ${
                unit.cs_name ? 'bg-white border' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {unit.cs_name ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-gray-900 truncate">{unit.cs_name}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium ml-2">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <p className="text-yellow-800">No CS assigned</p>
                    <button 
                      onClick={() => onTabChange('users')}
                      className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Stats */}
            <div className="bg-white p-3 rounded-lg border mb-3">
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
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(unit.priority)}`}>
                {getStatusText(unit.status)}
              </span>
            </div>

            {/* Action Button - FIXED */}
            <button 
              onClick={() => {
                console.log('🎯 Unit selected:', unit.id);
                onUnitSelect(unit.id);
                console.log('📋 Tab changed to: stock');
                onTabChange('stock');
              }}
              className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-xs hover:bg-blue-700 transition-colors"
            >
              Manage Stock
            </button>
          </div>
        ))}
      </div>

      {units.length === 0 && !loading && (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No units found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a unit.</p>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={showCriticalModal}
        onClose={() => setShowCriticalModal(false)}
        title={`Critical Products (${criticalProducts.length})`}
        products={criticalProducts}
        type="critical"
      />

      <ProductModal
        isOpen={showEmptyModal}
        onClose={() => setShowEmptyModal(false)}
        title={`Empty Products (${emptyProducts.length})`}
        products={emptyProducts}
        type="empty"
      />
    </div>
  );
};

export default Overview;