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

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch units
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
        status: 'active', // Default status for now
        last_updated: unit.updated_at,
        manager_name: 'Store Manager', // Would be fetched from users table in a real implementation
        usage_today: Math.floor(Math.random() * 50) // Mock data for now
      }));

      setUnits(transformedUnits);

      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get total sessions (mock data for now)
      const totalSessions = 1293;

      // Update stats
      setStats({
        totalUnits: transformedUnits.length,
        activeUnits: transformedUnits.filter(u => u.status === 'active').length,
        totalUsers: usersCount || 0,
        totalSessions,
        usersTrend: { value: '+2', label: 'new this week' },
        sessionsTrend: { value: '+12%', label: 'from last week' }
      });

      // Mock activities for now
      // In a real implementation, this would query an activity log table
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
        },
        {
          id: '2',
          unitId: transformedUnits[1]?.id || 'unit_2',
          unitName: transformedUnits[1]?.name || 'Unit 2',
          action: 'scheduled images for tomorrow',
          userId: 'user2',
          userName: 'Emily Chen',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          type: 'schedule'
        },
        {
          id: '3',
          unitId: transformedUnits[2]?.id || 'unit_3',
          unitName: transformedUnits[2]?.name || 'Unit 3',
          action: 'updated Top Prize image',
          userId: 'user3',
          userName: 'Jane Smith',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          category: 'top_prize',
          type: 'update'
        },
        {
          id: '4',
          unitId: transformedUnits[3]?.id || 'unit_4',
          unitName: transformedUnits[3]?.name || 'Unit 4',
          action: 'is now inactive',
          userId: 'system',
          userName: 'System',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'status'
        },
      ];

      setActivities(mockActivities);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh dashboard data
  const refreshDashboard = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Initial fetch
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