'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/ui/toast';

type ToastType = 'success' | 'error' | 'info';

interface CreateToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: React.ReactNode;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(
    ({ title, description, type = 'info', duration = 5000, action }: CreateToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      const newToast: ToastProps = {
        id,
        title,
        description,
        type,
        duration,
        action,
        onClose: (id) => {
          setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
        },
      };

      setToasts((prevToasts) => [...prevToasts, newToast]);

      return id;
    },
    []
  );

  const dismiss = useCallback((id?: string) => {
    if (id) {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    } else {
      setToasts([]);
    }
  }, []);

  // Convenience methods
  const success = useCallback(
    (options: Omit<CreateToastOptions, 'type'>) => toast({ ...options, type: 'success' }),
    [toast]
  );

  const error = useCallback(
    (options: Omit<CreateToastOptions, 'type'>) => toast({ ...options, type: 'error' }),
    [toast]
  );

  const info = useCallback(
    (options: Omit<CreateToastOptions, 'type'>) => toast({ ...options, type: 'info' }),
    [toast]
  );

  return {
    toasts,
    toast,
    dismiss,
    success,
    error,
    info,
  };
}