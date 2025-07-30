import { UnitListItem } from '@/types/unit.types';

/**
 * Formats a timestamp into a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Calculates the percentage of active units
 */
export function calculateActivePercentage(units: UnitListItem[]): number {
  if (units.length === 0) return 0;
  const activeCount = units.filter(unit => unit.status === 'active').length;
  return Math.round((activeCount / units.length) * 100);
}

/**
 * Formats a large number with a suffix (K, M) for readability
 */
export function formatLargeNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`.replace('.0K', 'K');
  return `${(num / 1000000).toFixed(1)}M`.replace('.0M', 'M');
}

/**
 * Calculates percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`.replace('.0%', '%');
}

/**
 * Groups units by status
 */
export function groupUnitsByStatus(units: UnitListItem[]): Record<string, UnitListItem[]> {
  return units.reduce((acc, unit) => {
    const status = unit.status || 'unknown';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(unit);
    return acc;
  }, {} as Record<string, UnitListItem[]>);
}

/**
 * Sorts units by most recent activity
 */
export function sortUnitsByActivity(units: UnitListItem[]): UnitListItem[] {
  return [...units].sort((a, b) => {
    // First sort by usage_today (high to low)
    if ((a.usage_today || 0) !== (b.usage_today || 0)) {
      return (b.usage_today || 0) - (a.usage_today || 0);
    }
    
    // Then by last_updated (recent first)
    const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
    const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
    return dateB - dateA;
  });
}