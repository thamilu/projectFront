'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Package, DollarSign, Tag, Image as ImageIcon, Settings } from 'lucide-react';
import { productSchema, ProductFormData } from '@/schemas/product.schema';
import { useAddProduct } from '@/features/seller/hooks/useAddProduct';
import { useSellerStore } from '../hooks/use-seller';
import { ImageUploader } from './ImageUploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/constants/routes/app-routes';

// Mock data - Replace with API calls
const CATEGORIES = [
  {
    id: 1,
    name: 'Electronics',
    type: 'ELECTRONICS',
    subcategories: ['Smartphones', 'Laptops', 'Tablets', 'Cameras', 'Audio'],
  },
  {
    id: 2,
    name: 'Fashion',
    type: 'FASHION',
    subcategories: ["Men's Clothing", "Women's Clothing", 'Shoes', 'Accessories'],
  },
  {
    id: 3,
    name: 'Home & Living',
    type: 'HOME',
    subcategories: ['Furniture', 'Decor', 'Kitchen', 'Bedding'],
  },
  {
    id: 4,
    name: 'Sports',
    type: 'SPORTS',
    subcategories: ['Fitness', 'Outdoor', 'Team Sports', 'Athletic Wear'],
  },
];

const BRANDS = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Samsung' },
  { id: 3, name: 'Nike' },
  { id: 4, name: 'Adidas' },
  { id: 5, name: 'Sony' },
];

// Helper function to generate SKU
const generateSKU = (name: string): string => {
  const prefix = name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
};

// Helper function to generate friendly URL
const generateFriendlyUrl = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export function AddProductForm() {
  const router = useRouter();
  const addProductMut = useAddProduct();
  const { data: storeData, isLoading: isLoadingStore, error: storeError } = useSellerStore();
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[0] | null>(null);

  // Show loading state while checking for store
  if (isLoadingStore) {
    return (
      <Card className="mx-auto max-w-5xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
            <p className="text-muted-foreground mt-4">Loading store information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if store doesn't exist
  if (storeError || !storeData?.id) {
    return (
      <Card className="mx-auto max-w-5xl">
        <CardHeader>
          <CardTitle>Store Setup Required</CardTitle>
          <CardDescription>You need to create a store before adding products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Before you can add products, you need to set up your store with basic information like
            store name, description, and contact details.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => router.push(APP_ROUTES.SELLER.STORE_CREATE)}>Create Store</Button>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const form = useForm<ProductFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      sku: '',
      friendlyUrl: '',
      description: '',
      shortDescription: '',
      categoryId: 0,
      subCategory: '',
      price: 0,
      discountPrice: null,
      stockQuantity: 0,
      lowStockThreshold: 10,
      images: [],
      attributes: {
        brand: '',
        type: '',
        size: '',
        availableSizes: '',
        color: '',
        availableColors: '',
      },
      tags: [],
      featured: false,
      status: 'DRAFT',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchName = watch('name');
  const watchCategoryId = watch('categoryId');
  const watchBrandId = watch('brandId');

  // Auto-generate SKU and Friendly URL when name changes
  useEffect(() => {
    if (watchName && watchName.length >= 3) {
      if (!form.getValues('sku')) {
        setValue('sku', generateSKU(watchName));
      }
      setValue('friendlyUrl', generateFriendlyUrl(watchName));
    }
  }, [watchName, setValue, form]);

  // Update selected category when categoryId changes
  useEffect(() => {
    if (watchCategoryId) {
      const category = CATEGORIES.find((c) => c.id === Number(watchCategoryId));
      setSelectedCategory(category || null);

      // Auto-fill Product Type from category type
      if (category?.type) {
        setValue('attributes.type', category.type);
      }
    }
  }, [watchCategoryId, setValue]);

  // Auto-fill Brand Name when brand is selected
  useEffect(() => {
    if (watchBrandId) {
      const brand = BRANDS.find((b) => b.id === Number(watchBrandId));
      if (brand) {
        setValue('attributes.brand', brand.name);
      }
    }
  }, [watchBrandId, setValue]);

  const onSubmit = (data: ProductFormData) => {
    if (!storeData?.id) {
      toast.error('Store not found', {
        description: 'Please complete your store setup before adding products.',
      });
      return;
    }

    // Set primary image URL from first image and add storeId
    const payload = {
      ...data,
      imageUrl: data.images[0] || '',
      categoryType: selectedCategory?.type,
      shopId: storeData.id,
    };


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addProductMut.mutate(payload as any, {
      onSuccess: () => {
        router.push(APP_ROUTES.SELLER.PRODUCTS);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        const details = error?.details || error?.fieldErrors;
        if (details && Array.isArray(details)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details.forEach((err: any) => {
            if (err.field) {
              form.setError(err.field as any, { type: 'server', message: err.message });
            }
          });
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-5xl space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="text-primary h-5 w-5" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>Essential product details and identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" placeholder="e.g., iPhone 16 Pro 256GB" {...register('name')} />
              {errors.name && (
                <p className="text-destructive mt-1 text-xs">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
              <Input
                id="sku"
                placeholder="Auto-generated"
                {...register('sku', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  },
                })}
              />
              {errors.sku && (
                <p className="text-destructive mt-1 text-xs">{errors.sku.message}</p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">Leave empty to auto-generate</p>
            </div>

            <div>
              <Label htmlFor="friendlyUrl">URL Slug</Label>
              <Input
                id="friendlyUrl"
                placeholder="Auto-generated from name"
                {...register('friendlyUrl', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  },
                })}
              />
              {errors.friendlyUrl && (
                <p className="text-destructive mt-1 text-xs">{errors.friendlyUrl.message}</p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">Used in product URL</p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your product in detail..."
              rows={6}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-destructive mt-1 text-xs">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              placeholder="Brief description for product listings (optional)"
              rows={2}
              {...register('shortDescription')}
            />
            <p className="text-muted-foreground mt-1 text-xs">Max 500 characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Inventory */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="text-primary h-5 w-5" />
            <CardTitle>Pricing & Inventory</CardTitle>
          </div>
          <CardDescription>Set pricing and manage stock levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="price">Regular Price (INR) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-destructive mt-1 text-xs">{errors.price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="discountPrice">Sale Price (INR)</Label>
              <Input
                id="discountPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('discountPrice', {
                  setValueAs: (v) => (v === '' ? null : parseFloat(v)),
                })}
              />
              <p className="text-muted-foreground mt-1 text-xs">Optional discount price</p>
            </div>

            <div>
              <Label htmlFor="stockQuantity">Stock Quantity *</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                placeholder="0"
                {...register('stockQuantity', { valueAsNumber: true })}
              />
              {errors.stockQuantity && (
                <p className="text-destructive mt-1 text-xs">{errors.stockQuantity.message}</p>
              )}
            </div>
          </div>

          <div className="md:w-1/3">
            <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              min="0"
              defaultValue={10}
              {...register('lowStockThreshold', { valueAsNumber: true })}
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Alert when stock falls below this number
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Categories & Classification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="text-primary h-5 w-5" />
            <CardTitle>Categories & Classification</CardTitle>
          </div>
          <CardDescription>Organize your product for better discoverability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="categoryId">Category *</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-destructive mt-1 text-xs">{errors.categoryId.message}</p>
              )}
            </div>

            {selectedCategory && (
              <div>
                <Label htmlFor="subCategory">Subcategory</Label>
                <Controller
                  name="subCategory"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategory.subcategories.map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div>
              <Label htmlFor="brandId">Brand *</Label>
              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="smartphone, apple, 5g (comma separated)"
                onChange={(e) => {
                  const tags = e.target.value
                    .split(',')
                    .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    .filter(Boolean);
                  setValue('tags', tags, { shouldValidate: true });
                }}
              />
              {errors.tags && (
                <p className="text-destructive mt-1 text-xs">{errors.tags.message}</p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">Separate tags with commas (only letters, numbers, hyphens allowed)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Attributes */}
      <Card>
        <CardHeader>
          <CardTitle>Product Attributes</CardTitle>
          <CardDescription>Specific characteristics of your product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="attributes.brand">Brand Name *</Label>
              <Input
                id="attributes.brand"
                placeholder="e.g., Apple"
                {...register('attributes.brand')}
              />
              {errors.attributes?.brand && (
                <p className="text-destructive mt-1 text-xs">{errors.attributes.brand.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="attributes.type">Product Type</Label>
              <Input
                id="attributes.type"
                placeholder="e.g., SMARTPHONE"
                {...register('attributes.type')}
              />
            </div>

            <div>
              <Label htmlFor="attributes.availableSizes">Available Sizes/Capacities</Label>
              <Input
                id="attributes.availableSizes"
                placeholder="128GB, 256GB, 512GB, 1TB"
                {...register('attributes.availableSizes')}
              />
            </div>

            <div>
              <Label htmlFor="attributes.availableColors">Available Colors</Label>
              <Input
                id="attributes.availableColors"
                placeholder="Natural Titanium, Blue Titanium, White Titanium"
                {...register('attributes.availableColors')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Images */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="text-primary h-5 w-5" />
            <CardTitle>Product Images</CardTitle>
          </div>
          <CardDescription>
            Upload product photos (first image will be the primary image)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            value={form.getValues('images')}
            onChange={(imgs) => form.setValue('images', imgs, { shouldValidate: true })}
            maxImages={10}
            maxSizeMB={5}
          />
          {errors.images && (
            <p className="text-destructive mt-2 text-xs">{errors.images.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="text-primary h-5 w-5" />
            <CardTitle>Product Settings</CardTitle>
          </div>
          <CardDescription>Configure product visibility and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft (not visible to customers)</SelectItem>
                      <SelectItem value="ACTIVE">Active (live on store)</SelectItem>
                      <SelectItem value="INACTIVE">Inactive (hidden)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-muted-foreground mt-1 text-xs">Product visibility status</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="featured">Featured Product</Label>
                <p className="text-muted-foreground text-xs">Show in featured section</p>
              </div>
              <Controller
                name="featured"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="featured"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={addProductMut.status === 'pending'}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addProductMut.status === 'pending'}>
              {addProductMut.status === 'pending' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {addProductMut.status === 'pending' ? 'Creating Product...' : 'Create Product'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default AddProductForm;
