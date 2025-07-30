'use client';

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { UnitListItem } from '@/types/unit.types';
import { useUnits } from '@/hooks/use-units';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import UnitCard from '@/components/units/unit-card';

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);
  const { getUnits, isLoading, error } = useUnits();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchUnits = async () => {
      const data = await getUnits();
      setUnits(data);
    };

    fetchUnits();
  }, [getUnits]);

  // Filter units based on search term
  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.manager_name && unit.manager_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Loading state
  if (isLoading && units.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Unit Management</h1>
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Unit Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search units..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-auto text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {isAdmin && (
            <Button 
              onClick={() => setIsCreatingUnit(true)}
              className="flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-md">
          Error: {error}
        </div>
      )}
      
      {filteredUnits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          {searchTerm ? (
            <p className="text-gray-500">No units match your search criteria.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-500">No units found.</p>
              {isAdmin && (
                <Button 
                  onClick={() => setIsCreatingUnit(true)}
                  className="flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Unit
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TODO: Add CreateUnitModal component when isCreatingUnit is true */}
      {/* {isCreatingUnit && (
        <CreateUnitModal 
          onClose={() => setIsCreatingUnit(false)} 
          onUnitCreated={(newUnit) => {
            setUnits([...units, newUnit]);
            setIsCreatingUnit(false);
          }}
        />
      )} */}
    </div>
  );
}