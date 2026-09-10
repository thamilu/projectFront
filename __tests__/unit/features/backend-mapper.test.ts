import { mapFormToBackendRequest } from '@/features/products/mappers/backend-mapper';
import type { ProductFormData } from '@/domains/catalog/contracts/product-form.schema';
import type { Category } from '@/shared/types/product';

function buildFormData(overrides: Partial<ProductFormData> = {}): ProductFormData {
  return {
    name: '  Wireless Mouse  ',
    sku: 'wm-100',
    description: 'A great wireless mouse with long battery life.',
    categoryId: 5,
    brandId: 7,
    tags: [],
    sellingPrice: 999.995,
    mrp: 1499,
    discountType: 'NONE',
    discountValue: 0,
    taxType: 'GST',
    taxPercentage: 18,
    stockQuantity: 42.9,
    stockStatus: 'IN_STOCK',
    minOrderQuantity: 1,
    maxOrderQuantity: 999,
    lowStockThreshold: 5,
    images: [],
    primaryImageIndex: 0,
    hasVariants: false,
    featured: false,
    seoKeywords: [],
    ...overrides,
  } as unknown as ProductFormData;
}

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 5,
    name: 'Electronics',
    active: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as Category;
}

describe('mapFormToBackendRequest', () => {
  it('trims/normalizes core fields and floors numeric fields', () => {
    const result = mapFormToBackendRequest(
      buildFormData(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.name).toBe('Wireless Mouse');
    expect(result.sku).toBe('WM-100');
    expect(result.stockQuantity).toBe(42); // Math.floor(42.9)
    expect(result.categoryId).toBe(5);
    expect(result.price).toBe(1000); // Number(999.995.toFixed(2)) rounds to 1000.00
  });

  it('omits discountPrice when discountType is NONE', () => {
    const result = mapFormToBackendRequest(
      buildFormData({ discountType: 'NONE' }),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.discountPrice).toBeUndefined();
  });

  it('includes a computed discountPrice when a discount is set', () => {
    const result = mapFormToBackendRequest(
      buildFormData({ discountType: 'PERCENTAGE', discountValue: 10, sellingPrice: 1000 }),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.discountPrice).toBe(900);
  });

  it('never trusts a non-positive shopId as storeId', () => {
    const result = mapFormToBackendRequest(
      buildFormData(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      0
    );

    expect(result.storeId).toBeUndefined();
  });

  it('generates a friendlyUrl from the product name when no slug is given', () => {
    const result = mapFormToBackendRequest(
      buildFormData({ name: 'Wireless Mouse Pro', slug: undefined }),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.friendlyUrl).toBe('wireless-mouse-pro');
  });

  it('defaults tags to an empty array when no seoKeywords are provided', () => {
    const result = mapFormToBackendRequest(
      buildFormData({ seoKeywords: undefined }),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.tags).toEqual([]);
  });

  // KNOWN LIMITATION (tracked in the products-feature audit as DEBT-01):
  // this mapper accepts thirdLevelCategory/fourthLevelCategory but the
  // backend's field name for deeper category levels isn't confirmed
  // anywhere in this repo, so they are intentionally not sent yet rather
  // than guessed at. This test documents the current (limited) behavior so
  // a future fix is a deliberate, visible change to this test, not a
  // silent regression.
  it('does not yet forward third/fourth-level category selections to the backend', () => {
    const thirdLevel = buildCategory({ id: 50, name: 'Smartphones' });
    const fourthLevel = buildCategory({ id: 51, name: 'Android' });

    const result = mapFormToBackendRequest(
      buildFormData(),
      buildCategory(),
      buildCategory({ id: 6, name: 'Mobile Phones' }),
      thirdLevel,
      fourthLevel,
      undefined,
      undefined
    );

    expect(result).not.toHaveProperty('thirdLevelCategory');
    expect(result).not.toHaveProperty('fourthLevelCategory');
    expect(JSON.stringify(result)).not.toContain('Android');
  });

  // KNOWN LIMITATION (tracked in the products-feature audit as DEBT-02):
  // any category name containing "electronic" is hardcoded to type
  // 'SMARTPHONE', including categories that are not phones. Documented
  // here rather than silently relied upon.
  it('mis-infers a non-smartphone electronics category as type SMARTPHONE (documented limitation)', () => {
    const result = mapFormToBackendRequest(
      buildFormData(),
      buildCategory({ name: 'Consumer Electronics' }),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.attributes?.type).toBe('SMARTPHONE');
  });

  it('correctly classifies a real category via determineCategoryType', () => {
    const result = mapFormToBackendRequest(
      buildFormData(),
      buildCategory({ name: 'Home & Living' }),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.categoryType).toBe('HOME');
  });

  it('falls back to OTHER for an unrecognized category name', () => {
    const result = mapFormToBackendRequest(
      buildFormData(),
      buildCategory({ name: 'Something Brand New' }),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(result.categoryType).toBe('OTHER');
  });
});
