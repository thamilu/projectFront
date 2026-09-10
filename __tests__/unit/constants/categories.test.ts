import {
  isCategoryId,
  sortCategories,
  getActiveCategories,
  findCategoryById,
  findCategoryBySlug,
  formatCategoryCount,
  getCategoryChildren,
  getCategoryAncestors,
  buildCategoryTree,
  CATEGORIES,
} from '@/shared/constants';

describe('Category Constants & Utilities', () => {
  describe('isCategoryId', () => {
    it('should return true for valid category IDs', () => {
      expect(isCategoryId('electronics')).toBe(true);
      expect(isCategoryId('fashion')).toBe(true);
      expect(isCategoryId('books-stationery')).toBe(true);
      expect(isCategoryId('smartphones')).toBe(true);
    });

    it('should return false for invalid category IDs', () => {
      expect(isCategoryId('invalid')).toBe(false);
      expect(isCategoryId('')).toBe(false);
      expect(isCategoryId('1')).toBe(false);
      expect(isCategoryId('books')).toBe(false); // Old ID, now books-stationery
    });
  });

  describe('sortCategories', () => {
    it('should sort categories by sortOrder in ascending order', () => {
      const unsorted = [
        { ...CATEGORIES[1], sortOrder: 3 },
        { ...CATEGORIES[0], sortOrder: 1 },
        { ...CATEGORIES[2], sortOrder: 2 },
      ];
      const sorted = sortCategories(unsorted);
      expect(sorted[0].sortOrder).toBe(1);
      expect(sorted[1].sortOrder).toBe(2);
      expect(sorted[2].sortOrder).toBe(3);
    });
  });

  describe('getActiveCategories', () => {
    it('should filter out inactive categories', () => {
      const mockCategories = [
        {
          id: 'electronics',
          name: 'Electronics',
          slug: 'electronics',
          parentId: null,
          level: 0,
          iconName: 'Laptop',
          iconAriaLabel: 'Electronics',
          gradientClass: 'category-electronics',
          sortOrder: 1,
          approximateProductCount: 100,
          description: 'Electronics description',
          isActive: true,
          seo: { title: 'Electronics', description: 'Desc' },
        },
        {
          id: 'fashion',
          name: 'Fashion',
          slug: 'fashion',
          parentId: null,
          level: 0,
          iconName: 'Shirt',
          iconAriaLabel: 'Fashion',
          gradientClass: 'category-fashion',
          sortOrder: 2,
          approximateProductCount: 200,
          description: 'Fashion description',
          isActive: false,
          seo: { title: 'Fashion', description: 'Desc' },
        },
        {
          id: 'home-living',
          name: 'Home & Living',
          slug: 'home-living',
          parentId: null,
          level: 0,
          iconName: 'Home',
          iconAriaLabel: 'Home & Living',
          gradientClass: 'category-home-living',
          sortOrder: 3,
          approximateProductCount: 300,
          description: 'Home description',
          isActive: true,
          seo: { title: 'Home & Living', description: 'Desc' },
        },
      ] as any;

      const active = getActiveCategories(mockCategories);
      expect(active).toHaveLength(2);
      expect(active.find((c) => c.id === 'fashion')).toBeUndefined();
    });
  });

  describe('findCategoryById', () => {
    it('should retrieve the correct category by its ID', () => {
      const match = findCategoryById('electronics');
      expect(match).toBeDefined();
      expect(match?.name).toBe('Electronics');
    });

    it('should return undefined if the category ID is not found', () => {
      const match = findCategoryById('nonexistent');
      expect(match).toBeUndefined();
    });
  });

  describe('findCategoryBySlug', () => {
    it('should retrieve the correct category by its slug', () => {
      const match = findCategoryBySlug('home-living');
      expect(match).toBeDefined();
      expect(match?.name).toBe('Home & Living');
    });

    it('should return undefined if the category slug is not found', () => {
      const match = findCategoryBySlug('nonexistent');
      expect(match).toBeUndefined();
    });
  });

  describe('formatCategoryCount', () => {
    it('should format counts under 1,000 as standard strings', () => {
      expect(formatCategoryCount(150)).toBe('150');
      expect(formatCategoryCount(999)).toBe('999');
    });

    it('should format counts in the thousands with K suffix', () => {
      expect(formatCategoryCount(1000)).toBe('1.0K');
      expect(formatCategoryCount(5200)).toBe('5.2K');
      expect(formatCategoryCount(99900)).toBe('99.9K');
    });

    it('should format counts in the millions with M suffix', () => {
      expect(formatCategoryCount(1000000)).toBe('1.0M');
      expect(formatCategoryCount(2500000)).toBe('2.5M');
    });
  });

  describe('getCategoryChildren', () => {
    it('should return child categories of a given parent category ID', () => {
      const children = getCategoryChildren('electronics');
      expect(children).toBeDefined();
      expect(children.every((c) => c.parentId === 'electronics')).toBe(true);
      const childIds = children.map((c) => c.id);
      expect(childIds).toContain('smartphones');
      expect(childIds).toContain('laptops');
      expect(childIds).toContain('cameras');
    });

    it('should return empty array if category has no children', () => {
      const children = getCategoryChildren('smartphones');
      expect(children).toEqual([]);
    });
  });

  describe('getCategoryAncestors', () => {
    it('should return parent ancestors in order from top-level down', () => {
      const ancestors = getCategoryAncestors('smartphones');
      expect(ancestors).toHaveLength(1);
      expect(ancestors[0].id).toBe('electronics');
    });

    it('should return empty array for top-level category', () => {
      const ancestors = getCategoryAncestors('electronics');
      expect(ancestors).toEqual([]);
    });
  });

  describe('buildCategoryTree', () => {
    it('should build a nested tree structure of categories', () => {
      const tree = buildCategoryTree();
      expect(tree).toBeDefined();

      const electronicsNode = tree.find((n) => n.id === 'electronics');
      expect(electronicsNode).toBeDefined();
      expect(electronicsNode?.children).toBeDefined();

      const smartphonesNode = electronicsNode?.children.find((c) => c.id === 'smartphones');
      expect(smartphonesNode).toBeDefined();
      expect(smartphonesNode?.parentId).toBe('electronics');
    });
  });
});
