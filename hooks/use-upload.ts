'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error' | 'canceled';

interface UploadOptions {
  bucket?: string;
  path?: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function useUpload(options: UploadOptions = {}) {
  const {
    bucket = 'unit-images',
    path = '',
    maxSizeInMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  } = options;

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeInMB}MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`
      };
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not supported. Please upload ${allowedTypes.map(t => t.replace('image/', '').toUpperCase()).join(', ')}`
      };
    }
    
    return { valid: true };
  }, [maxSizeInMB, allowedTypes]);

  const uploadFile = useCallback(async (file: File, customPath?: string): Promise<UploadResult> => {
    // Reset state
    setUploadProgress(0);
    setUploadStatus('idle');
    setError(null);
    
    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || null);
        setUploadStatus('error');
        return { success: false, error: validation.error };
      }
      
      setUploadStatus('uploading');
      
      // Create an abort controller for cancellation
      const controller = new AbortController();
      setAbortController(controller);
      
      // Generate a unique file path
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = customPath 
        ? `${customPath}/${fileName}` 
        : path 
          ? `${path}/${fileName}` 
          : fileName;
      
      // Use ArrayBuffer for better progress tracking
      const fileBuffer = await file.arrayBuffer();
      
      // Simulate upload progress (Supabase doesn't provide progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 5, 95);
          return newProgress;
        });
      }, 100);
      
      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          contentType: file.type
        });
      
      clearInterval(progressInterval);
      
      if (uploadError) {
        setUploadStatus('error');
        setError(uploadError.message);
        return { success: false, error: uploadError.message };
      }
      
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return { success: true, url: publicUrl };
    } catch (err: any) {
      setUploadStatus('error');
      const errorMessage = err.message || 'Failed to upload file';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setAbortController(null);
    }
  }, [bucket, path, validateFile]);

  const cancelUpload = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setUploadStatus('canceled');
      setError('Upload canceled');
    }
  }, [abortController]);

  const reset = useCallback(() => {
    setUploadProgress(0);
    setUploadStatus('idle');
    setError(null);
    setAbortController(null);
  }, []);

  return {
    uploadFile,
    uploadProgress,
    uploadStatus,
    error,
    cancelUpload,
    reset,
    validateFile
  };
}