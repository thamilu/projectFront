import {
  generateSlug,
  calculateFinalPrice,
  type ProductFormData,
} from '@/schemas/product-form.schema';
import type { BackendProductRequest, Category } from '@/types/product';
import { z } from 'zod';

export const createProductRequestSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().regex(/^[A-Z0-9][A-Z0-9-]{1,48}[A-Z0-9]$/),
  friendlyUrl: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  price: z.number().min(0.01),
  discountPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0),
  imageUrl: z.string().url().max(500).optional(),
  categoryId: z.number().int().positive(),
  brandId: z.number().int().optional(),
  storeId: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

export class ProductPayloadValidationError extends Error {
  constructor(public readonly issues: z.ZodIssue[]) {
    super('Create product payload validation failed');
    this.name = 'ProductPayloadValidationError';
  }
}

export function validateCreateProductPayload(payload: unknown): BackendProductRequest {
  const parsed = createProductRequestSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ProductPayloadValidationError(parsed.error.issues);
  }

  return parsed.data as unknown as BackendProductRequest;
}

/**
 * Map form data to backend API request format
 * Strictly limited to CreateProductRequest DTO fields to avoid deserialization errors
 */
export function mapFormToBackendRequest(
  formData: ProductFormData,
  category: Category | undefined,
  subCategory: Category | undefined,
  thirdLevelCategory: Category | undefined,
  fourthLevelCategory: Category | undefined,
  brandName: string | undefined,
  shopId: number | undefined
): Record<string, any> {
  const sellingPrice = Number(formData.sellingPrice) || 0;
  const discountAmount = formData.discountType !== 'NONE'
    ? Number(calculateFinalPrice(sellingPrice, formData.discountType, formData.discountValue))
    : undefined;

  // Use a strictly typed object to match ProductCreateRequest.java
  const payload: BackendProductRequest = {
    name: formData.name.trim(),
    description: formData.description?.trim() || undefined,
    sku: formData.sku.trim().toUpperCase(),
    price: Number(sellingPrice.toFixed(2)),
    stockQuantity: Math.floor(Number(formData.stockQuantity) || 0),
    categoryId: Math.floor(Number(formData.categoryId)),
    featured: Boolean(formData.featured),
  };

  // Map category details for backend persistence/validation
  if (category) {
    // @ts-ignore - mapping logic from the helper
    payload.categoryType = determineCategoryType(category.name);
  }

  if (subCategory) {
    payload.subCategory = subCategory.name;
  }

  // Map dynamic attributes
  const dynamicAttributes = buildCategoryAttributes(
    formData,
    category?.name || '',
    brandName
  );
  if (Object.keys(dynamicAttributes).length > 0) {
    // @ts-ignore - attributes is Map<String, String> on backend
    payload.attributes = dynamicAttributes;
  }

  // Optional fields - only include if they have valid values
  if (discountAmount !== undefined && !isNaN(discountAmount)) {
    payload.discountPrice = Number(discountAmount.toFixed(2));
  }

  if (formData.brandId) {
    const bId = Number(formData.brandId);
    if (!isNaN(bId)) payload.brandId = Math.floor(bId);
  }

  // Backend uses storeId, not shopId. Only include if valid positive number.
  if (shopId !== undefined) {
    const finalStoreId = Number(shopId);
    if (!isNaN(finalStoreId) && finalStoreId > 0) {
      payload.storeId = Math.floor(finalStoreId);
    }
  }

  // Set-based tags as strings
  if (formData.seoKeywords && formData.seoKeywords.length > 0) {
    payload.tags = formData.seoKeywords;
  } else {
    payload.tags = [];
  }

  if (formData.images && formData.images.length > 0 && formData.images[0]) {
    payload.imageUrl = formData.images[0];
  }

  // Generate friendlyUrl if not provided (regex: ^[a-z0-9]+(-[a-z0-9]+)*$)
  if (formData.slug) {
    payload.friendlyUrl = formData.slug;
  } else {
    payload.friendlyUrl = generateSlug(formData.name);
  }

  // No need for separate validation call if we're sending to API immediately
  // and we want to allow flexibility for backend to handle optional fields

  return payload;
}

/**
 * Determine category type from category name
 */
function determineCategoryType(categoryName: string): string {
  const mapping: Record<string, string> = {
    Electronics: 'ELECTRONICS',
    'Fashion & Apparel': 'FASHION',
    'Home & Living': 'HOME',
    'Beauty, Health & Personal Care': 'BEAUTY',
    'Grocery & Essentials': 'GROCERY',
    'Sports, Fitness & Outdoor': 'SPORTS',
    'Toys, Kids & Baby': 'TOYS',
    'Books, Office & Stationery': 'BOOKS',
    Automotive: 'AUTOMOTIVE',
    'Industrial & B2B': 'INDUSTRIAL',
    'Digital Products': 'DIGITAL',
    'Luxury & Specialty': 'LUXURY',
    Services: 'SERVICES',
  };

  return mapping[categoryName] || 'OTHER';
}

/**
 * Build category-specific attributes
 */
function buildCategoryAttributes(
  formData: ProductFormData,
  categoryName: string,
  brandName?: string
): Record<string, any> {
  const attributes: Record<string, any> = {};

  // Add brand
  if (brandName) {
    attributes.brand = brandName;
  }

  // Category-specific attributes
  if (
    categoryName.toLowerCase().includes('electronic') ||
    categoryName.toLowerCase().includes('smartphone') ||
    categoryName.toLowerCase().includes('laptop')
  ) {
    attributes.type = 'SMARTPHONE'; // or 'LAPTOP', etc.
  }

  // Add any custom attributes from form
  if (formData.attributes) {
    Object.assign(attributes, formData.attributes);
  }

  return attributes;
}

/**
 * Extract tags from product name and description
 */
export function extractTags(name: string, description: string, categoryName: string): string[] {
  const text = `${name} ${description} ${categoryName}`.toLowerCase();

  // Remove common words
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'this',
    'that',
    'are',
    'was',
    'were',
  ]);

  const words = text
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  // Return unique tags, limited to 10
  return [...new Set(words)].slice(0, 10);
}
