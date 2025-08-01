'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UnitListItem } from '@/types/unit.types';

export interface DashboardStats {
  totalUnits: number;
  activeUnits: number;
  totalUsers: number;
  totalSessions: number;
  usersTrend: { value: string; label: string };
  sessionsTrend: { value: string; label: string };
}

interface DashboardActivityItem {
  id: string;
  unitId: string;
  unitName: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  category?: string;
  type: 'upload' | 'schedule' | 'update' | 'status';
}

export function useDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUnits: 0,
    activeUnits: 0,
    totalUsers: 0,
    totalSessions: 0,
    usersTrend: { value: '+0', label: 'from last week' },
    sessionsTrend: { value: '+0%', label: 'from last week' }
  });
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [activities, setActivities] = useState<DashboardActivityItem[]>([]);

  // Fetch dashboard data (no auth conflicts - trust AuthProvider)
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch units (AuthProvider already handles auth state)
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select(`
          id,
          name,
          assigned_manager_id,
          created_at,
          updated_at
        `);

      if (unitsError) throw unitsError;

      // Transform units data
      const transformedUnits: UnitListItem[] = unitsData.map(unit => ({
        ...unit,
        status: 'active',
        last_updated: unit.updated_at,
        manager_name: 'Store Manager',
        usage_today: Math.floor(Math.random() * 50)
      }));

      setUnits(transformedUnits);

      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Update stats
      setStats({
        totalUnits: transformedUnits.length,
        activeUnits: transformedUnits.filter(u => u.status === 'active').length,
        totalUsers: usersCount || 0,
        totalSessions: 1293, // Mock data
        usersTrend: { value: '+2', label: 'new this week' },
        sessionsTrend: { value: '+12%', label: 'from last week' }
      });

      // Mock activities
      const mockActivities: DashboardActivityItem[] = [
        {
          id: '1',
          unitId: transformedUnits[0]?.id || 'unit_1',
          unitName: transformedUnits[0]?.name || 'Unit 1',
          action: 'uploaded a new image for Medium Prize',
          userId: 'user1',
          userName: 'John Doe',
          timestamp: new Date().toISOString(),
          category: 'medium_prize',
          type: 'upload'
        }
      ];

      setActivities(mockActivities);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    isLoading,
    error,
    stats,
    units,
    activities,
    refreshDashboard
  };
}