/**
 * Hardened Image Compression Utility
 * Uses native Canvas API to optimize images before upload to Cloudflare R2.
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

// Canvas can re-encode these without any special handling; anything else
// (heic, avif inputs some browsers can decode but not re-encode, etc.)
// falls back to JPEG rather than producing a mislabeled/broken file.
const CANVAS_ENCODABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    // Preserve the input format by default — forcing JPEG unconditionally
    // silently destroyed alpha transparency on every PNG (and re-encoded
    // WebP as JPEG) uploaded through callers that don't explicitly pass
    // mimeType, flattening transparent backgrounds to opaque black.
    mimeType = CANVAS_ENCODABLE_TYPES.has(file.type) ? file.type : 'image/jpeg',
  } = options;

  // Don't compress if it's already small enough (e.g., under 500KB)
  if (file.size < 500 * 1024) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down to fit within maxWidth x maxHeight, preserving aspect
        // ratio. A single min() scale factor bounds BOTH dimensions at once —
        // branching on width>height and checking only that axis's own
        // threshold (the previous approach) could pass an image through
        // whose other dimension still exceeded its bound, e.g. a 2000x1500
        // image against {maxWidth:1920, maxHeight:1080} previously resized
        // to 1920x1440, still 360px over maxHeight.
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context failed'));
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Compression failed'));
            }
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
