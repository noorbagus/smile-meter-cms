'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Download, Trash2 } from 'lucide-react';
import { UnitImage } from '@/types/unit.types';
import { Button } from '@/components/ui/button';
import { useUnitImages } from '@/hooks/use-unit_images';

interface ImagePreviewProps {
  image: UnitImage;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export default function ImagePreview({ 
  image, 
  isOpen, 
  onClose,
  onDelete
}: ImagePreviewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteImage } = useUnitImages();
  
  if (!isOpen) return null;

  const handleDownload = () => {
    // Create an anchor element and set the href to the image url
    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = image.image_url.split('/').pop() || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this image?')) {
      setIsDeleting(true);
      try {
        const success = await deleteImage(image.id);
        if (success) {
          onDelete ? onDelete() : onClose();
        } else {
          alert('Failed to delete image');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image');
      } finally {
        setIsDeleting(false);
      }
    }
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        aria-label="Close preview"
      >
        <X size={24} />
      </button>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="font-medium">{getCategoryName(image.category)}</h3>
            <p className="text-xs text-gray-500">
              Last updated: {new Date(image.updated_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download size={16} />
              <span>Download</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 size={16} />
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </Button>
          </div>
        </div>
        
        {/* Image */}
        <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center">
          {/* Display the image with full dimensions inside a scrollable container */}
          <div className="relative max-w-full max-h-full">
            <Image
              src={image.image_url}
              alt={`${getCategoryName(image.category)} Image`}
              width={1200}
              height={800}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}