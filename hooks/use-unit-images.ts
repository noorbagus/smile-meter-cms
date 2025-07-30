'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UnitImage, RewardCategory } from '@/types/unit.types';

interface UseUnitImagesResult {
  images: Record<RewardCategory, UnitImage | null>;
  isLoading: boolean;
  error: string | null;
  fetchImages: (unitId: string) => Promise<Record<RewardCategory, UnitImage | null>>;
  uploadImage: (params: UploadImageParams) => Promise<UnitImage | null>;
  deleteImage: (imageId: string) => Promise<boolean>;
}

interface UploadImageParams {
  unitId: string;
  category: RewardCategory;
  file: File;
  userId: string;
}

export function useUnitImages(): UseUnitImagesResult {
  const [images, setImages] = useState<Record<RewardCategory, UnitImage | null>>({
    small_prize: null,
    medium_prize: null,
    top_prize: null
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async (unitId: string): Promise<Record<RewardCategory, UnitImage | null>> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('unit_images')
        .select('*')
        .eq('unit_id', unitId);
      
      if (error) throw error;
      
      // Create an object with all categories initialized to null
      const imagesMap: Record<RewardCategory, UnitImage | null> = {
        small_prize: null,
        medium_prize: null,
        top_prize: null
      };
      
      // Populate the object with available images
      data?.forEach(image => {
        if (image.category === 'small_prize' || 
            image.category === 'medium_prize' || 
            image.category === 'top_prize') {
          imagesMap[image.category as RewardCategory] = image as UnitImage;
        }
      });
      
      setImages(imagesMap);
      return imagesMap;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch images';
      setError(errorMessage);
      return {
        small_prize: null,
        medium_prize: null,
        top_prize: null
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadImage = useCallback(async ({ unitId, category, file, userId }: UploadImageParams): Promise<UnitImage | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size exceeds 5MB limit');
      }
      
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are supported');
      }
      
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `units/${unitId}/${category}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('unit_images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('unit_images')
        .getPublicUrl(filePath);
      
      // Check if an image already exists for this category
      const { data: existingImage } = await supabase
        .from('unit_images')
        .select('id')
        .eq('unit_id', unitId)
        .eq('category', category)
        .single();
      
      let result;
      
      if (existingImage) {
        // Update existing image
        const { data, error: updateError } = await supabase
          .from('unit_images')
          .update({
            image_url: publicUrl,
            updated_by: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingImage.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        result = data;
      } else {
        // Insert new image
        const { data, error: insertError } = await supabase
          .from('unit_images')
          .insert({
            unit_id: unitId,
            category,
            image_url: publicUrl,
            updated_by: userId,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        result = data;
      }
      
      // Update local state
      if (result) {
        setImages(prev => ({
          ...prev,
          [category]: result as UnitImage
        }));
      }
      
      return result as UnitImage;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload image';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get image data first to get the file path
      const { data: imageData, error: fetchError } = await supabase
        .from('unit_images')
        .select('*')
        .eq('id', imageId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Extract file path from URL
      const imageUrl = imageData.image_url;
      const storageUrl = supabase.storage.from('unit_images').getPublicUrl('').data.publicUrl;
      const filePath = imageUrl.replace(storageUrl + '/', '');
      
      // Delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('unit_images')
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('unit_images')
        .delete()
        .eq('id', imageId);
      
      if (dbError) throw dbError;
      
      // Update local state
      if (imageData.category in images) {
        setImages(prev => ({
          ...prev,
          [imageData.category]: null
        }));
      }
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete image';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [images]);

  return {
    images,
    isLoading,
    error,
    fetchImages,
    uploadImage,
    deleteImage
  };
}