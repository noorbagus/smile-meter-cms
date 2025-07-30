// lib/image-utils.ts
/**
 * Utility functions for image handling in the Smile Meter CMS
 */

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Validates an image file based on type and size restrictions
 * @param file - The file to validate
 * @param maxSizeInMB - Maximum file size in megabytes (default: 5)
 * @param allowedTypes - Array of allowed MIME types (default: JPEG, PNG, WebP)
 * @returns Object containing validation result and error message if any
 */
export function validateImageFile(
  file: File,
  maxSizeInMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit (${formatFileSize(file.size)})`
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
}

/**
 * Generates a unique filename for an image
 * @param originalName - Original filename
 * @param prefix - Optional prefix for the filename
 * @returns Unique filename
 */
export function generateUniqueFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  
  return `${prefix || ''}${timestamp}_${randomString}.${extension}`;
}

/**
 * Extracts the category from an image path
 * @param imagePath - Path or URL of the image
 * @returns Category string or null if not found
 */
export function extractCategoryFromPath(imagePath: string): string | null {
  const categories = ['small_prize', 'medium_prize', 'top_prize'];
  
  for (const category of categories) {
    if (imagePath.includes(category)) {
      return category;
    }
  }
  
  return null;
}