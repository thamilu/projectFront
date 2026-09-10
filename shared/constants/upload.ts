/**
 * File Upload Constraints
 * Aligned with Spring Boot backend configurations (app.storage.max-file-size, app.media.max-images-per-product)
 */
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_IMAGES_PER_PRODUCT: 10, // Aligned with backend configuration
} as const;

export type FileUploadConfig = typeof FILE_UPLOAD;
export type AllowedMimeType = (typeof FILE_UPLOAD.ALLOWED_IMAGE_TYPES)[number];
