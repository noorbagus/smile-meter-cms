'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Plus, Trash2, Upload, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useUnits } from '@/hooks/use-units';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { RewardCategory, UnitListItem } from '@/types/unit.types';

interface ScheduledImage {
  id: string;
  unit_id: string;
  unit_name: string;
  category: RewardCategory;
  image_url: string;
  scheduled_date: string;
  scheduled_by: string;
  created_at: string;
  status: 'pending' | 'active' | 'expired';
}

export default function SchedulePage() {
  const [scheduledImages, setScheduledImages] = useState<ScheduledImage[]>([]);
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory>('small_prize');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getUnits } = useUnits();
  const { user, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const unitIdFromQuery = searchParams?.get('unitId');

  // Load units and scheduled images
  useEffect(() => {
    const loadData = async () => {
      try {
        const unitsData = await getUnits();
        setUnits(unitsData);
        
        if (unitIdFromQuery) {
          setSelectedUnit(unitIdFromQuery);
        }

        await loadScheduledImages();
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [getUnits, unitIdFromQuery]);

  const loadScheduledImages = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_images')
        .select(`
          *,
          units!inner(name)
        `)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const transformedData: ScheduledImage[] = data.map(item => ({
        id: item.id,
        unit_id: item.unit_id,
        unit_name: item.units.name,
        category: item.category as RewardCategory,
        image_url: item.image_url,
        scheduled_date: item.scheduled_date,
        scheduled_by: item.scheduled_by || '',
        created_at: item.created_at,
        status: getImageStatus(item.scheduled_date)
      }));

      setScheduledImages(transformedData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getImageStatus = (scheduledDate: string): 'pending' | 'active' | 'expired' => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduleDay = new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate());
    
    if (scheduleDay > today) return 'pending';
    if (scheduleDay.getTime() === today.getTime()) return 'active';
    return 'expired';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are supported');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleScheduleImage = async () => {
    if (!selectedUnit || !selectedFile || !selectedDate || !user) {
      setError('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `scheduled_${Date.now()}.${fileExt}`;
      const filePath = `units/${selectedUnit}/${selectedCategory}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('unit_images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('unit_images')
        .getPublicUrl(filePath);

      // Save scheduled image to database
      const { error: dbError } = await supabase
        .from('scheduled_images')
        .insert({
          unit_id: selectedUnit,
          category: selectedCategory,
          image_url: publicUrl,
          scheduled_date: selectedDate,
          scheduled_by: user.id
        });

      if (dbError) throw dbError;

      // Reset form
      setSelectedFile(null);
      setSelectedDate('');
      if (document.getElementById('file-input')) {
        (document.getElementById('file-input') as HTMLInputElement).value = '';
      }

      // Reload scheduled images
      await loadScheduledImages();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScheduled = async (id: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this scheduled image?')) return;

    try {
      // Extract file path from URL and delete from storage
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('units')).join('/');
      
      await supabase.storage.from('unit_images').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('scheduled_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadScheduledImages();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getCategoryLabel = (category: RewardCategory) => {
    const labels = {
      small_prize: 'Small Prize',
      medium_prize: 'Medium Prize',
      top_prize: 'Top Prize'
    };
    return labels[category];
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800'
    };

    const icons = {
      pending: <Clock size={12} className="mr-1" />,
      active: <CheckCircle size={12} className="mr-1" />,
      expired: <Clock size={12} className="mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Schedule Images</h1>
          <p className="text-gray-600 mt-1">Schedule images to be automatically updated on specific dates</p>
        </div>
        <Calendar className="h-8 w-8 text-gray-400" />
      </div>

      {/* Schedule Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-4">Schedule New Image</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select Unit</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as RewardCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="small_prize">Small Prize</option>
              <option value="medium_prize">Medium Prize</option>
              <option value="top_prize">Top Prize</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
            <input
              id="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {selectedFile && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

        <Button
          onClick={handleScheduleImage}
          disabled={!selectedUnit || !selectedFile || !selectedDate || isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <Plus size={16} />
              Schedule Image
            </>
          )}
        </Button>
      </div>

      {/* Scheduled Images List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Scheduled Images</h2>
        </div>

        {scheduledImages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No scheduled images yet. Create your first scheduled image above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Unit</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Scheduled Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Preview</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scheduledImages.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{item.unit_name}</div>
                      <div className="text-xs text-gray-500">{item.unit_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{getCategoryLabel(item.category)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{new Date(item.scheduled_date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={item.image_url}
                        alt="Preview"
                        className="h-12 w-12 object-cover rounded border"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteScheduled(item.id, item.image_url)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}