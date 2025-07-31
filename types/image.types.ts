// types/image.types.ts
import { RewardCategory } from './unit.types';

// Unit image from database
export interface UnitImage {
  id: string;
  unit_id: string;
  category: RewardCategory;
  image_url: string;
  updated_by?: string;
  updated_at: string;
}

// File details for upload display
export interface FileDetails {
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
}

// Upload status
export type UploadStatus = 
  | 'idle'       // No upload in progress
  | 'uploading'  // File is being uploaded
  | 'processing' // Processing server-side
  | 'success'    // Upload complete
  | 'error'      // Upload failed
  | 'canceled';  // Upload canceled by user

// Upload progress information
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Image upload parameters
export interface UploadImageParams {
  unitId: string;
  category: RewardCategory;
  file: File;
  userId: string;
}

// Result of image upload - made generic to handle different data types
export interface UploadResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}

// Image validation result
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

// Image upload options
export interface ImageUploadOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

// Image gallery item
export interface GalleryImage {
  id: string;
  url: string;
  category: RewardCategory;
  updatedAt: string;
  updatedBy?: string;
}

// Image sizes for optimization
export enum ImageSize {
  THUMBNAIL = 'thumbnail',
  MEDIUM = 'medium',
  LARGE = 'large',
  ORIGINAL = 'original'
}

// Image metadata
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

// Image with cropping coordinates
export interface CroppedImage {
  file: File;
  cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}