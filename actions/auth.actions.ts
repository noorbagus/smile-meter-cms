'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

type UserRole = 'admin' | 'store_manager';

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  assigned_units?: string[];
}

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
 * Server action to handle user sign in
 */
export async function signIn(email: string, password: string) {
  try {
    const supabase = getServerSupabase();
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
    const supabase = getServerSupabase();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Sign out successful' };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Server action to get current user profile (no validation conflicts)
 */
export async function getCurrentUser() {
  try {
    const supabase = getServerSupabase();
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
 * Server action to check if user has access to a unit (no validation conflicts)
 */
export async function checkUnitAccess(unitId: string) {
  try {
    const supabase = getServerSupabase();
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

    return { success: true, hasAccess: !!data };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

// REMOVED: validateAdminSession, createUser, updateUser, deleteUser
// These functions used conflicting validation and should be handled by API routes instead
// This eliminates server action auth conflicts while maintaining core functionality