'use client';

import React from 'react';
import { Label } from '@/shared/ui/atoms/label';
import { R2ImageUploader } from '@/shared/ui/forms/R2ImageUploader';

interface ProductMediaManagerProps {
  imageFiles: File[];
  setImageFiles: (files: File[]) => void;
  existingImages?: Array<{ id: number; url: string; isPrimary: boolean }>;
  deleteExistingImage?: (id: number) => Promise<void>;
  maxFiles?: number;
}

export function ProductMediaManager({
  imageFiles,
  setImageFiles,
  existingImages = [],
  deleteExistingImage,
  maxFiles = 5,
}: ProductMediaManagerProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Product Images</Label>

        {existingImages.length > 0 && (
          <div className="mb-4 space-y-2">
            <Label className="text-muted-foreground text-xs">Active Images (Click to delete)</Label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {existingImages.map((img) => (
                <div
                  key={img.id}
                  className="group bg-muted relative aspect-square overflow-hidden rounded-md border"
                >
                  <img
                    src={img.url}
                    alt="product thumbnail"
                    className="h-full w-full object-cover"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                      Primary
                    </span>
                  )}
                  {deleteExistingImage && (
                    <button
                      type="button"
                      onClick={() => deleteExistingImage(img.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">Upload New Additional Images</Label>
          <R2ImageUploader
            files={imageFiles}
            onFilesChange={setImageFiles}
            maxFiles={Math.max(0, maxFiles - existingImages.length)}
          />
        </div>
      </div>
    </div>
  );
}
