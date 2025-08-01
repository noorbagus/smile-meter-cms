'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { RewardCategory, UnitImage } from '@/types/unit.types';
import { UploadResult } from '@/types/image.types';

/**
 * Get server-side Supabase client with cookies
 */
function getServerSupabase() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

/**
 * Get all images for a unit (read-only operation)
 */
export async function getUnitImages(unitId: string) {
  try {
    const supabase = getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Authentication required',
        message: 'Authentication required'
      };
    }
    
    // Get images (use unit_images table)
    const { data, error } = await supabase
      .from('unit_images')
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

// REMOVED: Upload and delete operations that caused validation conflicts
// - validateSession() with complex role checking
// - uploadUnitImage() - should use API route for file handling
// - deleteUnitImage() - should use API route for proper authorization
//
// File operations are better handled in API routes with proper service role keys
// This eliminates server action auth conflicts while maintaining read functionality