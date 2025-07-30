// actions/users.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabase } from '@/lib/supabase';
import { UserMinimal } from '@/types/user.types';

interface CreateUserData {
  email: string;
  password: string;
  role: string;
}

interface UpdateUserData {
  email?: string;
  password?: string;
  role?: string;
}

export async function createUser(userData: CreateUserData): Promise<{ success: boolean; data?: UserMinimal; error?: string }> {
  try {
    const supabase = getServiceSupabase();
    
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });
    
    if (authError) {
      return { success: false, error: authError.message };
    }
    
    if (!authData.user) {
      return { success: false, error: 'Failed to create user' };
    }
    
    // Create the user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        role: userData.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      // Rollback auth user creation if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/users');
    return { success: true, data: data as UserMinimal };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateUser(userId: string, userData: UpdateUserData): Promise<{ success: boolean; data?: UserMinimal; error?: string }> {
  try {
    const supabase = getServiceSupabase();
    
    // Update password if provided
    if (userData.password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId, 
        { password: userData.password }
      );
      
      if (authError) {
        return { success: false, error: authError.message };
      }
    }
    
    // Update email if provided (requires auth update too)
    if (userData.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId, 
        { email: userData.email }
      );
      
      if (authError) {
        return { success: false, error: authError.message };
      }
    }
    
    // Update user profile
    const updateData: any = {};
    
    if (userData.email) updateData.email = userData.email;
    if (userData.role) updateData.role = userData.role;
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/users');
    revalidatePath(`/users/${userId}`);
    return { success: true, data: data as UserMinimal };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServiceSupabase();
    
    // Delete the auth user first
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      return { success: false, error: authError.message };
    }
    
    // Delete the user profile
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function getUserById(userId: string): Promise<{ success: boolean; data?: UserMinimal; error?: string }> {
  try {
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as UserMinimal };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function getUsers(role?: string): Promise<{ success: boolean; data?: UserMinimal[]; error?: string }> {
  try {
    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('users')
      .select('id, email, role');
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as UserMinimal[] };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}