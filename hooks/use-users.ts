'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserMinimal } from '@/types/user.types';

export interface UseUsersOptions {
  role?: 'admin' | 'store_manager';
}

export function useUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUsers = useCallback(async (options: UseUsersOptions = {}): Promise<UserMinimal[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('users')
        .select('id, email, role');
      
      if (options.role) {
        query = query.eq('role', options.role);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as UserMinimal[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserById = useCallback(async (userId: string): Promise<UserMinimal | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return data as UserMinimal;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: { email: string; password: string; role: string }): Promise<UserMinimal | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }
      
      // Create user profile
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
      
      if (error) throw error;
      
      return data as UserMinimal;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: { email?: string; role?: string; password?: string }): Promise<UserMinimal | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Update password if provided
      if (userData.password) {
        // Note: In a real implementation, you would need admin privileges to update password
        // This is just a simplified version
        const { error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: userData.password }
        );
        
        if (authError) throw authError;
      }
      
      // Update user profile
      const { data, error } = await supabase
        .from('users')
        .update({
          ...(userData.email && { email: userData.email }),
          ...(userData.role && { role: userData.role }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data as UserMinimal;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;
      
      // Delete user profile
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
  };
}