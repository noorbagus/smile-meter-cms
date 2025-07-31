// actions/units.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabase } from '@/lib/supabase';
import { CreateUnitPayload, UpdateUnitPayload } from '@/types/unit.types';

async function validateSession() {
  const supabase = getServiceSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { success: false, error: 'Authentication required' };
  }
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
    
  if (userError) {
    return { success: false, error: userError.message };
  }
  
  return { success: true, session, userId: session.user.id, role: userData.role };
}

async function validateAdminSession() {
  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return sessionResult;
  }
  
  if (sessionResult.role !== 'admin') {
    return { success: false, error: 'Admin privileges required' };
  }
  
  return sessionResult;
}

async function checkUnitAccess(unitId: string, userId: string, role: string) {
  if (role === 'admin') return true;
  
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('units')
    .select('assigned_manager_id')
    .eq('id', unitId)
    .single();
    
  return data?.assigned_manager_id === userId;
}

// Create a new unit
export async function createUnit(data: CreateUnitPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const sessionResult = await validateAdminSession();
    if (!sessionResult.success) {
      return sessionResult;
    }

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
    const sessionResult = await validateSession();
    if (!sessionResult.success) {
      return sessionResult;
    }

    const { userId, role } = sessionResult;
    
    if (!userId || !role) {
      return { success: false, error: 'Invalid session data' };
    }
    
    // Check unit access
    const hasAccess = await checkUnitAccess(unitId, userId, role);
    if (!hasAccess) {
      return { success: false, error: 'You do not have permission to update this unit' };
    }

    const supabase = getServiceSupabase();
    
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    
    // Only admins can change assigned manager
    if (role !== 'admin' && data.assigned_manager_id !== undefined) {
      delete updateData.assigned_manager_id;
    }
    
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

// Delete a unit
export async function deleteUnit(unitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionResult = await validateAdminSession();
    if (!sessionResult.success) {
      return sessionResult;
    }

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
    
    if (!unitId) {
      return { success: false, error: 'Unit ID is required' };
    }

    const sessionResult = await validateSession();
    if (!sessionResult.success) {
      return sessionResult;
    }

    const { userId, role } = sessionResult;
    
    if (!userId || !role) {
      return { success: false, error: 'Invalid session data' };
    }
    
    // Check unit access
    const hasAccess = await checkUnitAccess(unitId, userId, role);
    if (!hasAccess) {
      return { success: false, error: 'You do not have permission to upload images for this unit' };
    }
    
    // Forward to API endpoint for multipart handling
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/units/${unitId}/images`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Upload failed' };
    }
    
    revalidatePath(`/units/${unitId}`);
    
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to upload image' };
  }
}