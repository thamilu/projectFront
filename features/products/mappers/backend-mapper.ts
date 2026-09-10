import {
  generateSlug,
  calculateFinalPrice,
  type ProductFormData,
} from '@/domains/catalog/contracts/product-form.schema';
import type { BackendProductRequest, Category } from '@/shared/types/product';

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
): BackendProductRequest {
  const sellingPrice = Number(formData.sellingPrice) || 0;
  const discountAmount =
    formData.discountType !== 'NONE'
      ? Number(calculateFinalPrice(sellingPrice, formData.discountType, formData.discountValue))
      : undefined;

  // Use a strictly typed object to match ProductCreateRequest.java
  const payload: BackendProductRequest = {
    name: formData.name.trim(),
    description: formData.description?.trim() || undefined,
    sku: (formData.sku || '').trim().toUpperCase(),
    price: Number(sellingPrice.toFixed(2)),
    stockQuantity: Math.floor(Number(formData.stockQuantity) || 0),
    categoryId: Math.floor(Number(formData.categoryId)),
    featured: Boolean(formData.featured),
  };

  // Map category details for backend persistence/validation
  if (category) {
    payload.categoryType = determineCategoryType(category.name);
  }

  if (subCategory) {
    payload.subCategory = subCategory.name;
  }

  // Map dynamic attributes
  const dynamicAttributes = buildCategoryAttributes(formData, category?.name || '', brandName);
  if (Object.keys(dynamicAttributes).length > 0) {
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
