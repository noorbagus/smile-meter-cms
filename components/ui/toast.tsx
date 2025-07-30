'use client';

import { ReactNode, useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  action?: ReactNode;
};

export function Toast({
  id,
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose,
  position = 'top-right',
  action
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration !== Infinity) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300); // Allow animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div
      className={cn(
        'max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border overflow-hidden',
        typeClasses[type],
        isVisible ? 'animate-fade-in' : 'animate-fade-out opacity-0 transform translate-x-full',
        'transition-all duration-300 ease-in-out'
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1">
            {title && <p className="text-sm font-medium">{title}</p>}
            {description && <p className="mt-1 text-sm">{description}</p>}
            {action && <div className="mt-3">{action}</div>}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type ToastContainerProps = {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
};

export function ToastContainer({ 
  children,
  position = 'top-right' 
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0'
  };

  return (
    <div
      className={cn(
        'fixed z-50 p-4 flex flex-col gap-2',
        positionClasses[position]
      )}
    >
      {children}
    </div>
  );
}