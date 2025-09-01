// components/dashboard/stock-table.js
import { useState, useEffect } from 'react';
import { createClient } from '../../utils/supabase/client';

const StockTable = ({ selectedUnit, user, onUnitChange }) => {
  const [products, setProducts] = useState([]);
  const [unitStock, setUnitStock] = useState({});
  const [editingStock, setEditingStock] = useState({});
  const [tempStockValues, setTempStockValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [units, setUnits] = useState([]);
  const [currentUnitName, setCurrentUnitName] = useState('');
  const [totalStock, setTotalStock] = useState(0);
  const productsPerPage = 5;
  const supabase = createClient();

  useEffect(() => {
    loadUnits();
    loadStockData();
  }, [selectedUnit]);

  // Calculate total stock whenever unitStock changes
  useEffect(() => {
    const total = Object.values(unitStock).reduce((sum, qty) => sum + qty, 0);
    setTotalStock(total);
  }, [unitStock]);

  const loadUnits = async () => {
    try {
      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      setUnits(unitsData || []);
      
      if (selectedUnit) {
        const currentUnit = unitsData?.find(unit => unit.id === selectedUnit);
        setCurrentUnitName(currentUnit?.name || '');
      }
    } catch (error) {
      console.error('Error loading units:', error);
    }
  };

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
      // Check if record exists
      const { data: existingStock } = await supabase
        .from('unit_stock')
        .select('id')
        .eq('unit_id', selectedUnit)
        .eq('product_id', productId)
        .single();

      let error;
      if (existingStock) {
        // Update existing record
        ({ error } = await supabase
          .from('unit_stock')
          .update({
            quantity: newQuantity,
            last_updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('unit_id', selectedUnit)
          .eq('product_id', productId));
      } else {
        // Insert new record
        ({ error } = await supabase
          .from('unit_stock')
          .insert({
            unit_id: selectedUnit,
            product_id: productId,
            quantity: newQuantity,
            last_updated_by: user.id
          }));
      }

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

      // Update unit status
      await updateUnitStatus();

      setUnitStock(prev => ({ ...prev, [productId]: newQuantity }));
      setEditingStock({ ...editingStock, [key]: false });
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock: ' + error.message);
    }
  };

  const handleStockCancel = (productId) => {
    const key = productId;
    setEditingStock({ ...editingStock, [key]: false });
  };

  const updateUnitStatus = async () => {
    if (!selectedUnit) return;

    try {
      const totalStock = Object.values(unitStock).reduce((sum, qty) => sum + qty, 0);
      const emptyProducts = Object.values(unitStock).filter(qty => qty === 0).length;
      const criticalProducts = Object.values(unitStock).filter(qty => qty > 0 && qty <= 5).length;

      let status = 'available';
      if (totalStock === 0) {
        status = 'empty';
      } else if (totalStock <= 5 || emptyProducts >= 2 || criticalProducts >= 2) {
        status = 'critical';
      }

      await supabase
        .from('unit_status')
        .upsert({
          unit_id: selectedUnit,
          status,
          total_stock: totalStock,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating unit status:', error);
    }
  };

  const getStockStatusColor = (total) => {
    if (total === 0) return 'text-red-600';
    if (total < 10) return 'text-yellow-600';
    return 'text-green-600';
  };

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

  const totalPages = Math.ceil(products.length / productsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  // Calculate stock stats
  const availableProducts = Object.values(unitStock).filter(qty => qty > 0).length;
  const criticalProducts = Object.values(unitStock).filter(qty => qty > 0 && qty <= 5).length;
  const emptyProducts = Object.values(unitStock).filter(qty => qty === 0).length;

  return (
    <>
      {/* Title and Unit Dropdown */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Store: {currentUnitName}</h2>
            <p className="text-sm text-gray-500">Manage product inventory</p>
          </div>
          <div>
            <select 
              value={selectedUnit}
              onChange={(e) => onUnitChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-64"
            >
              <option value="">Select unit</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} - {unit.location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stock Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Stock Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-sm text-gray-500">Total Stock</span>
            <div className={`text-2xl font-bold ${getStockStatusColor(totalStock)}`}>
              {totalStock}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-sm text-gray-500">Available Products</span>
            <div className="text-2xl font-bold text-green-600">
              {availableProducts}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-sm text-gray-500">Critical Stock</span>
            <div className="text-2xl font-bold text-yellow-600">
              {criticalProducts}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-sm text-gray-500">Empty Products</span>
            <div className="text-2xl font-bold text-red-600">
              {emptyProducts}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Product Stock - {products.length} items
          </h3>
        </div>

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
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map(product => {
                  const currentStock = unitStock[product.id] || 0;
                  const isEditing = editingStock[product.id];
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
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
                })
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
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
    </>
  );
};

export default StockTable;