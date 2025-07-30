'use client';

import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/use-image-upload';
import { RewardCategory } from '@/types/unit.types';
import UploadProgress from './upload-progress';

interface UploadModalProps {
  unitId: string;
  category: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export default function UploadModal({
  unitId,
  category,
  userId,
  isOpen,
  onClose,
  onUploadComplete
}: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    uploadImage,
    uploadProgress,
    uploadStatus,
    fileDetails,
    error,
    reset,
    cancelUpload
  } = useImageUpload();
  
  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;
    
    try {
      const result = await uploadImage({
        unitId,
        category: category as RewardCategory,
        file: selectedFile,
        userId
      });
      
      if (result.success) {
        setTimeout(() => {
          onUploadComplete();
        }, 1000); // Give time to see success state
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  };

  const handleCancel = () => {
    if (uploadStatus === 'uploading' || uploadStatus === 'processing') {
      cancelUpload();
    }
    reset();
    setSelectedFile(null);
    onClose();
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'small_prize':
        return 'Small Prize';
      case 'medium_prize':
        return 'Medium Prize';
      case 'top_prize':
        return 'Top Prize';
      default:
        return category;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="font-medium">
            Upload {getCategoryName(category)} Image
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {uploadStatus === 'idle' && !selectedFile ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
              />
              <div className="flex flex-col items-center">
                <ImageIcon size={48} className="text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop an image, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  JPEG, PNG or WebP (max. 5MB)
                </p>
              </div>
            </div>
          ) : uploadStatus === 'idle' && selectedFile ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center">
                  <ImageIcon size={24} className="text-gray-400 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFile(null)}
                >
                  Change
                </Button>
                <Button
                  onClick={handleUploadClick}
                  className="flex items-center"
                >
                  <Upload size={16} className="mr-1" />
                  Upload
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <UploadProgress
                progress={uploadProgress}
                status={uploadStatus}
                fileName={selectedFile?.name || ''}
                fileSize={(selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : '')}
                error={error || undefined}
                onCancel={uploadStatus === 'uploading' ? cancelUpload : undefined}
              />
              
              <div className="flex justify-end">
                {uploadStatus === 'success' ? (
                  <Button onClick={onUploadComplete}>
                    Done
                  </Button>
                ) : uploadStatus === 'error' ? (
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        reset();
                        setSelectedFile(null);
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={uploadStatus === 'processing'}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}