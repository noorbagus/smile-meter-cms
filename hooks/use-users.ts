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

  return {
    getUsers,
    isLoading,
    error
  };
}