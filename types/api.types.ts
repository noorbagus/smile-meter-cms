// types/api.types.ts
// Common API response types

// Success response type
export interface ApiSuccessResponse<T = any> {
    success: true;
    data: T;
  }
  
  // Error response type
  export interface ApiErrorResponse {
    success: false;
    error: string;
    details?: any;
  }
  
  // Combined response type
  export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;
  
  // Pagination parameters
  export interface PaginationParams {
    page?: number;
    limit?: number;
  }
  
  // Filter parameters
  export interface FilterParams {
    [key: string]: string | number | boolean | undefined;
  }
  
  // Sort parameters
  export interface SortParams {
    field: string;
    direction: 'asc' | 'desc';
  }
  
  // Common API query parameters
  export interface ApiQueryParams extends PaginationParams {
    filters?: FilterParams;
    sort?: SortParams;
    search?: string;
  }