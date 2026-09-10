import { z } from 'zod';

// Product attributes schema
export const productAttributesSchema = z
  .object({
    type: z.string().optional(),
    brand: z.string().min(1, 'Brand is required').optional(),
    size: z.string().optional(),
    availableSizes: z.string().optional(),
    color: z.string().optional(),
    availableColors: z.string().optional(),
    storage: z.string().optional(),
  })
  .catchall(z.any());

// Shared canonical base
export const ProductBaseSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must not exceed 200 characters'),
  sku: z
    .string()
    .regex(
      /^[A-Z0-9][A-Z0-9-]{1,48}[A-Z0-9]$/,
      'SKU must contain only uppercase letters, numbers, and hyphens (3-50 chars)'
    )
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  shortDescription: z.string().max(500).optional().or(z.literal('')),
  categoryId: z
    .number({ message: 'Please select a category' })
    .positive('Please select a valid category'),
  brandId: z.number().positive('Please select a brand').optional().nullable(),
  tags: z
    .array(
      z
        .string()
        .min(2, 'Tag must be at least 2 characters')
        .max(50, 'Tag must not exceed 50 characters')
        .regex(
          /^[a-zA-Z0-9-]+$/,
          'Tag contains invalid characters (only letters, numbers, hyphens allowed)'
        )
    )
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
});

// Canonical base object schema before refinements (allows extending)
export const productBaseSchemaFull = ProductBaseSchema.extend({
  friendlyUrl: z
    .string()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Friendly URL must contain only lowercase letters, numbers, and hyphens'
    )
    .optional()
    .or(z.literal('')),
  categoryType: z.string().optional(),
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
  imageUrl: z.string().optional(),
  attributes: productAttributesSchema,
  featured: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'DRAFT', 'INACTIVE']).default('DRAFT'),
});

// Canonical product schema (with refinements)
export const productSchema = productBaseSchemaFull.refine(
  (data) => {
    if (data.discountPrice != null && data.price != null) {
      return data.discountPrice < data.price;
    }
    return true;
  },
  {
    message: 'Discount price must be less than regular price',
    path: ['discountPrice'],
  }
);

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductAttributes = z.infer<typeof productAttributesSchema>;

export const ProductSchema = productSchema;

// Safely extend the unrefined base object, then apply the same refinement
export const createProductApiSchema = productBaseSchemaFull
  .extend({
    shopId: z.number().positive(),
  })
  .refine(
    (data) => {
      if (data.discountPrice != null && data.price != null) {
        return data.discountPrice < data.price;
      }
      return true;
    },
    {
      message: 'Discount price must be less than regular price',
      path: ['discountPrice'],
    }
  );

// Alias for standard form/API mappings
export const ProductFormSchema = productSchema;
export const ProductApiSchema = createProductApiSchema;
