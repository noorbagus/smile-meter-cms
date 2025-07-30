import { UnitImage } from './unit.types';

/**
 * Status of an image upload process
 */
export type UploadStatus = 
  | 'idle'       // No upload in progress
  | 'uploading'  // File is being uploaded to storage
  | 'processing' // Upload complete, processing database update
  | 'success'    // Upload and processing complete
  | 'error'      // Upload failed
  | 'canceled';  // Upload was canceled by user

/**
 * Result of an image upload operation
 */
export interface UploadResult {
  success: boolean;
  message: string;
  data?: UnitImage;
  error?: string;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
}

/**
 * Configuration options for image uploads
 */
export interface ImageUploadConfig {
  maxSizeInMB: number;
  allowedTypes: string[];
  storageBucket: string;
  defaultFileExtension: string;
}

/**
 * Details about a file being uploaded
 */
export interface FileUploadDetails {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  lastModified: number;
}

/**
 * Payload for scheduling an image
 */
export interface ScheduleImagePayload {
  unitId: string;
  category: string;
  imageUrl: string;
  scheduledDate: string;
  scheduledBy: string;
}

/**
 * Upload history item
 */
export interface UploadHistoryItem {
  id: string;
  unitId: string;
  unitName: string;
  category: string;
  imageUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

/**
 * Image replacement history
 */
export interface ImageReplacement {
  id: string;
  unitId: string;
  category: string;
  previousUrl: string;
  newUrl: string;
  replacedBy: string;
  replacedAt: string;
}