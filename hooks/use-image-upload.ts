'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RewardCategory } from '@/types/unit.types';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error' | 'canceled';

interface UploadImageParams {
  unitId: string;
  category: RewardCategory;
  file: File;
  userId: string;
}

interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
}

interface FileDetails {
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
}

export function useImageUpload() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const reset = useCallback(() => {
    setUploadProgress(0);
    setUploadStatus('idle');
    setFileDetails(null);
    setError(null);
    setAbortController(null);
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setUploadStatus('canceled');
    }
  }, [abortController]);

  const validateImage = useCallback((file: File): { valid: boolean; error?: string } => {
    const maxSizeInMB = 5;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeInMB}MB limit`
      };
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, and WebP images are supported'
      };
    }
    
    return { valid: true };
  }, []);

  const uploadImage = useCallback(async ({ unitId, category, file, userId }: UploadImageParams): Promise<UploadResult> => {
    // Reset state
    setUploadProgress(0);
    setUploadStatus('idle');
    setError(null);
    
    try {
      // Validate file
      const validation = validateImage(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Set file details
      setFileDetails({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type,
      });
      
      // Start upload
      setUploadStatus('uploading');
      
      // Create a new abort controller
      const controller = new AbortController();
      setAbortController(controller);
      
      // Generate a unique file path
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `units/${unitId}/${category}/${fileName}`;
      
      // Simulate progress
      setUploadProgress(25);
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase
        .storage
        .from('unit_images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      setUploadProgress(50);
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('unit_images')
        .getPublicUrl(filePath);
      
      setUploadProgress(75);
      setUploadStatus('processing');
      
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
      
      // Upload successful
      setUploadStatus('success');
      setUploadProgress(100);
      
      return {
        success: true,
        data: result,
        message: 'Upload successful'
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload image';
      setError(errorMessage);
      setUploadStatus('error');
      
      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    }
  }, [validateImage]);

  return {
    uploadImage,
    uploadProgress,
    uploadStatus,
    fileDetails,
    error,
    reset,
    cancelUpload
  };
}