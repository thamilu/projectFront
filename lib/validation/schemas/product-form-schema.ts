import { z } from 'zod';

// Product form schema with all necessary fields
export const productFormSchema = z.object({
  // 1. Basic Information
  name: z.string().min(3, 'Product name must be at least 3 characters').max(200),
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(50),
  categoryId: z.number(),
  subCategoryId: z.union([z.number(), z.undefined(), z.null()]).optional(),
  thirdLevelCategoryId: z.union([z.number(), z.undefined(), z.null()]).optional(),
  fourthLevelCategoryId: z.union([z.number(), z.undefined(), z.null()]).optional(),
  brandId: z.union([z.number(), z.undefined(), z.null()]).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),

  // 2. Pricing & Tax
  sellingPrice: z.number().min(0, 'Price must be positive'),
  mrp: z.number().min(0, 'MRP must be positive'),
  discountType: z.enum(['PERCENTAGE', 'FLAT', 'NONE']).default('NONE'),
  discountValue: z.number().min(0).default(0),
  taxType: z.enum(['GST', 'VAT', 'NONE']).default('GST'),
  taxPercentage: z.number().min(0).max(100).default(0),

  // 3. Inventory & Availability
  stockQuantity: z.number().int().min(0, 'Stock cannot be negative'),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER']).default('IN_STOCK'),
  minOrderQuantity: z.number().int().min(1).default(1),
  maxOrderQuantity: z.number().int().min(1).default(999),
  lowStockThreshold: z.number().int().min(0).default(5),
  warehouse: z.string().optional(),

  // 4. Product Images & Media
  images: z.array(z.string()).default([]),
  primaryImageIndex: z.number().int().min(0).default(0),
  videoUrl: z.string().optional(),

  // 5. Product Attributes (Dynamic)
  attributes: z.record(z.string(), z.any()).optional(),
  
  // 6. Variants (Optional)
  hasVariants: z.boolean().default(false),
  variants: z.array(z.object({
    type: z.string(), // 'SIZE', 'COLOR', etc.
    value: z.string(),
    price: z.number().min(0),
    stock: z.number().int().min(0),
    sku: z.string(),
  })).optional(),

  // 7. Shipping & Logistics
  weight: z.number().min(0).optional(),
  weightUnit: z.enum(['KG', 'G', 'LB']).default('KG'),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  dimensionUnit: z.enum(['CM', 'M', 'IN']).default('CM'),
  shippingCharges: z.number().min(0).default(0),
  freeShipping: z.boolean().default(false),
  deliveryTime: z.number().int().min(1).default(7), // days

  // 8. SEO & Visibility
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.array(z.string()).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'INACTIVE']).default('DRAFT'),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),

  // 9. Compliance & Legal
  hsnCode: z.string().optional(),
  fssaiNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  warrantyPeriod: z.number().int().min(0).optional(),
  warrantyUnit: z.enum(['DAYS', 'MONTHS', 'YEARS']).optional(),
  returnPolicy: z.string().optional(),
  countryOfOrigin: z.string().default('India'),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

// Helper to generate slug from product name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '') // Keep alphanumeric, spaces, underscores, and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

// Helper to generate SKU
export function generateSKU(categoryName: string, brandName?: string): string {
  const catPrefix = categoryName.substring(0, 3).toUpperCase();
  const brandPrefix = brandName ? brandName.substring(0, 2).toUpperCase() : 'XX';
  const timestamp = Date.now().toString().slice(-6);
  return `${catPrefix}-${brandPrefix}-${timestamp}`;
}

// Calculate final price after discount
export function calculateFinalPrice(
  sellingPrice: number,
  discountType: 'PERCENTAGE' | 'FLAT' | 'NONE',
  discountValue: number
): number {
  if (discountType === 'NONE') return sellingPrice;
  if (discountType === 'FLAT') return Math.max(0, sellingPrice - discountValue);
  if (discountType === 'PERCENTAGE') {
    return Math.max(0, sellingPrice - (sellingPrice * discountValue) / 100);
  }
  return sellingPrice;
}

// Calculate tax amount
export function calculateTax(price: number, taxPercentage: number): number {
  return (price * taxPercentage) / 100;
}
