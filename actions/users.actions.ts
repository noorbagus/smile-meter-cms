'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { UserMinimal } from '@/types/user.types';

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

// Get users (basic read operation)
export async function getUsers(role?: string): Promise<{ success: boolean; data?: UserMinimal[]; error?: string }> {
  try {
    const supabase = getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }
    
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

// Get user by ID (basic read operation)
export async function getUserById(userId: string): Promise<{ success: boolean; data?: UserMinimal; error?: string }> {
  try {
    const supabase = getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }
    
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

// REMOVED: Admin-only operations that caused validation conflicts
// - validateAdminSession()
// - createUser() 
// - updateUser()
// - deleteUser()
//
// These functions should be handled by API routes with proper service role keys
// This eliminates server action auth conflicts with AuthProvider