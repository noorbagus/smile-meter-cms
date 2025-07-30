// API wrapper with error handling and type safety

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  withCredentials?: boolean;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiError extends Error {
  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(
          data.message || 'An error occurred',
          response.status,
          data
        );
      }
      
      return data as T;
    } else {
      // Handle non-JSON responses like blob or text
      if (!response.ok) {
        const text = await response.text();
        throw new ApiError(
          text || 'An error occurred',
          response.status
        );
      }
      
      // Return response for caller to handle
      return response as unknown as T;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors or other unexpected errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      undefined
    );
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  method: HttpMethod = 'GET',
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  const { params, withCredentials = true, ...fetchOptions } = options;
  
  // Build URL with query parameters
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  // Prepare fetch options
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    credentials: withCredentials ? 'include' : 'same-origin',
    ...fetchOptions,
  };
  
  // Add body for non-GET requests
  if (method !== 'GET' && data !== undefined) {
    requestOptions.body = JSON.stringify(data);
  }
  
  return fetchWithErrorHandling<T>(url, requestOptions);
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: FetchOptions) => 
    apiRequest<T>(endpoint, 'GET', undefined, options),
    
  post: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => 
    apiRequest<T>(endpoint, 'POST', data, options),
    
  put: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => 
    apiRequest<T>(endpoint, 'PUT', data, options),
    
  patch: <T = any>(endpoint: string, data?: any, options?: FetchOptions) => 
    apiRequest<T>(endpoint, 'PATCH', data, options),
    
  delete: <T = any>(endpoint: string, options?: FetchOptions) => 
    apiRequest<T>(endpoint, 'DELETE', undefined, options),
};

// For server components / server actions
export async function serverApiRequest<T = any>(
  endpoint: string,
  method: HttpMethod = 'GET',
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  // Use absolute URL for server-side requests
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '';
  return apiRequest<T>(
    `${baseUrl}${endpoint}`, 
    method, 
    data, 
    { ...options, withCredentials: false }
  );
}