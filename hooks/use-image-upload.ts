'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  validateImage, 
  formatFileSize, 
  generateUniqueFilename 
} from '@/lib/image-utils';
import { RewardCategory } from '@/types/unit.types';
import { UploadStatus, UploadResult } from '@/types/upload.types';

interface UseImageUploadOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

interface UseImageUploadResult {
  uploadImage: (params: UploadImageParams) => Promise<UploadResult>;
  uploadProgress: number;
  uploadStatus: UploadStatus;
  fileDetails: FileDetails | null;
  error: string | null;
  reset: () => void;
  cancelUpload: () => void;
}

interface UploadImageParams {
  unitId: string;
  category: RewardCategory;
  file: File;
  userId: string;
}

interface FileDetails {
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadResult {
  const { 
    maxSizeInMB = 5, 
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] 
  } = options;
  
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

  const uploadImage = useCallback(async ({ unitId, category, file, userId }: UploadImageParams): Promise<UploadResult> => {
    // Reset state
    setUploadProgress(0);
    setUploadStatus('idle');
    setError(null);
    
    try {
      // Validate file
      const validation = validateImage(file, maxSizeInMB, allowedTypes);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Set file details
      setFileDetails({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
      });
      
      // Create file reader for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setFileDetails(prev => prev ? {
            ...prev,
            previewUrl: e.target.result as string
          } : null);
        }
      };
      reader.readAsDataURL(file);
      
      // Start upload
      setUploadStatus('uploading');
      
      // Create a new abort controller
      const controller = new AbortController();
      setAbortController(controller);
      
      // Generate a unique file path
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = generateUniqueFilename(file.name, `unit_${unitId}_${category}_`);
      const filePath = `units/${unitId}/${category}/${fileName}`;
      
      // Upload to Supabase Storage with progress tracking
      // Note: Supabase JavaScript client doesn't support progress tracking directly
      // This is a workaround using XHR
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }
      
      const uploadPromise = new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Setup progress tracking
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        // Handle completion
        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              // Get public URL
              const { data: { publicUrl } } = supabase
                .storage
                .from('unit_images')
                .getPublicUrl(filePath);
              
              resolve(publicUrl);
            } catch (error) {
              reject(new Error('Failed to get public URL'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload canceled'));
        });
        
        // Send the request
        const storageUrl = `${supabase.supabaseUrl}/storage/v1/object/public/unit_images/${filePath}`;
        xhr.open('POST', storageUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
        
        // Set abort handler
        controller.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      });
      
      // Wait for upload to complete
      const publicUrl = await uploadPromise;
      setUploadStatus('processing');
      
      // Update database
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
  }, [maxSizeInMB, allowedTypes]);

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