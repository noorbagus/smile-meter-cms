// pages/cs-dashboard.js - Enhanced with manual input
import { useState, useEffect } from 'react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { supabase } from '../lib/supabase';

const CSDashboard = () => {
  const [userUnit, setUserUnit] = useState(null);
  const [products, setProducts] = useState([]);
  const [unitStock, setUnitStock] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [reductionAmount, setReductionAmount] = useState('1'); // Change to string for better input handling
  const [inputErrors, setInputErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState(''); // Add search functionality

  // Use auth guard with CS role requirement
  const { user, profile, loading } = useAuthGuard('customer_service');

  useEffect(() => {
    if (user && profile && profile.role === 'customer_service') {
      loadUserUnit(user.id);
    }
  }, [user, profile]);

  const loadUserUnit = async (userId) => {
    try {
      const { data: unit } = await supabase
        .from('units')
        .select('*')
        .eq('assigned_cs_id', userId)
        .single();

      if (!unit) {
        alert('No unit assigned to your account');
        await supabase.auth.signOut();
        return;
      }

      setUserUnit(unit);
      await loadUnitData(unit.id);
    } catch (error) {
      console.error('Error loading unit:', error);
    }
  };

  const loadUnitData = async (unitId) => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      const { data: stockData } = await supabase
        .from('unit_stock')
        .select('product_id, quantity')
        .eq('unit_id', unitId);

      const stockMap = {};
      stockData?.forEach(item => {
        stockMap[item.product_id] = item.quantity;
      });

      setProducts(productsData || []);
      setUnitStock(stockMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const getTotalStock = () => {
    return Object.values(unitStock).reduce((sum, qty) => sum + qty, 0);
  };

  const getUnitStatus = () => {
    const totalStock = getTotalStock();
    return totalStock > 0 ? 'available' : 'empty';
  };

  const handleStockReduce = (productId) => {
    const currentStock = unitStock[productId] || 0;
    if (currentStock > 0) {
      setShowConfirmModal(productId);
      setReductionAmount('1'); // Reset to string '1' when opening modal
      setInputErrors({});
    }
  };

  const validateReductionAmount = (amount, currentStock) => {
    if (amount === 0 || amount === '' || !amount) {
      return 'Please enter an amount';
    }
    if (amount < 1) {
      return 'Minimum reduction is 1';
    }
    if (amount > currentStock) {
      return `Cannot reduce more than current stock (${currentStock})`;
    }
    return null;
  };

  const handleReductionAmountChange = (value) => {
    // Allow empty string for better UX when deleting
    if (value === '') {
      setReductionAmount('');
      setInputErrors(prev => ({
        ...prev,
        [showConfirmModal]: 'Please enter an amount'
      }));
      return;
    }

    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Convert to number, but keep as string to preserve user input
    const amount = parseInt(numericValue) || 0;
    const currentStock = unitStock[showConfirmModal] || 0;
    
    // Update with the cleaned numeric string
    setReductionAmount(numericValue);
    
    const error = validateReductionAmount(amount, currentStock);
    setInputErrors(prev => ({
      ...prev,
      [showConfirmModal]: error
    }));
  };

  const confirmStockReduce = async (productId) => {
    const currentStock = unitStock[productId] || 0;
    const amount = parseInt(reductionAmount) || 0;
    const error = validateReductionAmount(amount, currentStock);
    
    if (error) {
      setInputErrors(prev => ({
        ...prev,
        [productId]: error
      }));
      return;
    }

    try {
      const newQuantity = currentStock - amount;

      await supabase
        .from('unit_stock')
        .update({ 
          quantity: newQuantity,
          last_updated_by: user.id
        })
        .eq('unit_id', userUnit.id)
        .eq('product_id', productId);

      await supabase
        .from('stock_transactions')
        .insert({
          unit_id: userUnit.id,
          product_id: productId,
          transaction_type: 'reduction',
          quantity_before: currentStock,
          quantity_after: newQuantity,
          quantity_change: -amount,
          reason: `Prize given out (${amount} items)`,
          performed_by: user.id
        });

      setUnitStock(prev => ({
        ...prev,
        [productId]: newQuantity
      }));

      setShowConfirmModal(null);
      setReductionAmount('');
      setInputErrors({});
    } catch (error) {
      console.error('Error reducing stock:', error);
      alert('Failed to reduce stock');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Quick reduction buttons
  const getQuickReductionButtons = (currentStock) => {
    const buttons = [1, 2, 3, 5];
    return buttons.filter(num => num <= currentStock);
  };

  // Show loading while checking auth or loading data
  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a93ce] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const status = getUnitStatus();
  const totalStock = getTotalStock();

  // Filter products based on search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="flex items-center justify-between p-4">
          <div className="text-center flex-1">
            <h1 className="font-semibold text-gray-900">Stock Manager</h1>
            <p className="text-xs text-gray-500 truncate">{userUnit?.name}</p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="p-4">
        <div className={`rounded-xl p-4 ${
          status === 'available' 
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
            : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">
                  {status === 'available' ? 'Hadiah Tersedia' : 'Hadiah Habis'}
                </span>
              </div>
              <p className="text-sm opacity-90">Total Stock: {totalStock} items</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{products.filter(p => (unitStock[p.id] || 0) > 0).length}</div>
              <div className="text-xs opacity-90">Available Products</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">{filteredProducts.filter(p => (unitStock[p.id] || 0) > 10).length}</div>
            <div className="text-xs text-gray-600">High Stock</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-600">{filteredProducts.filter(p => {
              const stock = unitStock[p.id] || 0;
              return stock > 0 && stock <= 10;
            }).length}</div>
            <div className="text-xs text-gray-600">Low Stock</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-600">{filteredProducts.filter(p => (unitStock[p.id] || 0) === 0).length}</div>
            <div className="text-xs text-gray-600">Out of Stock</div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-20">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <span className="text-sm text-gray-500">{filteredProducts.length} items</span>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => {
              const stock = unitStock[product.id] || 0;
              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <div className={`text-2xl font-bold ${
                          stock > 10 ? 'text-green-600' : 
                          stock > 0 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {stock}
                        </div>
                        <div className="text-xs text-gray-500">in stock</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleStockReduce(product.id)}
                      disabled={stock === 0}
                      className={`w-full py-3 rounded-lg font-medium transition-all ${
                        stock > 0 
                          ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>{stock > 0 ? 'Reduce Stock' : 'Out of Stock'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No products found</p>
              <p className="text-sm text-gray-400">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <span className="text-red-600 font-bold">!</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reduce Stock
              </h3>
              
              <p className="text-gray-600 mb-4 text-sm">
                <span className="font-medium">"{products.find(p => p.id === showConfirmModal)?.name}"</span><br />
                Current stock: {unitStock[showConfirmModal] || 0}
              </p>

              {/* Quick buttons */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Quick reduce:</p>
                <div className="flex justify-center gap-2">
                  {getQuickReductionButtons(unitStock[showConfirmModal] || 0).map(num => (
                    <button
                      key={num}
                      onClick={() => handleReductionAmountChange(num.toString())}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        parseInt(reductionAmount) === num
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual input */}
              <div className="mb-6">
                <label className="block text-xs text-gray-500 mb-2">
                  Or enter amount:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={reductionAmount}
                  onChange={(e) => handleReductionAmountChange(e.target.value)}
                  className={`w-full px-3 py-3 border rounded-xl text-center text-lg font-semibold focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    inputErrors[showConfirmModal] 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter amount"
                  autoComplete="off"
                />
                {inputErrors[showConfirmModal] && (
                  <p className="text-red-600 text-xs mt-2">
                    {inputErrors[showConfirmModal]}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowConfirmModal(null);
                    setReductionAmount('1');
                    setInputErrors({});
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => confirmStockReduce(showConfirmModal)}
                  disabled={!!inputErrors[showConfirmModal] || !reductionAmount || reductionAmount === '0'}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reduce by {parseInt(reductionAmount) || 0}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSDashboard;