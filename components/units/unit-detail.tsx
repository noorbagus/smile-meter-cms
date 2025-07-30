'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Upload, Calendar, BarChart2 } from 'lucide-react';
import { UnitWithImages, UnitStats, UnitActivity } from '@/types/unit.types';
import { useUnits } from '@/hooks/use-units';
import { useAuth } from '@/hooks/use-auth';
import ImageGallery from './image-gallery';
import ActivityLog from './activity-log';
import UploadModal from './upload-modal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UnitHeader from './unit-header';

interface UnitDetailProps {
  unitId: string;
}

export default function UnitDetail({ unitId }: UnitDetailProps) {
  const [unit, setUnit] = useState<UnitWithImages | null>(null);
  const [stats, setStats] = useState<UnitStats | null>(null);
  const [activities, setActivities] = useState<UnitActivity[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { getUnit, getUnitStats, getUnitActivity, isLoading, error } = useUnits();
  const { isAdmin, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        // Fetch unit details
        const unitData = await getUnit(unitId);
        setUnit(unitData);
        
        // Fetch unit stats
        const statsData = await getUnitStats(unitId);
        setStats(statsData);
        
        // Fetch activity log
        const activitiesData = await getUnitActivity(unitId);
        setActivities(activitiesData);
      } catch (err) {
        console.error('Error fetching unit data:', err);
      }
    };
    
    fetchUnitData();
  }, [unitId, getUnit, getUnitStats, getUnitActivity]);

  const handleUploadClick = (category: string) => {
    setSelectedCategory(category);
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = async () => {
    // Refetch unit data to show new images
    const unitData = await getUnit(unitId);
    setUnit(unitData);
    setIsUploadModalOpen(false);
  };

  if (isLoading || !unit) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 rounded w-1/3"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-60 bg-gray-200 rounded"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-800">
        <h3 className="font-medium">Error loading unit</h3>
        <p className="mt-1">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/units')}
        >
          Back to Units
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unit header with basic info */}
      <UnitHeader unit={unit} stats={stats} />
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              variant="outline"
              onClick={() => router.push(`/schedule?unitId=${unitId}`)}
              className="flex items-center gap-2"
            >
              <Calendar size={16} />
              <span>Schedule Images</span>
            </Button>
          </div>
          
          <ImageGallery 
            images={unit.images} 
            onUploadClick={handleUploadClick} 
          />
        </TabsContent>
        
        <TabsContent value="activity">
          <ActivityLog activities={activities} />
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Unit Analytics</h3>
              <Button 
                variant="outline"
                onClick={() => router.push(`/analytics?unitId=${unitId}`)}
                className="flex items-center gap-2"
              >
                <BarChart2 size={16} />
                <span>Full Analytics</span>
              </Button>
            </div>
            
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalSessions}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Average Smile Score</p>
                  <p className="text-2xl font-bold mt-1">{(stats.avgSmileScore * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Today's Usage</p>
                  <p className="text-2xl font-bold mt-1">{stats.usageToday} sessions</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Upload Modal */}
      {isUploadModalOpen && selectedCategory && (
        <UploadModal
          unitId={unitId}
          category={selectedCategory}
          userId={user?.id || ''}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}