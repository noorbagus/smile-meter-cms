/**
 * Date utility functions for the Smile Meter CMS
 */

/**
 * Formats a date to a readable string
 * @param date Date to format
 * @param format Format to use (short, medium, long)
 * @returns Formatted date string
 */
export function formatDate(
    date: Date | string, 
    format: 'short' | 'medium' | 'long' = 'medium'
  ): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'numeric' : 'short',
      day: 'numeric',
    };
    
    if (format === 'long') {
      options.weekday = 'long';
      options.month = 'long';
    }
    
    return dateObj.toLocaleDateString(undefined, options);
  }
  
  /**
   * Formats a date to include time
   * @param date Date to format
   * @param includeSeconds Whether to include seconds
   * @returns Formatted date and time string
   */
  export function formatDateTime(
    date: Date | string,
    includeSeconds = false
  ): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    if (includeSeconds) {
      options.second = '2-digit';
    }
    
    return dateObj.toLocaleString(undefined, options);
  }
  
  /**
   * Formats a relative time (e.g., "2 hours ago")
   * @param date Date to format
   * @returns Relative time string
   */
  export function formatRelativeTime(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    
    const seconds = Math.floor(diffInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    
    if (seconds < 60) {
      return 'just now';
    } else if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (days < 30) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (months < 12) {
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  }
  
  /**
   * Gets the start of day for a given date
   * @param date Date to get start of day for
   * @returns Date object set to start of day (00:00:00)
   */
  export function startOfDay(date: Date | string): Date {
    const dateObj = date instanceof Date ? new Date(date) : new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
  }
  
  /**
   * Gets the end of day for a given date
   * @param date Date to get end of day for
   * @returns Date object set to end of day (23:59:59.999)
   */
  export function endOfDay(date: Date | string): Date {
    const dateObj = date instanceof Date ? new Date(date) : new Date(date);
    dateObj.setHours(23, 59, 59, 999);
    return dateObj;
  }
  
  /**
   * Adds days to a date
   * @param date Date to add days to
   * @param days Number of days to add
   * @returns New date with days added
   */
  export function addDays(date: Date | string, days: number): Date {
    const dateObj = date instanceof Date ? new Date(date) : new Date(date);
    dateObj.setDate(dateObj.getDate() + days);
    return dateObj;
  }
  
  /**
   * Formats a date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Formatted date range string
   */
  export function formatDateRange(
    startDate: Date | string,
    endDate: Date | string
  ): string {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    // If same day, only show one date
    if (start.toDateString() === end.toDateString()) {
      return formatDate(start, 'medium');
    }
    
    // If same month and year, only show one month/year
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${start.getDate()} - ${formatDate(end, 'medium')}`;
    }
    
    // Otherwise show full range
    return `${formatDate(start, 'medium')} - ${formatDate(end, 'medium')}`;
  }