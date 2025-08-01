'use client';

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Unit, 
  UnitListItem, 
  UnitWithImages,
  UnitStats,
  UnitActivity,
  RewardCategory,
  CreateUnitPayload,
  UpdateUnitPayload,
  UploadImagePayload
} from '@/types/unit.types';

export function useUnits() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all units (trust AuthProvider for auth)
  const getUnits = useCallback(async (): Promise<UnitListItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('units')
        .select(`
          id,
          name,
          assigned_manager_id,
          created_at,
          updated_at
        `);
      
      if (error) throw error;
      
      const transformedData: UnitListItem[] = data.map(unit => ({
        ...unit,
        status: 'active' as const,
        last_updated: unit.updated_at,
        manager_name: 'Store Manager',
        usage_today: Math.floor(Math.random() * 50)
      }));
      
      return transformedData;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get single unit with images
  const getUnit = useCallback(async (unitId: string): Promise<UnitWithImages | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select(`
          id,
          name,
          assigned_manager_id,
          created_at,
          updated_at
        `)
        .eq('id', unitId)
        .single();
      
      if (unitError) throw unitError;
      
      const { data: imagesData, error: imagesError } = await supabase
        .from('unit_images')
        .select('*')
        .eq('unit_id', unitId);
      
      if (imagesError) throw imagesError;
      
      const images: { [key in RewardCategory]?: any } = {};
      imagesData?.forEach(image => {
        if (image.category === 'small_prize' || 
            image.category === 'medium_prize' || 
            image.category === 'top_prize') {
          images[image.category] = image;
        }
      });
      
      return {
        ...unitData,
        images,
        status: 'active' as const,
        lastUpdated: unitData.updated_at,
        manager: undefined
      };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mock stats (no auth conflicts)
  const getUnitStats = useCallback(async (unitId: string): Promise<UnitStats> => {
    return {
      totalSessions: 1250,
      avgSmileScore: 0.78,
      usageToday: 42,
      lastActivity: new Date().toISOString()
    };
  }, []);

  // Mock activity (no auth conflicts)
  const getUnitActivity = useCallback(async (unitId: string): Promise<UnitActivity[]> => {
    return [
      {
        id: '1',
        unitId,
        action: 'updated image',
        userId: 'user1',
        userName: 'John Doe',
        timestamp: new Date().toISOString(),
        category: 'medium_prize'
      }
    ];
  }, []);

  // Basic CRUD operations (no auth validation)
  const createUnit = useCallback(async (payload: CreateUnitPayload): Promise<Unit | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('units')
        .insert({
          name: payload.name,
          assigned_manager_id: payload.assigned_manager_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUnit = useCallback(async (unitId: string, payload: UpdateUnitPayload): Promise<Unit | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('units')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', unitId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadUnitImage = useCallback(async ({ unitId, category, file, userId }: UploadImagePayload): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filePath = `units/${unitId}/${category}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('unit-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase
        .storage
        .from('unit-images')
        .getPublicUrl(filePath);
      
      const { error: dbError } = await supabase
        .from('unit_images')
        .upsert({
          unit_id: unitId,
          category,
          image_url: publicUrl,
          updated_by: userId,
          updated_at: new Date().toISOString()
        });
      
      if (dbError) throw dbError;
      return publicUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getUnits,
    getUnit,
    getUnitStats,
    getUnitActivity,
    createUnit,
    updateUnit,
    uploadUnitImage
  };
}