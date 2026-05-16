/**
 * Product Validation Schemas
 *
 * Zod schemas for runtime validation of product-related data.
 * Ensures type safety and catches malformed API responses.
 *
 * @module lib/validation/product-schemas
 */

import { z } from 'zod';

export const BrandSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
});

const CategoryBaseSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional(),
  parent_id: z.coerce.number().nullable().optional(),
  createdAt: z.string().optional(),
});

export const CategorySchema: z.ZodType<{
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  parentCategory?: z.infer<typeof CategoryBaseSchema> | null;
  parent_id?: number | null;
  children?: z.infer<typeof CategoryBaseSchema>[];
  createdAt?: string;
}> = CategoryBaseSchema.extend({
  parentCategory: CategoryBaseSchema.nullable().optional(),
  children: z.array(CategoryBaseSchema).optional(),
});

export const ProductSummarySchema = z
  .object({
    id: z.coerce.number(),
    name: z.string().min(1),
    price: z.coerce.number(),
    discountPrice: z.coerce.number().optional(),
    imageUrl: z.string().optional(),
    stockQuantity: z.coerce.number().optional(),
    brand: BrandSchema.optional(),
    rating: z.coerce.number().optional(),
    reviewCount: z.coerce.number().optional(),
  })
  .passthrough();

export const ProductListResponseSchema = z.union([
  z
    .object({
      data: z
        .object({
          content: z.array(ProductSummarySchema),
          totalElements: z.coerce.number().optional(),
          totalPages: z.coerce.number().optional(),
        })
        .passthrough(),
    })
    .passthrough(),
  z
    .object({
      content: z.array(ProductSummarySchema),
      totalElements: z.coerce.number().optional(),
      totalPages: z.coerce.number().optional(),
    })
    .passthrough(),
]);

export const CategoryListResponseSchema = z.union([
  z
    .object({
      data: z.array(CategorySchema),
    })
    .passthrough(),
  z.array(CategorySchema),
]);

export const BrandListResponseSchema = z.union([
  z
    .object({
      data: z.array(BrandSchema),
    })
    .passthrough(),
  z.array(BrandSchema),
]);

export type ValidatedProduct = z.infer<typeof ProductSummarySchema>;
export type ValidatedCategory = z.infer<typeof CategorySchema>;
export type ValidatedBrand = z.infer<typeof BrandSchema>;
