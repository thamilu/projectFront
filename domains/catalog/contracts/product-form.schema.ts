import { z } from 'zod';

// Product form schema with all necessary fields
export const productFormSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(200),
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(50),
  categoryId: z.number(),
  subCategoryId: z.union([z.number(), z.undefined(), z.null()]).optional(),
  thirdLevelCategoryId: z.union([z.number(), z.undefined(), z.null()]).optional(),
  fourthLevelCategoryId: z.union([z.number(), z.undefined(), z.null()]).optional(),
  brandId: z.union([z.number(), z.undefined(), z.null()]).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),

  sellingPrice: z.number().min(0, 'Price must be positive'),
  mrp: z.number().min(0, 'MRP must be positive'),
  discountType: z.enum(['PERCENTAGE', 'FLAT', 'NONE']).default('NONE'),
  discountValue: z.number().min(0).default(0),
  taxType: z.enum(['GST', 'VAT', 'NONE']).default('GST'),
  taxPercentage: z.number().min(0).max(100).default(0),

  stockQuantity: z.number().int().min(0, 'Stock cannot be negative'),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'PRE_ORDER']).default('IN_STOCK'),
  minOrderQuantity: z.number().int().min(1).default(1),
  maxOrderQuantity: z.number().int().min(1).default(999),
  lowStockThreshold: z.number().int().min(0).default(5),
  warehouse: z.string().optional(),

  images: z.array(z.string()).default([]),
  primaryImageIndex: z.number().int().min(0).default(0),
  videoUrl: z.string().optional(),

  attributes: z.record(z.string(), z.any()).optional(),
  
  hasVariants: z.boolean().default(false),
  variants: z.array(z.object({
    type: z.string(),
    value: z.string(),
    price: z.number().min(0),
    stock: z.number().int().min(0),
    sku: z.string(),
  })).optional(),

  weight: z.number().min(0).optional(),
  weightUnit: z.enum(['KG', 'G', 'LB']).default('KG'),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  dimensionUnit: z.enum(['CM', 'M', 'IN']).default('CM'),
  shippingCharges: z.number().min(0).default(0),
  freeShipping: z.boolean().default(false),
  deliveryTime: z.number().int().min(1).default(7),

  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.array(z.string()).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'INACTIVE']).default('DRAFT'),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),

  hsnCode: z.string().optional(),
  fssaiNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  warrantyPeriod: z.number().int().min(0).optional(),
  warrantyUnit: z.enum(['DAYS', 'MONTHS', 'YEARS']).optional(),
  returnPolicy: z.string().optional(),
  countryOfOrigin: z.string().default('India'),
}).refine((data) => data.sellingPrice <= data.mrp, {
  message: 'Selling price cannot be greater than MRP',
  path: ['sellingPrice'],
}).refine((data) => {
  if (data.discountType === 'PERCENTAGE') {
    return data.discountValue <= 100;
  }
  if (data.discountType === 'FLAT') {
    return data.discountValue <= data.sellingPrice;
  }
  return true;
}, {
  message: 'Invalid discount value',
  path: ['discountValue'],
}).refine((data) => data.maxOrderQuantity >= data.minOrderQuantity, {
  message: 'Max order quantity must be greater than or equal to min order quantity',
  path: ['maxOrderQuantity'],
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateSKU(categoryName: string, brandName?: string): string {
  const catPrefix = categoryName.substring(0, 3).toUpperCase();
  const brandPrefix = brandName ? brandName.substring(0, 2).toUpperCase() : 'XX';
  const timestamp = Date.now().toString().slice(-6);
  return `${catPrefix}-${brandPrefix}-${timestamp}`;
}

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

export function calculateTax(price: number, taxPercentage: number): number {
  return (price * taxPercentage) / 100;
}

export const ProductFormSchema = productFormSchema;
