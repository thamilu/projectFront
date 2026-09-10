'use client';

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files?.length) {
        const incoming = Array.from(e.dataTransfer.files);
        processFiles(incoming);
      }
    },
    [files, onFilesChange, maxFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        const incoming = Array.from(e.target.files);
        processFiles(incoming);
      }
      // Reset value so the same file can be selected again if needed
      if (e.target) {
        e.target.value = '';
      }
    },
    [files, onFilesChange, maxFiles]
  );

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
        errors.forEach((err) => toast.error(err));
      }

      if (validFiles.length > 0) {
        onFilesChange([...files, ...validFiles].slice(0, maxFiles));
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const isAtCapacity = files.length >= maxFiles;

  const triggerFileInput = useCallback(() => {
    if (isAtCapacity) return;
    fileInputRef.current?.click();
  }, [isAtCapacity]);

  // Regression: the dropzone was a bare `<div onClick=...>` with no role,
  // tabIndex, or key handler, and its file <input> was removed from the tab
  // order via `className="hidden"` — a keyboard-only seller could not open
  // the file picker at all. Standard WAI-ARIA custom-button pattern: Enter
  // and Space both activate it, matching native <button> behavior.
  const handleDropZoneKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerFileInput();
      }
    },
    [triggerFileInput]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  const setPrimary = useCallback(
    (index: number) => {
      // Determine which file is primary (index 0)
      if (index === 0) return;

      const newFiles = [...files];
      const [selected] = newFiles.splice(index, 1);
      newFiles.unshift(selected); // Move to front

      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={isAtCapacity ? -1 : 0}
        aria-disabled={isAtCapacity}
        aria-label={
          isAtCapacity
            ? `Maximum of ${maxFiles} images reached`
            : 'Upload product images. Drag and drop, or press Enter to browse files'
        }
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          isAtCapacity ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        onKeyDown={handleDropZoneKeyDown}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {isCompressing ? (
            <>
              <Loader2 className="text-primary h-8 w-8 animate-spin" aria-hidden="true" />
              <p className="text-sm font-medium" role="status">
                Optimizing images...
              </p>
            </>
          ) : (
            <>
              <Upload className="text-muted-foreground h-8 w-8" aria-hidden="true" />
              <p className="text-sm font-medium">
                Drag & drop images here, or{' '}
                <span className="text-primary hover:underline">browse</span>
              </p>
            </>
          )}
          <p className="text-muted-foreground text-xs">
            Direct Cloudflare R2 Upload (Max {maxFiles} images, 5MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleFileInput}
            disabled={isAtCapacity}
          />
        </div>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group bg-background relative aspect-square overflow-hidden rounded-lg border"
            >
              <Image
                src={URL.createObjectURL(file)}
                alt={`Upload preview ${index + 1}`}
                fill
                className="object-cover"
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
              />

              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {index === 0 ? (
                  <span className="bg-primary flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white">
                    <Star className="h-3 w-3 fill-current" /> Primary
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 w-full text-xs"
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
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Badges (Visible without hover) */}
              {index === 0 && (
                <div className="absolute top-2 left-2 block group-hover:hidden">
                  <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
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
