import { z } from 'zod';

// Product attributes schema
// Product attributes schema
export const productAttributesSchema = z.object({
  type: z.string().optional(),
  brand: z.string().min(1, 'Brand is required').optional(), // made optional as it's handled by main schema too
  size: z.string().optional(),
  availableSizes: z.string().optional(),
  color: z.string().optional(),
  availableColors: z.string().optional(),
  storage: z.string().optional(), // Added for electronics
}).catchall(z.any()); // Allow other dynamic attributes

// Main product schema for form
export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must not exceed 200 characters'),
  sku: z
    .string()
    .regex(/^[A-Z0-9][A-Z0-9-]{1,48}[A-Z0-9]$/, 'SKU must contain only uppercase letters, numbers, and hyphens (3-50 chars)')
    .optional()
    .or(z.literal('')), // Auto-generated if empty
  friendlyUrl: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Friendly URL must contain only lowercase letters, numbers, and hyphens')
    .optional()
    .or(z.literal('')), // Auto-generated from name
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  shortDescription: z.string().max(500).optional().or(z.literal('')),
  categoryId: z
    .number({ message: 'Please select a category' })
    .positive('Please select a valid category'),
  categoryType: z.string().optional(), // Will be set by backend based on categoryId
  subCategory: z
    .string()
    .max(100, 'Sub-category must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s-]*$/, 'Sub-category contains invalid characters')
    .optional()
    .or(z.literal('')),
  price: z
    .number({ message: 'Price is required' })
    .positive('Price must be greater than 0')
    .max(1000000, 'Price must not exceed 1,000,000'),
  discountPrice: z.number().positive().max(1000000).optional().nullable(),
  stockQuantity: z
    .number({ message: 'Stock is required' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(100000, 'Stock must not exceed 100,000'),
  lowStockThreshold: z.number().int().min(0).default(10),
  images: z
    .array(z.string())
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
  imageUrl: z.string().optional(), // Primary image URL
  brandId: z.number().positive('Please select a brand').optional(),
  attributes: productAttributesSchema,
  tags: z
    .array(
      z.string()
        .min(2, 'Tag must be at least 2 characters')
        .max(50, 'Tag must not exceed 50 characters')
        .regex(/^[a-zA-Z0-9-]+$/, 'Tag contains invalid characters (only letters, numbers, hyphens allowed)')
    )
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
  featured: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'DRAFT', 'INACTIVE']).default('DRAFT'),
}).refine((data) => {
  if (data.discountPrice != null && data.price != null) {
    return data.discountPrice < data.price;
  }
  return true;
}, {
  message: 'Discount price must be less than regular price',
  path: ['discountPrice'],
});

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductAttributes = z.infer<typeof productAttributesSchema>;

// For API validation
export const createProductApiSchema = productSchema.extend({
  shopId: z.number().positive(), // Will be added by backend from authenticated user
});
