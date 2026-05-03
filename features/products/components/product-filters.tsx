/**
 * Product Filters Component
 * Sidebar filters for products
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { CategoryDTO, BrandDTO } from '@/types';

interface ProductFiltersProps {
  categories?: CategoryDTO[];
  brands?: BrandDTO[];
  onFilterChange: (filters: Record<string, unknown>) => void;
}

export function ProductFilters({
  categories = [],
  brands = [],
  onFilterChange,
}: ProductFiltersProps) {
  const [filters, setFilters] = useState({
    categoryIds: [] as number[],
    brandIds: [] as number[],
    minPrice: '',
    maxPrice: '',
    inStock: false,
  });

  const handleCategoryToggle = (categoryId: number) => {
    const newCategories = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter((id) => id !== categoryId)
      : [...filters.categoryIds, categoryId];
    
    const newFilters = { ...filters, categoryIds: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleBrandToggle = (brandId: number) => {
    const newBrands = filters.brandIds.includes(brandId)
      ? filters.brandIds.filter((id) => id !== brandId)
      : [...filters.brandIds, brandId];
    
    const newFilters = { ...filters, brandIds: newBrands };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      categoryIds: [],
      brandIds: [],
      minPrice: '',
      maxPrice: '',
      inStock: false,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Range */}
          <div>
            <Label className="mb-2 block">Price Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                onBlur={handlePriceChange}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                onBlur={handlePriceChange}
              />
            </div>
          </div>

          {/* In Stock */}
          <div className="flex items-center gap-2">
            <Checkbox.Root
              checked={filters.inStock}
              onCheckedChange={(checked) => {
                const newFilters = { ...filters, inStock: checked as boolean };
                setFilters(newFilters);
                onFilterChange(newFilters);
              }}
              className="flex h-5 w-5 items-center justify-center rounded border border-input bg-background"
            >
              <Checkbox.Indicator>
                <Check className="h-4 w-4" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <Label>In Stock Only</Label>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <Label className="mb-2 block">Categories</Label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                    <Checkbox.Root
                      checked={filters.categoryIds.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                      className="flex h-5 w-5 items-center justify-center rounded border border-input bg-background"
                    >
                      <Checkbox.Indicator>
                        <Check className="h-4 w-4" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Label className="text-sm">{category.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {brands.length > 0 && (
            <div>
              <Label className="mb-2 block">Brands</Label>
              <div className="space-y-2">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center gap-2">
                    <Checkbox.Root
                      checked={filters.brandIds.includes(brand.id)}
                      onCheckedChange={() => handleBrandToggle(brand.id)}
                      className="flex h-5 w-5 items-center justify-center rounded border border-input bg-background"
                    >
                      <Checkbox.Indicator>
                        <Check className="h-4 w-4" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Label className="text-sm">{brand.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={handleReset}>
            Reset Filters
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
