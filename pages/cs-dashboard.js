// pages/cs-dashboard.js - Enhanced with custom reduce amount
import { useState, useEffect } from 'react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { supabase } from '../lib/supabase';

const CSDashboard = () => {
  const [userUnit, setUserUnit] = useState(null);
  const [products, setProducts] = useState([]);
  const [unitStock, setUnitStock] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [reduceAmount, setReduceAmount] = useState(1);
  const [dataLoading, setDataLoading] = useState(true);

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
      setReduceAmount(1); // Reset to 1 when opening modal
      setShowConfirmModal(productId);
    }
  };

  const confirmStockReduce = async (productId) => {
    try {
      const currentStock = unitStock[productId] || 0;
      const amount = parseInt(reduceAmount) || 1;
      
      // Validate reduce amount
      if (amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      if (amount > currentStock) {
        alert(`Cannot reduce ${amount} items. Only ${currentStock} available.`);
        return;
      }

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
      setReduceAmount(1);
    } catch (error) {
      console.error('Error reducing stock:', error);
      alert('Failed to reduce stock');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
            <div className="text-lg font-bold text-blue-600">{products.filter(p => (unitStock[p.id] || 0) > 10).length}</div>
            <div className="text-xs text-gray-600">High Stock</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-600">{products.filter(p => {
              const stock = unitStock[p.id] || 0;
              return stock > 0 && stock <= 10;
            }).length}</div>
            <div className="text-xs text-gray-600">Low Stock</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-600">{products.filter(p => (unitStock[p.id] || 0) === 0).length}</div>
            <div className="text-xs text-gray-600">Out of Stock</div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          <span className="text-sm text-gray-500">{products.length} items</span>
        </div>

        <div className="space-y-3">
          {products.map(product => {
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
          })}
        </div>
      </div>

      {/* Enhanced Confirm Modal with Custom Amount Input */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <span className="text-red-600 font-bold">-</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reduce Stock
              </h3>
              
              <p className="text-gray-600 mb-4 text-sm">
                <span className="font-medium">"{products.find(p => p.id === showConfirmModal)?.name}"</span>
                <br />
                <span className="text-xs">Available: {unitStock[showConfirmModal] || 0} items</span>
              </p>
              
              {/* Custom Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reduce Amount
                </label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setReduceAmount(Math.max(1, reduceAmount - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium"
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    min="1"
                    max={unitStock[showConfirmModal] || 1}
                    value={reduceAmount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const maxStock = unitStock[showConfirmModal] || 1;
                      setReduceAmount(Math.min(Math.max(1, val), maxStock));
                    }}
                    className="w-16 h-10 text-center border border-gray-300 rounded-lg font-semibold text-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  
                  <button
                    onClick={() => {
                      const maxStock = unitStock[showConfirmModal] || 1;
                      setReduceAmount(Math.min(reduceAmount + 1, maxStock));
                    }}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium"
                  >
                    +
                  </button>
                </div>
                

              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowConfirmModal(null);
                    setReduceAmount(1);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => confirmStockReduce(showConfirmModal)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
                >
                  Reduce {reduceAmount}
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