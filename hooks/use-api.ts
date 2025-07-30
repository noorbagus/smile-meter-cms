'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const request = useCallback(
    async (
      endpoint: string,
      method: HttpMethod = 'GET',
      body?: any,
      requestOptions?: RequestInit
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        let response;
        switch (method) {
          case 'GET':
            response = await api.get<T>(endpoint, requestOptions);
            break;
          case 'POST':
            response = await api.post<T>(endpoint, body, requestOptions);
            break;
          case 'PUT':
            response = await api.put<T>(endpoint, body, requestOptions);
            break;
          case 'PATCH':
            response = await api.patch<T>(endpoint, body, requestOptions);
            break;
          case 'DELETE':
            response = await api.delete<T>(endpoint, requestOptions);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        setData(response);
        options.onSuccess?.(response);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const get = useCallback(
    (endpoint: string, requestOptions?: RequestInit) => 
      request(endpoint, 'GET', undefined, requestOptions),
    [request]
  );

  const post = useCallback(
    (endpoint: string, body?: any, requestOptions?: RequestInit) => 
      request(endpoint, 'POST', body, requestOptions),
    [request]
  );

  const put = useCallback(
    (endpoint: string, body?: any, requestOptions?: RequestInit) => 
      request(endpoint, 'PUT', body, requestOptions),
    [request]
  );

  const patch = useCallback(
    (endpoint: string, body?: any, requestOptions?: RequestInit) => 
      request(endpoint, 'PATCH', body, requestOptions),
    [request]
  );

  const del = useCallback(
    (endpoint: string, requestOptions?: RequestInit) => 
      request(endpoint, 'DELETE', undefined, requestOptions),
    [request]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    get,
    post,
    put,
    patch,
    delete: del,
    reset,
  };
}

// Specialized hook for data fetching with automatic loading states
export function useFetch<T = any>(
  endpoint: string,
  options: {
    immediate?: boolean;
    requestOptions?: RequestInit;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { immediate = true, requestOptions, onSuccess, onError } = options;
  const api = useApi<T>({ onSuccess, onError });

  const fetchData = useCallback(async () => {
    try {
      return await api.get(endpoint, requestOptions);
    } catch (error) {
      return null;
    }
  }, [endpoint, requestOptions, api]);

  // Execute fetch immediately if requested
  useState(() => {
    if (immediate) {
      fetchData();
    }
  });

  return {
    data: api.data,
    error: api.error,
    isLoading: api.isLoading,
    refetch: fetchData,
    reset: api.reset,
  };
}