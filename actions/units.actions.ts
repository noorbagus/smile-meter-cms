// actions/units.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabase } from '@/lib/supabase';
import { CreateUnitPayload, UpdateUnitPayload } from '@/types/unit.types';

// Create a new unit
export async function createUnit(data: CreateUnitPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = getServiceSupabase();
    
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
    
    // Revalidate cached data
    revalidatePath('/units');
    revalidatePath('/dashboard');
    
    return { success: true, data: unit };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create unit' };
  }
}

// Update an existing unit
export async function updateUnit(unitId: string, data: UpdateUnitPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = getServiceSupabase();
    
    const { data: unit, error } = await supabase
      .from('units')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', unitId)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Revalidate cached data
    revalidatePath('/units');
    revalidatePath(`/units/${unitId}`);
    revalidatePath('/dashboard');
    
    return { success: true, data: unit };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update unit' };
  }
}

// Delete a unit
export async function deleteUnit(unitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServiceSupabase();
    
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
    
    // Revalidate cached data
    revalidatePath('/units');
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete unit' };
  }
}

// Upload unit image
export async function uploadUnitImage(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const unitId = formData.get('unitId') as string;
    
    // We're using fetch here since we need to handle multipart/form-data
    const response = await fetch(`/api/units/${unitId}/images`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Upload failed' };
    }
    
    // Revalidate cached data
    revalidatePath(`/units/${unitId}`);
    
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to upload image' };
  }
}