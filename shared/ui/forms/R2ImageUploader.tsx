"use client";

import { useCallback, useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Star } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { toast } from 'sonner';
import { compressImage } from '@/infrastructure/image/compression';
import { Loader2 } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export function R2ImageUploader({ files, onFilesChange, maxFiles = 5 }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files?.length) {
      const incoming = Array.from(e.dataTransfer.files);
      processFiles(incoming);
    }
  }, [files, onFilesChange, maxFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const incoming = Array.from(e.target.files);
      processFiles(incoming);
    }
    // Reset value so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  }, [files, onFilesChange, maxFiles]);

  const processFiles = async (incoming: File[]) => {
    setIsCompressing(true);
    const validFiles: File[] = [];
    const errors: string[] = [];

    try {
      for (const file of incoming) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`${file.name}: Invalid file type.`);
        } else if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: Too large (Max 5MB).`);
        } else {
          // Hardening: Auto-compress large files
          try {
            const optimizedFile = await compressImage(file);
            validFiles.push(optimizedFile);
          } catch (err) {
            console.error('Compression error', err);
            validFiles.push(file); // Fallback to original if compression fails
          }
        }
      }

      if (errors.length > 0) {
        errors.forEach(err => toast.error(err));
      }

      if (validFiles.length > 0) {
        onFilesChange([...files, ...validFiles].slice(0, maxFiles));
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  }, [files, onFilesChange]);

  const setPrimary = useCallback((index: number) => {
    // Determine which file is primary (index 0)
    if (index === 0) return;
    
    const newFiles = [...files];
    const [selected] = newFiles.splice(index, 1);
    newFiles.unshift(selected); // Move to front
    
    onFilesChange(newFiles);
  }, [files, onFilesChange]);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {isCompressing ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium">Optimizing images...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drag & drop images here, or{' '}
                <span className="text-primary hover:underline">
                  browse
                </span>
              </p>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Direct Cloudflare R2 Upload (Max {maxFiles} images, 5MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={files.length >= maxFiles}
          />
        </div>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative group aspect-square rounded-lg border bg-background overflow-hidden">
              <Image
                src={URL.createObjectURL(file)}
                alt={file.name}
                fill
                className="object-cover"
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {index === 0 ? (
                  <span className="text-xs font-semibold text-white flex items-center gap-1 bg-primary px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 fill-current" /> Primary
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs w-full"
                    onClick={() => setPrimary(index)}
                  >
                    Set Primary
                  </Button>
                )}
                
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 rounded-full"
                  aria-label="Remove image"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Badges (Visible without hover) */}
              {index === 0 && (
                <div className="absolute top-2 left-2 block group-hover:hidden">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    MAIN
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
