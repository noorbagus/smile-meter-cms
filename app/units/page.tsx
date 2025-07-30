'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { useUnits } from '@/hooks/use-units';
import { UnitListItem } from '@/types/unit.types';
import { Button } from '@/components/ui/button';
import UnitCard from '@/components/units/unit-card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<UnitListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { getUnits, error } = useUnits();
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUnits = async () => {
      setIsLoading(true);
      try {
        const unitsData = await getUnits();
        setUnits(unitsData);
        setFilteredUnits(unitsData);
      } catch (err) {
        console.error('Error fetching units:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnits();
  }, [getUnits]);

  // Filter units based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUnits(units);
      return;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = units.filter(
      unit => 
        unit.name.toLowerCase().includes(lowerCaseSearch) ||
        (unit.manager_name && unit.manager_name.toLowerCase().includes(lowerCaseSearch))
    );
    setFilteredUnits(filtered);
  }, [searchTerm, units]);

  const handleCreateUnit = () => {
    router.push('/units/create');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Unit Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-auto min-w-[200px]"
            />
          </div>
          
          {isAdmin && (
            <Button onClick={handleCreateUnit} className="flex items-center gap-2">
              <Plus size={16} />
              <span>Create Unit</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 h-48 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredUnits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No units found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'No units match your search criteria.' : 'Create your first unit to get started.'}
          </p>
          {isAdmin && !searchTerm && (
            <Button onClick={handleCreateUnit}>Create Unit</Button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg text-red-800">
          <h3 className="font-medium">Error loading units</h3>
          <p className="mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}