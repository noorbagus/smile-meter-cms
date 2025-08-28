// components/dashboard/user-management.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const UserManagement = ({ user }) => {
  const [units, setUnits] = useState([]);
  const [customerServices, setCustomerServices] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '' });
  const [selectedCS, setSelectedCS] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: unitsData } = await supabase
        .from('units')
        .select(`
          id, name, location, assigned_cs_id,
          user_profiles(id, full_name, email)
        `)
        .order('name');

      const { data: csData } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('role', 'customer_service')
        .order('full_name');

      setUnits(unitsData || []);
      setCustomerServices(csData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: { full_name: newUser.full_name }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            full_name: newUser.full_name,
            email: newUser.email,
            role: 'customer_service'
          });
      }

      setNewUser({ full_name: '', email: '', password: '' });
      setShowAddUserModal(false);
      loadData();
      alert('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + error.message);
    }
  };

  const handleAssignCS = async (unitId) => {
    if (!selectedCS) return;
    
    try {
      await supabase
        .from('units')
        .update({ assigned_cs_id: selectedCS })
        .eq('id', unitId);

      setShowAssignModal(null);
      setSelectedCS('');
      loadData();
      alert('CS assigned successfully');
    } catch (error) {
      console.error('Error assigning CS:', error);
      alert('Failed to assign CS');
    }
  };

  const handleRemoveCS = async (unitId) => {
    if (!confirm('Remove CS assignment?')) return;
    
    try {
      await supabase
        .from('units')
        .update({ assigned_cs_id: null })
        .eq('id', unitId);

      loadData();
    } catch (error) {
      console.error('Error removing CS:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 p-6 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage customer service accounts and unit assignments</p>
        </div>
        <button 
          onClick={() => setShowAddUserModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Add Customer Service
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map(unit => (
          <div key={unit.id} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{unit.name}</h3>
                <p className="text-xs text-gray-500">{unit.location}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className={`p-2 rounded-lg h-12 flex items-center text-xs ${
                unit.user_profiles ? 'bg-gray-50 border' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {unit.user_profiles ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-gray-900">{unit.user_profiles.full_name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setShowAssignModal(unit.id);
                          setSelectedCS(unit.assigned_cs_id);
                        }}
                        className="text-blue-600 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveCS(unit.id)}
                        className="text-red-600 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <p className="text-yellow-800">No CS assigned</p>
                    <button 
                      onClick={() => setShowAssignModal(unit.id)}
                      className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Customer Service</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customerServices.map(cs => {
                const assignedUnit = units.find(u => u.assigned_cs_id === cs.id);
                return (
                  <tr key={cs.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{cs.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{cs.email}</td>
                    <td className="px-6 py-4">
                      {assignedUnit ? (
                        <span className="text-sm text-gray-900">{assignedUnit.name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Customer Service</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  minLength="6"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" 
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Assign Customer Service</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select CS</label>
                <select 
                  value={selectedCS}
                  onChange={(e) => setSelectedCS(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select...</option>
                  {customerServices.map(cs => (
                    <option key={cs.id} value={cs.id}>{cs.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowAssignModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAssignCS(showAssignModal)}
                  disabled={!selectedCS}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;