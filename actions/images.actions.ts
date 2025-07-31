'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { RewardCategory, UnitImage } from '@/types/unit.types';
import { UploadResult } from '@/types/image.types';

/**
 * Generate a unique filename for uploaded images
 */
function generateUniqueFilename(originalName: string, prefix: string = ''): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  
  return `${prefix}${timestamp}_${randomString}.${extension}`;
}

/**
 * Validate image file type and size
 */
function validateImage(
  file: File, 
  maxSizeInMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): { valid: boolean; error?: string } {
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
}

/**
 * Upload image for a unit
 */
export async function uploadUnitImage(
  unitId: string,
  category: RewardCategory,
  file: File,
  userId: string
): Promise<UploadResult<UnitImage>> {
  try {
    // Validate file
    const validation = validateImage(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        message: validation.error || 'Invalid image'
      };
    }
    
    // Check if user has access to this unit
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Authentication required',
        message: 'Authentication required'
      };
    }
    
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      return {
        success: false,
        error: userError.message,
        message: 'Failed to verify user permissions'
      };
    }
    
    // If not admin, check if user is assigned to this unit
    if (userData.role !== 'admin') {
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('assigned_manager_id')
        .eq('id', unitId)
        .single();
      
      if (unitError || unitData.assigned_manager_id !== session.user.id) {
        return {
          success: false,
          error: 'You do not have permission to upload images for this unit',
          message: 'Permission denied'
        };
      }
    }
    
    // Generate a unique file path
    const fileName = generateUniqueFilename(file.name, `unit_${unitId}_${category}_`);
    const filePath = `units/${unitId}/${category}/${fileName}`;
    
    // Upload file to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('unit-images')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      });
    
    if (uploadError) {
      return {
        success: false,
        error: uploadError.message,
        message: 'Failed to upload image to storage'
      };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('unit-images')
      .getPublicUrl(filePath);
    
    // Check if an image already exists for this category
    const { data: existingImage } = await supabase
      .from('unit-images')
      .select('id')
      .eq('unit_id', unitId)
      .eq('category', category)
      .maybeSingle();
    
    let result;
    
    if (existingImage) {
      // Update existing image record
      const { data, error } = await supabase
        .from('unit-images')
        .update({
          image_url: publicUrl,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingImage.id)
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to update image record'
        };
      }
      
      result = data;
    } else {
      // Create new image record
      const { data, error } = await supabase
        .from('unit-images')
        .insert({
          unit_id: unitId,
          category,
          image_url: publicUrl,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        return {
          success: false,
          error: error.message,
          message: 'Failed to create image record'
        };
      }
      
      result = data;
    }
    
    // Revalidate pages to show updated images
    revalidatePath(`/units/${unitId}`);
    revalidatePath('/units');
    
    // Type assertion to ensure compatibility
    const typedResult: UnitImage = {
      ...result,
      category: result.category as RewardCategory
    };
    
    return {
      success: true,
      data: typedResult,
      message: 'Image uploaded successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      message: 'Failed to upload image'
    };
  }
}

/**
 * Delete a unit image
 */
export async function deleteUnitImage(imageId: string): Promise<UploadResult<void>> {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Authentication required',
        message: 'Authentication required'
      };
    }
    
    // Get image details
    const { data: imageData, error: imageError } = await supabase
      .from('unit-images')
      .select('unit_id, image_url')
      .eq('id', imageId)
      .single();
    
    if (imageError) {
      return {
        success: false,
        error: imageError.message,
        message: 'Image not found'
      };
    }
    
    // Check permission to delete
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      return {
        success: false,
        error: userError.message,
        message: 'Failed to verify user permissions'
      };
    }
    
    // If not admin, check if assigned to this unit
    if (userData.role !== 'admin') {
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('assigned_manager_id')
        .eq('id', imageData.unit_id)
        .single();
      
      if (unitError || unitData.assigned_manager_id !== session.user.id) {
        return {
          success: false,
          error: 'You do not have permission to delete images for this unit',
          message: 'Permission denied'
        };
      }
    }
    
    // Extract storage path from image URL
    const urlObj = new URL(imageData.image_url);
    const pathSegments = urlObj.pathname.split('/');
    const storagePath = pathSegments.slice(pathSegments.indexOf('unit-images') + 1).join('/');
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('unit-images')
      .remove([storagePath]);
    
    if (storageError) {
      return {
        success: false,
        error: storageError.message,
        message: 'Failed to delete image from storage'
      };
    }
    
    // Delete from database
    const { error } = await supabase
      .from('unit-images')
      .delete()
      .eq('id', imageId);
    
    if (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete image record'
      };
    }
    
    // Revalidate pages
    revalidatePath(`/units/${imageData.unit_id}`);
    revalidatePath('/units');
    
    return {
      success: true,
      message: 'Image deleted successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      message: 'Failed to delete image'
    };
  }
}

/**
 * Get all images for a unit
 */
export async function getUnitImages(unitId: string) {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Authentication required',
        message: 'Authentication required'
      };
    }
    
    // Check permission to access unit
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      return {
        success: false,
        error: userError.message,
        message: 'Failed to verify user permissions'
      };
    }
    
    // If not admin, check if assigned to this unit
    if (userData.role !== 'admin') {
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('assigned_manager_id')
        .eq('id', unitId)
        .single();
      
      if (unitError || unitData.assigned_manager_id !== session.user.id) {
        return {
          success: false,
          error: 'You do not have permission to access images for this unit',
          message: 'Permission denied'
        };
      }
    }
    
    // Get images
    const { data, error } = await supabase
      .from('unit-images')
      .select('*')
      .eq('unit_id', unitId);
    
    if (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch images'
      };
    }
    
    // Group images by category with type assertion
    const groupedImages: Record<RewardCategory, UnitImage | null> = {
      small_prize: null,
      medium_prize: null,
      top_prize: null
    };
    
    data.forEach(image => {
      if (image.category && ['small_prize', 'medium_prize', 'top_prize'].includes(image.category)) {
        const typedImage: UnitImage = {
          ...image,
          category: image.category as RewardCategory
        };
        groupedImages[image.category as RewardCategory] = typedImage;
      }
    });
    
    return {
      success: true,
      data: groupedImages,
      message: 'Images retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      message: 'Failed to fetch images'
    };
  }
}