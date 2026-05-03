# Product Image Upload - Frontend Integration Guide

## Quick Start

This guide shows how to integrate product image upload in your Next.js frontend.

---

## Prerequisites

- Backend running at `http://localhost:8082`
- User authenticated with SELLER or ADMIN role
- Product created (need product ID)

---

## Component Usage

### LocalImageUploader Component

**Location**: `components/LocalImageUploader.tsx`

**Props**:
```typescript
interface Props {
  files: File[];                    // Current file list
  onFilesChange: (files: File[]) => void;  // Callback when files change
  maxFiles?: number;                // Maximum files allowed (default: 5)
}
```

**Basic Usage**:
```tsx
import { LocalImageUploader } from '@/components/LocalImageUploader';

function ProductForm() {
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  return (
    <LocalImageUploader
      files={imageFiles}
      onFilesChange={setImageFiles}
      maxFiles={5}
    />
  );
}
```

**Features**:
- ✅ Drag & drop support
- ✅ Click to browse files
- ✅ Image preview with thumbnails
- ✅ Set primary image
- ✅ Remove images
- ✅ Reorder images (first = primary)

---

## API Client

### Import

```typescript
import { productImagesApi } from '@/lib/api/product-images';
```

### Methods

#### 1. Upload Image

```typescript
const result = await productImagesApi.upload(
  productId: string,      // Product ID
  file: File,            // Image file
  altText?: string,      // Optional alt text
  isPrimary?: boolean    // Is primary image (default: false)
);
```

**Example**:
```typescript
try {
  const uploadedImage = await productImagesApi.upload(
    '123',
    imageFile,
    'Product main view',
    true
  );
  
  console.log('Image uploaded:', uploadedImage.url);
} catch (error) {
  console.error('Upload failed:', error);
}
```

#### 2. Get Product Images

```typescript
const images = await productImagesApi.getForProduct(productId: string);
```

**Example**:
```typescript
const productImages = await productImagesApi.getForProduct('123');
// Returns array of ProductImage objects
```

#### 3. Delete Image

```typescript
await productImagesApi.delete(imageId: string);
```

#### 4. Set Primary Image

```typescript
await productImagesApi.setPrimary(productId: string, imageId: string);
```

---

## Complete Integration Example

### Product Creation Form

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocalImageUploader } from '@/components/LocalImageUploader';
import { productImagesApi } from '@/lib/api/product-images';
import { toast } from 'sonner';

export default function CreateProductPage() {
  const router = useRouter();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: ProductFormData) => {
    setIsSubmitting(true);
    
    try {
      // 1. Create product first
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const product = await response.json();
      const productId = product.data.id;

      // 2. Upload images if any
      if (imageFiles.length > 0) {
        toast.info('Uploading product images...');
        
        const uploadPromises = imageFiles.map((file, index) =>
          productImagesApi.upload(
            String(productId),
            file,
            file.name,
            index === 0  // First image is primary
          )
        );
        
        await Promise.all(uploadPromises);
        toast.success('Images uploaded successfully!');
      }

      toast.success('Product created successfully!');
      router.push('/seller/products');
      
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Product Name, Description, etc. */}
      
      {/* Image Upload Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Product Images</label>
        <LocalImageUploader
          files={imageFiles}
          onFilesChange={setImageFiles}
          maxFiles={5}
        />
        <p className="text-xs text-muted-foreground">
          Upload up to 5 images (JPG, PNG, WEBP, max 5MB each)
        </p>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

---

## Error Handling

### Client-Side Validation

```typescript
const validateImage = (file: File): string | null => {
  // Check file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return 'File size must be less than 5MB';
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPG, PNG, and WEBP images are allowed';
  }

  return null;
};

// Usage
const handleFileSelect = (files: File[]) => {
  const errors = files
    .map(file => ({ file, error: validateImage(file) }))
    .filter(result => result.error);

  if (errors.length > 0) {
    toast.error(errors[0].error!);
    return;
  }

  setImageFiles(files);
};
```

### Server Error Handling

```typescript
try {
  await productImagesApi.upload(productId, file);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    toast.error(error.response.data.error.message);
  } else if (error.response?.status === 401) {
    // Not authenticated
    router.push('/login');
  } else if (error.response?.status === 413) {
    // File too large
    toast.error('File size exceeds limit');
  } else {
    // Generic error
    toast.error('Failed to upload image');
  }
}
```

---

## Environment Configuration

### .env.local

```env
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8082

# Or for production
# NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

---

## Image Display

### Display Uploaded Images

```tsx
interface ProductImageProps {
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
}

function ProductImage({ imageUrl, altText, isPrimary }: ProductImageProps) {
  return (
    <div className="relative">
      <img
        src={imageUrl}
        alt={altText || 'Product image'}
        className="w-full h-auto rounded-lg"
      />
      {isPrimary && (
        <span className="absolute top-2 left-2 bg-primary text-white px-2 py-1 text-xs rounded">
          Primary
        </span>
      )}
    </div>
  );
}
```

### Image Gallery

```tsx
function ProductImageGallery({ productId }: { productId: string }) {
  const [images, setImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    productImagesApi.getForProduct(productId)
      .then(setImages)
      .catch(console.error);
  }, [productId]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {images.map(image => (
        <img
          key={image.id}
          src={image.thumbnailUrl}
          alt={image.altText}
          className="w-full h-auto rounded"
        />
      ))}
    </div>
  );
}
```

---

## TypeScript Types

```typescript
export interface ProductImage {
  id: string;
  productId: string;
  url: string;                    // Full size image URL
  thumbnailUrl: string;           // Thumbnail URL (150x150)
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
  fileSize?: number;
  provider?: string;
  publicId?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## Best Practices

### 1. Pre-upload Validation

```typescript
// Validate before uploading
const errors = files.map(validateImage).filter(Boolean);
if (errors.length > 0) {
  showErrors(errors);
  return;
}
```

### 2. Progress Indication

```typescript
const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

// Track each file's upload progress
const uploadWithProgress = async (file: File, index: number) => {
  setUploadProgress(prev => ({ ...prev, [index]: 0 }));
  
  try {
    await productImagesApi.upload(productId, file);
    setUploadProgress(prev => ({ ...prev, [index]: 100 }));
  } catch (error) {
    setUploadProgress(prev => ({ ...prev, [index]: -1 })); // Error state
  }
};
```

### 3. Optimistic UI Updates

```typescript
// Show image immediately, upload in background
const handleImageAdd = (file: File) => {
  const tempId = `temp-${Date.now()}`;
  const previewUrl = URL.createObjectURL(file);
  
  // Add to UI immediately
  setImages(prev => [...prev, { id: tempId, url: previewUrl, status: 'uploading' }]);
  
  // Upload in background
  productImagesApi.upload(productId, file)
    .then(uploaded => {
      setImages(prev => prev.map(img => 
        img.id === tempId ? { ...uploaded, status: 'done' } : img
      ));
    })
    .catch(error => {
      setImages(prev => prev.map(img => 
        img.id === tempId ? { ...img, status: 'error' } : img
      ));
    })
    .finally(() => {
      URL.revokeObjectURL(previewUrl);
    });
};
```

---

## Common Issues

### Issue: CORS Error

**Solution**: Backend CORS is configured, but verify:
```typescript
// Check backend allows your frontend origin
app.cors.allowed-origins=http://localhost:3000
```

### Issue: 413 Payload Too Large

**Solution**: Backend max file size is 10MB, but validation is 5MB per file
```properties
spring.servlet.multipart.max-file-size=10MB
app.upload.max-file-size=5242880  # 5MB
```

### Issue: Images Not Showing

**Solution**: Check image URLs use correct base URL
```typescript
// Verify API_BASE matches backend URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
```

---

## Testing Checklist

- [ ] Upload single image
- [ ] Upload multiple images (5 max)
- [ ] Try uploading 6th image (should prevent)
- [ ] Upload oversized file (>5MB) - should show error
- [ ] Upload invalid type (.pdf, .txt) - should show error
- [ ] Set primary image
- [ ] Remove image
- [ ] Reorder images
- [ ] Submit form with images
- [ ] View uploaded images in product details

---

## Resources

- [Backend API Documentation](../eshop_back/docs/PRODUCT_IMAGE_UPLOAD_API.md)
- [LocalImageUploader Component](../components/LocalImageUploader.tsx)
- [Product Images API Client](../lib/api/product-images.ts)

---

**Guide Version**: 1.0  
**Last Updated**: February 7, 2026
