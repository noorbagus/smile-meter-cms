// components/dashboard/stock-table.js - Enhanced with search
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const StockTable = ({ selectedUnit, user, units = [], onUnitChange }) => {
  const [products, setProducts] = useState([]);
  const [unitStock, setUnitStock] = useState({});
  const [editingStock, setEditingStock] = useState({});
  const [tempStockValues, setTempStockValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const productsPerPage = 5;

  useEffect(() => {
    loadStockData();
  }, [selectedUnit]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadStockData = async () => {
    if (!selectedUnit) {
      setLoading(false);
      return;
    }

    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      const { data: stockData } = await supabase
        .from('unit_stock')
        .select('product_id, quantity')
        .eq('unit_id', selectedUnit);

      const stockMap = {};
      stockData?.forEach(item => {
        stockMap[item.product_id] = item.quantity || 0;
      });

      setProducts(productsData || []);
      setUnitStock(stockMap);
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (unitId) => {
    if (onUnitChange) {
      onUnitChange(unitId);
    }
  };

  const handleStockEdit = (productId, currentValue) => {
    const key = productId;
    setEditingStock({ ...editingStock, [key]: true });
    setTempStockValues({ ...tempStockValues, [key]: currentValue });
  };

  const handleStockSave = async (productId) => {
    const key = productId;
    const newQuantity = parseInt(tempStockValues[key]) || 0;
    const oldQuantity = unitStock[productId] || 0;

    try {
      // Update or insert stock
      const { error } = await supabase
        .from('unit_stock')
        .upsert({
          unit_id: selectedUnit,
          product_id: productId,
          quantity: newQuantity,
          last_updated_by: user.id
        });

      if (error) throw error;

      // Log transaction
      await supabase
        .from('stock_transactions')
        .insert({
          unit_id: selectedUnit,
          product_id: productId,
          transaction_type: 'adjustment',
          quantity_before: oldQuantity,
          quantity_after: newQuantity,
          quantity_change: newQuantity - oldQuantity,
          reason: 'Admin adjustment',
          performed_by: user.id
        });

      setUnitStock(prev => ({ ...prev, [productId]: newQuantity }));
      setEditingStock({ ...editingStock, [key]: false });
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    }
  };

  const handleStockCancel = (productId) => {
    const key = productId;
    setEditingStock({ ...editingStock, [key]: false });
  };

  const getStockStats = () => {
    const totalStock = Object.values(unitStock).reduce((sum, qty) => sum + qty, 0);
    const emptyProducts = Object.values(unitStock).filter(qty => qty === 0).length;
    const criticalProducts = Object.values(unitStock).filter(qty => qty > 0 && qty <= 5).length;
    const availableProducts = Object.values(unitStock).filter(qty => qty > 5).length;
    
    return { totalStock, emptyProducts, criticalProducts, availableProducts };
  };

  const getUnitStatus = (totalStock) => {
    if (totalStock === 0) return { status: 'empty', text: 'Hadiah Habis', color: 'text-red-600' };
    if (totalStock <= 10) return { status: 'critical', text: 'Hadiah Hampir Habis', color: 'text-yellow-600' };
    return { status: 'available', text: 'Hadiah Tersedia', color: 'text-green-600' };
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedUnit) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <p className="text-gray-500 mb-4">Please select a unit to manage stock</p>
        {units.length > 0 && (
          <select 
            onChange={(e) => handleUnitChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Select a unit...</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  const selectedUnitData = units.find(u => u.id === selectedUnit);
  const stats = getStockStats();
  const unitStatus = getUnitStatus(stats.totalStock);
  
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Unit Selector & Stats */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Change Unit</label>
            <select 
              value={selectedUnit}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full lg:w-64"
            >
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Unit Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.totalStock}</div>
              <div className="text-xs text-gray-500">Total Stock</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.availableProducts}</div>
              <div className="text-xs text-gray-500">Available</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.criticalProducts}</div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats.emptyProducts}</div>
              <div className="text-xs text-gray-500">Empty</div>
            </div>
          </div>

          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${unitStatus.color} bg-gray-100`}>
              {unitStatus.text}
            </span>
          </div>
        </div>
        
        {selectedUnitData && (
          <div className="mt-3 text-sm text-gray-600">
           
          </div>
        )}
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Product Stock - {filteredProducts.length} items
                {searchQuery && ` (filtered from ${products.length} total)`}
              </h3>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg 
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* No results message */}
        {filteredProducts.length === 0 && searchQuery && (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900">No products found</h3>
            <p className="text-sm text-gray-500 mt-1">
              No products match "{searchQuery}". Try adjusting your search.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          </div>
        )}

        {filteredProducts.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProducts.map(product => {
                    const currentStock = unitStock[product.id] || 0;
                    const isEditing = editingStock[product.id];
                    
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500">{product.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={tempStockValues[product.id] || ''}
                                onChange={(e) => setTempStockValues({
                                  ...tempStockValues,
                                  [product.id]: e.target.value
                                })}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                min="0"
                              />
                              <button
                                onClick={() => handleStockSave(product.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleStockCancel(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                currentStock > 10 ? 'bg-green-100 text-green-800' :
                                currentStock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {currentStock}
                              </span>
                              <button
                                onClick={() => handleStockEdit(product.id, currentStock)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleStockEdit(product.id, currentStock)}
                              className="text-gray-600 hover:text-gray-900"
                              disabled={isEditing}
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * productsPerPage) + 1} to{' '}
                    {Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                    {searchQuery && ` (filtered from ${products.length} total)`}
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
          </>
        )}
      </div>
    </div>
  );
};

export default StockTable;