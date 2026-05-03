"use client";

import React, { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export function ImageUploader({
  value = [],
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return `${file.name} is not an image file`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `${file.name} exceeds ${maxSizeMB}MB limit`;
    }

    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newErrors: string[] = [];
      const filesArray = Array.from(files);

      // Check max images limit
      if (value.length + filesArray.length > maxImages) {
        newErrors.push(`Maximum ${maxImages} images allowed`);
        setErrors(newErrors);
        return;
      }

      const validFiles: File[] = [];

      // Validate each file
      for (const file of filesArray) {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          validFiles.push(file);
        }
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        // Clear errors after 5 seconds
        setTimeout(() => setErrors([]), 5000);
      }

      // Convert valid files to base64
      try {
        const base64Images = await Promise.all(
          validFiles.map((file) => convertToBase64(file))
        );

        onChange([...value, ...base64Images]);
      } catch (__error) {
        // Error converting images
        setErrors(["Failed to process images"]);
      }
    },
    [value, onChange, maxImages, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = value.filter((_, i) => i !== index);
      onChange(newImages);
    },
    [value, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
          value.length >= maxImages && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          disabled={value.length >= maxImages}
        />

        <label
          htmlFor="image-upload"
          className={cn(
            "cursor-pointer",
            value.length >= maxImages && "cursor-not-allowed"
          )}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isDragging ? "Drop images here" : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF up to {maxSizeMB}MB (Max {maxImages} images)
          </p>
        </label>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Image Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
            >
              <img
                src={image}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="rounded-full"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Images Counter */}
      <p className="text-sm text-gray-500 text-center">
        {value.length} / {maxImages} images uploaded
      </p>
    </div>
  );
}
