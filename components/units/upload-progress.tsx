'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error' | 'canceled';
  fileName: string;
  fileSize: string;
  error?: string;
  onCancel?: () => void;
}

// Default export added
export default function UploadProgress({
  progress,
  status,
  fileName,
  fileSize,
  error,
  onCancel
}: UploadProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  
  // Animate progress
  useEffect(() => {
    // If uploading, animate smoothly to target progress
    if (status === 'uploading') {
      const timer = setTimeout(() => {
        if (displayProgress < progress) {
          setDisplayProgress(prev => Math.min(prev + 2, progress));
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    
    // If success, animate to 100%
    if (status === 'success' && displayProgress < 100) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(prev + 5, 100));
      }, 20);
      return () => clearTimeout(timer);
    }
    
    // If error or canceled, stop at current progress
    if (status === 'error' || status === 'canceled') {
      return;
    }
    
    // If processing, move slowly to 99%
    if (status === 'processing' && displayProgress < 99) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(prev + 0.5, 99));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status, progress, displayProgress]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'canceled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to upload';
      case 'uploading':
        return `Uploading... ${Math.round(progress)}%`;
      case 'processing':
        return 'Processing...';
      case 'success':
        return 'Upload complete';
      case 'error':
        return 'Upload failed';
      case 'canceled':
        return 'Upload canceled';
      default:
        return '';
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          {getStatusIcon()}
          <span className={`ml-2 text-sm font-medium ${
            status === 'error' ? 'text-red-600' : 
            status === 'success' ? 'text-green-600' : 
            status === 'canceled' ? 'text-gray-600' :
            'text-gray-700'
          }`}>
            {getStatusText()}
          </span>
        </div>
        
        {status !== 'success' && status !== 'error' && status !== 'canceled' && onCancel && (
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cancel upload"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <div className="flex items-center mb-2">
        <div className="text-sm text-gray-500 truncate max-w-xs">
          {fileName}
        </div>
        <div className="text-xs text-gray-400 ml-2">
          {fileSize}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className={`h-2.5 rounded-full ${
            status === 'error' ? 'bg-red-600' : 
            status === 'canceled' ? 'bg-gray-600' :
            'bg-blue-600'
          }`}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}