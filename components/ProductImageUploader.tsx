"use client";

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { productImagesApi, ProductImage } from '@/lib/api/product-images';

interface Props {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

export function ProductImageUploader({ productId, images, onImagesChange }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file, index) =>
        productImagesApi.upload(productId, file, '', index === 0 && images.length === 0)
      );
      const newImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [productId, images, onImagesChange]);

  const handleDelete = async (imageId: string) => {
    try {
      await productImagesApi.delete(imageId);
      onImagesChange(images.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await productImagesApi.setPrimary(productId, imageId);
      onImagesChange(
        images.map(img => ({ ...img, isPrimary: img.id === imageId }))
      );
    } catch (err) {
      console.error('Set primary failed', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
        onDrop={(e) => {
          e.preventDefault();
          handleUpload(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
        </label>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative group">
            <Image
              src={image.thumbnailUrl}
              alt={image.altText || 'Product image'}
              width={150}
              height={150}
              className={`rounded-lg ${image.isPrimary ? 'ring-2 ring-blue-500' : ''}`}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!image.isPrimary && (
                <button
                  onClick={() => handleSetPrimary(image.id)}
                  className="text-white text-xs bg-blue-500 px-2 py-1 rounded"
                >
                  Set Primary
                </button>
              )}
              <button
                onClick={() => handleDelete(image.id)}
                className="text-white text-xs bg-red-500 px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
            {image.isPrimary && (
              <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                Primary
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductImageUploader;
