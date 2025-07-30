'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { UserProfile, UserRole } from '@/types/auth.types';

/**
 * Server action to handle user sign in
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return { 
        success: true, 
        message: 'Authentication successful but profile fetch failed',
        user: data.user 
      };
    }

    return { 
      success: true, 
      message: 'Sign in successful',
      user: data.user,
      profile: profileData 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Server action to handle user sign out
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Clear cookies
    cookies().delete('supabase-auth-token');
    
    return { success: true, message: 'Sign out successful' };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Server action to get current user profile
 */
export async function getCurrentUser() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { success: false, error: 'No active session' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { 
      success: true, 
      user: session.user,
      profile 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Server action to check if user has access to a unit
 */
export async function checkUnitAccess(unitId: string) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { success: false, error: 'No active session' };
    }

    const userId = session.user.id;

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      return { success: false, error: userError.message };
    }

    // Admins have access to all units
    if (userData.role === 'admin') {
      return { success: true, hasAccess: true };
    }

    // Check if unit is assigned to this manager
    const { data, error } = await supabase
      .from('units')
      .select('id')
      .eq('id', unitId)
      .eq('assigned_manager_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message };
    }

    // User has access if the unit was found
    return { success: true, hasAccess: !!data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Admin only: Create a new user
 */
export async function createUser(
  email: string, 
  password: string, 
  role: UserRole
) {
  try {
    // Check if current user is admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }
    
    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (adminError || adminCheck.role !== 'admin') {
      return { success: false, error: 'Admin privileges required' };
    }
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
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
        email,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      // Try to delete the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/users');
    return { success: true, data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Admin only: Update a user
 */
export async function updateUser(
  userId: string,
  data: {
    email?: string;
    password?: string;
    role?: UserRole;
  }
) {
  try {
    // Check if current user is admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }
    
    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (adminError || adminCheck.role !== 'admin') {
      return { success: false, error: 'Admin privileges required' };
    }
    
    // Update password if provided
    if (data.password) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: data.password }
      );
      
      if (passwordError) {
        return { success: false, error: passwordError.message };
      }
    }
    
    // Update email if provided
    if (data.email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(
        userId,
        { email: data.email }
      );
      
      if (emailError) {
        return { success: false, error: emailError.message };
      }
    }
    
    // Update profile
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/users');
    return { success: true, data: updatedUser };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Admin only: Delete a user
 */
export async function deleteUser(userId: string) {
  try {
    // Check if current user is admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }
    
    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (adminError || adminCheck.role !== 'admin') {
      return { success: false, error: 'Admin privileges required' };
    }
    
    // Delete the user from Auth
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
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}