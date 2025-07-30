import { UnitListItem } from './unit.types';
import { UserMinimal } from './user.types';

/**
 * Dashboard statistics data
 */
export interface DashboardStats {
  totalUnits: number;
  activeUnits: number;
  totalUsers: number;
  totalSessions: number;
  usersTrend: StatTrend;
  sessionsTrend: StatTrend;
}

/**
 * Trend information for a statistic
 */
export interface StatTrend {
  value: string; // Formatted value with sign (e.g., "+12%", "-5")
  label: string; // Context (e.g., "from last week")
  positive?: boolean; // Optional flag for styling
}

/**
 * Activity type for dashboard activity feed
 */
export type ActivityType = 'upload' | 'schedule' | 'update' | 'status';

/**
 * Activity item in the dashboard feed
 */
export interface ActivityItem {
  id: string;
  unit: {
    id: string;
    name: string;
  };
  action: string;
  user: {
    id: string;
    name: string;
  };
  time: string;
  type: ActivityType;
  category?: string; // Optional reward category
}

/**
 * Dashboard data containing all necessary information
 */
export interface DashboardData {
  stats: DashboardStats;
  units: UnitListItem[];
  recentActivities: ActivityItem[];
  topUsers?: UserMinimal[]; // Optional top active users
}

/**
 * Quick action menu item
 */
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  bgColor: string;
  adminOnly?: boolean;
}

/**
 * Dashboard filter options
 */
export interface DashboardFilters {
  timeRange: 'today' | 'week' | 'month' | 'year';
  unitStatus?: 'all' | 'active' | 'inactive';
  sortBy?: 'activity' | 'name' | 'status';
}