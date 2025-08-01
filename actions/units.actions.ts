'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { CreateUnitPayload, UpdateUnitPayload } from '@/types/unit.types';

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

// Create a new unit (no validation conflicts - let API handle auth)
export async function createUnit(data: CreateUnitPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }
    
    const { data: unit, error } = await supabase
      .from('units')
      .insert({
        name: data.name,
        assigned_manager_id: data.assigned_manager_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/units');
    revalidatePath('/dashboard');
    
    return { success: true, data: unit };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create unit' };
  }
}

// Update an existing unit (simplified - no complex validation)
export async function updateUnit(unitId: string, data: UpdateUnitPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }
    
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    
    const { data: unit, error } = await supabase
      .from('units')
      .update(updateData)
      .eq('id', unitId)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/units');
    revalidatePath(`/units/${unitId}`);
    revalidatePath('/dashboard');
    
    return { success: true, data: unit };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update unit' };
  }
}

// Delete a unit (simplified - no complex validation)
export async function deleteUnit(unitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }
    
    // Delete associated images first
    const { error: imagesError } = await supabase
      .from('unit_images')
      .delete()
      .eq('unit_id', unitId);
    
    if (imagesError) {
      return { success: false, error: imagesError.message };
    }
    
    // Delete the unit
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', unitId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/units');
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete unit' };
  }
}

// REMOVED: Complex validation functions that conflicted with AuthProvider
// - validateSession()
// - validateAdminSession() 
// - checkUnitAccess()
// - uploadUnitImage() (should use API route for file uploads)

// This eliminates server action auth conflicts while maintaining core CRUD functionality