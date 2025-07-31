// Path: hooks/use-units.ts
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
import { useAuth } from './use-auth';

export function useUnits() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all units with basic info
  const getUnits = useCallback(async (): Promise<UnitListItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('units')
        .select(`
          id,
          name,
          assigned_manager_id,
          created_at,
          updated_at
        `);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data to include additional fields
      const transformedData: UnitListItem[] = data.map(unit => ({
        ...unit,
        status: 'active' as const,
        last_updated: unit.updated_at,
        manager_name: 'Store Manager', // Mocked for now
        usage_today: Math.floor(Math.random() * 50) // Mocked for now
      }));
      
      return transformedData;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a single unit with detailed info
  const getUnit = useCallback(async (unitId: string): Promise<UnitWithImages | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get unit details
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
      
      // Get unit images
      const { data: imagesData, error: imagesError } = await supabase
        .from('unit-images')
        .select('*')
        .eq('unit_id', unitId);
      
      if (imagesError) throw imagesError;
      
      // Format images by category
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
        manager: undefined // Will be populated with actual manager data when available
      };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get unit statistics
  const getUnitStats = useCallback(async (unitId: string): Promise<UnitStats> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would query actual data
      // For now, return mock data
      return {
        totalSessions: 1250,
        avgSmileScore: 0.78,
        usageToday: 42,
        lastActivity: new Date().toISOString()
      };
    } catch (err: any) {
      setError(err.message);
      return {
        totalSessions: 0,
        avgSmileScore: 0,
        usageToday: 0
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get unit activity history
  const getUnitActivity = useCallback(async (unitId: string): Promise<UnitActivity[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would query an activity log table
      // For now, return mock data
      return [
        {
          id: '1',
          unitId,
          action: 'updated image',
          userId: 'user1',
          userName: 'John Doe',
          timestamp: new Date().toISOString(),
          category: 'medium_prize'
        },
        {
          id: '2',
          unitId,
          action: 'updated image',
          userId: 'user1',
          userName: 'John Doe',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          category: 'small_prize'
        }
      ];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new unit - UPDATED to return the created unit
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
        .select()  // Added to return the created unit
        .single(); // Added to get single unit instead of array
      
      if (error) throw error;
      
      return data; // Return the created unit with its ID
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update an existing unit
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

  // Upload an image for a unit
  const uploadUnitImage = useCallback(async ({ unitId, category, file, userId }: UploadImagePayload): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate a unique file path
      const filePath = `units/${unitId}/${category}/${Date.now()}_${file.name}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('unit-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('unit-images')
        .getPublicUrl(filePath);
      
      // Save to database
      const { error: dbError } = await supabase
        .from('unit-images')
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