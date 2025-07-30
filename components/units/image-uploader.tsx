'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/use-image-upload';
import { RewardCategory } from '@/types/unit.types';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  unitId: string;
  category: RewardCategory;
  userId: string;
  onSuccess?: () => void;
}

export default function ImageUploader({ 
  unitId, 
  category, 
  userId,
  onSuccess 
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploadProgress, uploadStatus, error } = useImageUpload();
  const { success, error: showError } = useToast();
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      const result = await uploadImage({
        unitId,
        category,
        file: selectedFile,
        userId
      });
      
      if (result.success) {
        success({ 
          title: 'Upload successful', 
          description: 'The image has been uploaded successfully.'
        });
        
        // Reset state
        setSelectedFile(null);
        setPreview(null);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showError({ 
          title: 'Upload failed', 
          description: result.error || 'Failed to upload image.'
        });
      }
    } catch (err) {
      showError({ 
        title: 'Upload failed', 
        description: 'An unexpected error occurred.'
      });
    }
  };
  
  // Reset the component
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Format category for display
  const getCategoryDisplay = (category: RewardCategory) => {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">
          Upload {getCategoryDisplay(category)} Image
        </h3>
      </div>
      
      {!selectedFile ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center">
            <ImageIcon size={40} className="text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              Drag and drop an image, or click to browse
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG or WebP (max. 5MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            {preview && (
              <div className="aspect-video relative">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm truncate">
                  {selectedFile.name}
                  <span className="ml-2 text-xs text-gray-500">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Upload progress */}
          {uploadStatus !== 'idle' && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  uploadStatus === 'error' ? 'bg-red-600' : 'bg-blue-600'
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          
          {/* Status message */}
          {uploadStatus === 'error' && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          
          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={uploadStatus === 'uploading'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadStatus === 'uploading'}
              isLoading={uploadStatus === 'uploading'}
            >
              <Upload size={16} className="mr-1" />
              Upload
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}