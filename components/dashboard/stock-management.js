// components/dashboard/stock-management.js - Refactored Clean Version
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const StockManagement = ({ user }) => {
  const [units, setUnits] = useState([]);
  const [products, setProducts] = useState([]);
  const [unitStock, setUnitStock] = useState({});
  const [selectedUnit, setSelectedUnit] = useState('');
  const [editingStock, setEditingStock] = useState({});
  const [tempStockValues, setTempStockValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', initial_stock: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const productsPerPage = 5;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      loadStockData();
    }
  }, [selectedUnit]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadInitialData = async () => {
    try {
      const [unitsData, productsData] = await Promise.all([
        supabase.from('units').select('*').eq('is_active', true).order('name'),
        supabase.from('products').select('*').eq('is_active', true).order('name')
      ]);

      setUnits(unitsData.data || []);
      setProducts(productsData.data || []);
      
      if (unitsData.data?.length > 0 && !selectedUnit) {
        setSelectedUnit(unitsData.data[0].id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStockData = async () => {
    if (!selectedUnit) return;

    try {
      const { data: stockData } = await supabase
        .from('unit_stock')
        .select('product_id, quantity')
        .eq('unit_id', selectedUnit);

      const stockMap = {};
      stockData?.forEach(item => {
        stockMap[item.product_id] = item.quantity || 0;
      });

      setUnitStock(stockMap);
    } catch (error) {
      console.error('Error loading stock data:', error);
    }
  };

  const handleStockEdit = (productId, currentValue) => {
    setEditingStock({ ...editingStock, [productId]: true });
    setTempStockValues({ ...tempStockValues, [productId]: currentValue });
  };

  const handleStockSave = async (productId) => {
    const newQuantity = parseInt(tempStockValues[productId]) || 0;
    const oldQuantity = unitStock[productId] || 0;

    try {
      const { data: existingStock } = await supabase
        .from('unit_stock')
        .select('id')
        .eq('unit_id', selectedUnit)
        .eq('product_id', productId)
        .single();

      let error;
      if (existingStock) {
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

      await updateUnitStatus();

      setUnitStock(prev => ({ ...prev, [productId]: newQuantity }));
      setEditingStock({ ...editingStock, [productId]: false });
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock: ' + error.message);
    }
  };

  const handleStockCancel = (productId) => {
    setEditingStock({ ...editingStock, [productId]: false });
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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedUnit) {
      alert('Please select a unit first');
      return;
    }

    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          description: newProduct.description,
          is_active: true
        })
        .select('id')
        .single();

      if (productError) throw productError;

      const initialStock = parseInt(newProduct.initial_stock) || 0;
      if (initialStock > 0) {
        await supabase
          .from('unit_stock')
          .insert({
            unit_id: selectedUnit,
            product_id: productData.id,
            quantity: initialStock,
            last_updated_by: user.id
          });

        await supabase
          .from('stock_transactions')
          .insert({
            unit_id: selectedUnit,
            product_id: productData.id,
            transaction_type: 'adjustment',
            quantity_before: 0,
            quantity_after: initialStock,
            quantity_change: initialStock,
            reason: 'Initial stock on product creation',
            performed_by: user.id
          });
      }

      setNewProduct({ name: '', description: '', initial_stock: '' });
      setShowAddProductModal(false);
      loadInitialData();
      loadStockData();
      alert('Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      loadInitialData();
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const getStockColor = (stock) => {
    if (stock > 10) return 'bg-green-100 text-green-800';
    if (stock > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getUnitStatus = () => {
    const totalStock = Object.values(unitStock).reduce((sum, qty) => sum + qty, 0);
    if (totalStock === 0) return { status: 'empty', text: 'Hadiah Habis', color: 'text-red-600' };
    if (totalStock <= 5) return { status: 'critical', text: 'Hadiah Hampir Habis', color: 'text-yellow-600' };
    return { status: 'available', text: 'Hadiah Tersedia', color: 'text-green-600' };
  };

  // Get selected unit name for title
  const getSelectedUnitName = () => {
    const unit = units.find(u => u.id === selectedUnit);
    return unit ? unit.name : '';
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unitStatusInfo = getUnitStatus();
  const selectedUnitName = getSelectedUnitName();

  return (
    <div className="space-y-6">
      {/* Header with Unit Name in Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Stock Management {selectedUnitName && `[${selectedUnitName}]`}
          </h2>
          <p className="text-gray-600">Manage product inventory for this unit</p>
        </div>
        <button 
          onClick={() => setShowAddProductModal(true)}
          disabled={!selectedUnit}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Product
        </button>
      </div>

      {/* Unit Selection - Clean Layout */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Change Unit</label>
            <select 
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a unit...</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedUnit && (
            <div className="flex items-center gap-4 mt-6 sm:mt-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${unitStatusInfo.color} bg-gray-100`}>
                {unitStatusInfo.text}
              </span>
              <div className="text-sm text-gray-500">
                <span className="font-medium">Total Stock:</span> {Object.values(unitStock).reduce((sum, qty) => sum + qty, 0)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Show message if no unit selected */}
      {!selectedUnit ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-800">
            <h3 className="font-medium mb-1">No Unit Selected</h3>
            <p className="text-sm">Please select a unit to manage its stock inventory.</p>
          </div>
        </div>
      ) : (
        /* Stock Table */
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Products - {filteredProducts.length} items
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
                <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProducts.map(product => {
                  const currentStock = unitStock[product.id] || 0;
                  const isEditing = editingStock[product.id];
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 w-64">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={tempStockValues[product.id] || ''}
                              onChange={(e) => setTempStockValues({
                                ...tempStockValues,
                                [product.id]: e.target.value
                              })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              min="0"
                            />
                            <button
                              onClick={() => handleStockSave(product.id)}
                              className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleStockCancel(product.id)}
                              className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium min-w-[3rem] text-center ${getStockColor(currentStock)}`}>
                              {currentStock}
                            </span>
                            <button
                              onClick={() => handleStockEdit(product.id, currentStock)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {searchQuery ? 'No products found matching your search.' : 'No products available.'}
                </div>
              </div>
            )}
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
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Add New Product
              {selectedUnitName && (
                <div className="text-sm font-normal text-gray-600 mt-1">
                  Initial stock will be added to {selectedUnitName}
                </div>
              )}
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input 
                  type="text" 
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                <input 
                  type="number" 
                  min="0"
                  value={newProduct.initial_stock}
                  onChange={(e) => setNewProduct({...newProduct, initial_stock: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter initial quantity"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;