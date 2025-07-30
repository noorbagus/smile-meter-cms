'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, ImageIcon, AlertCircle } from 'lucide-react';
import { UnitImage, RewardCategory } from '@/types/unit.types';
import { Button } from '@/components/ui/button';
import ImagePreview from './image-preview';

interface ImageGalleryProps {
  images: {
    [key in RewardCategory]?: UnitImage;
  };
  onUploadClick: (category: string) => void;
}

export default function ImageGallery({ images, onUploadClick }: ImageGalleryProps) {
  const [previewImage, setPreviewImage] = useState<UnitImage | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const categories: { id: RewardCategory; label: string; description: string }[] = [
    { 
      id: 'small_prize', 
      label: 'Small Prize', 
      description: 'Score: 0% - 60%' 
    },
    { 
      id: 'medium_prize', 
      label: 'Medium Prize', 
      description: 'Score: 61% - 80%' 
    },
    { 
      id: 'top_prize', 
      label: 'Top Prize', 
      description: 'Score: 81% - 100%' 
    }
  ];

  const handlePreviewClick = (image: UnitImage) => {
    setPreviewImage(image);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Current Images</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => {
          const image = images[category.id];
          const hasImage = !!image;
          
          return (
            <div 
              key={category.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image Header */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{category.label}</h3>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  onClick={() => onUploadClick(category.id)}
                >
                  <Upload size={16} className="mr-1" />
                  {hasImage ? 'Replace' : 'Upload'}
                </Button>
              </div>
              
              {/* Image Display */}
              <div className="p-4">
                {hasImage ? (
                  <div 
                    className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => handlePreviewClick(image)}
                  >
                    <Image 
                      src={image.image_url}
                      alt={`${category.label} Image`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg flex flex-col items-center justify-center p-6 text-gray-400">
                    <ImageIcon size={48} className="mb-2" />
                    <p className="text-sm text-center">No image uploaded</p>
                    <p className="text-xs text-center mt-1">Click upload to add an image</p>
                  </div>
                )}
              </div>
              
              {/* Image Details */}
              {hasImage && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date(image.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreview
          image={previewImage}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}