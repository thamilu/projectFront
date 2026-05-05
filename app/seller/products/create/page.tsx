'use client';

import React, { useState } from 'react';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-nextauth';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useCategories, useBrands, useCreateProduct } from '@/features/products/hooks/use-products';
import { productApi } from '@/features/products/api/product-api';
import {
  productFormSchema,
  type ProductFormData,
  generateSlug,
  generateSKU,
  calculateFinalPrice,
} from '@/lib/validation/schemas/product-form-schema';
import {
  mapFormToBackendRequest,
  ProductPayloadValidationError,
} from '@/lib/product/backend-mapper';
import { normalizeProductCreateError } from '@/lib/product/product-create-error-taxonomy';
import { PRODUCT_FORM_CONSTANTS } from '@/lib/product/constants';
import { productImagesApi } from '@/lib/api/product-images';
import { getRequestLogger } from '@/lib/observability/logger';
import type { Category, Brand } from '@/types/product';
import { CATEGORY_ATTRIBUTES, getCategoryKey } from '@/lib/config/product-attributes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { LocalImageUploader } from '@/components/LocalImageUploader';
import {
  Package,
  DollarSign,
  Warehouse,
  Image as ImageIcon,
  Settings,
  HelpCircle,
  Check,
  ChevronsUpDown,
  TrendingDown,
  Calculator,
  IndianRupee,
  Globe,
  MapPin,
  RotateCcw,
  Truck,
  Star,
  Share2,
  Heart,
  ShieldCheck,
  Tag,
  List,
} from 'lucide-react';
import Image from 'next/image';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export default function CreateProductPage() {
  const parseOptionalNumber = (value: string | number) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const parseNumberWithDefault = (value: string | number, fallback: number) => {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const router = useRouter();
  const { user, isLoading, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [brandPurpose, setBrandPurpose] = useState('');
  const [brandDocument, setBrandDocument] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const PERSISTENCE_KEY = 'eshop_seller_create_product_form';
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);
  const [thirdLevelCategoryOpen, setThirdLevelCategoryOpen] = useState(false);
  const [fourthLevelCategoryOpen, setFourthLevelCategoryOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  const categories = useCategories();
  const brands = useBrands();
  const createMutation = useCreateProduct();

  // Fetch category tree for hierarchical data
  const { data: categoryTree } = useQuery({
    queryKey: ['categoryTree'],
    queryFn: () => productApi.getCategoryTree(),
    staleTime: PRODUCT_FORM_CONSTANTS.STALE_TIME_MS,
  });

  // Get all categories (including children) for sub-category lookup
  const allCategories = React.useMemo((): Category[] => {
    const raw = categories.data;
    if (Array.isArray(raw)) return raw as Category[];
    return [];
  }, [categories.data]);

  // Filter to show only top-level categories in main dropdown
  const categoryList = React.useMemo((): Category[] => {
    let categories: Category[] = [];
    if (Array.isArray(categoryTree) && categoryTree.length > 0) {
      categories = categoryTree as Category[];
    } else {
      // Fallback to filtered list
      categories = allCategories.filter((cat) => !cat.parentCategory && !cat.parent_id);
    }
    // Sort alphabetically by name
    return categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [categoryTree, allCategories]);

  const brandList = React.useMemo((): Brand[] => {
    const raw = brands.data;
    if (Array.isArray(raw)) {
      const brandArray = raw as Brand[];
      // Sort alphabetically by name
      return brandArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return [];
  }, [brands.data]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      categoryId: undefined,
      sellingPrice: 0,
      // ...
      mrp: 0,
      discountType: 'NONE',
      discountValue: 0,
      taxType: 'GST',
      taxPercentage: PRODUCT_FORM_CONSTANTS.DEFAULT_TAX_PERCENTAGE,
      stockQuantity: 0,
      stockStatus: PRODUCT_FORM_CONSTANTS.DEFAULT_STOCK_STATUS,
      minOrderQuantity: PRODUCT_FORM_CONSTANTS.DEFAULT_MIN_ORDER_QUANTITY,
      maxOrderQuantity: PRODUCT_FORM_CONSTANTS.DEFAULT_MAX_ORDER_QUANTITY,
      lowStockThreshold: PRODUCT_FORM_CONSTANTS.DEFAULT_LOW_STOCK_THRESHOLD,
      weightUnit: PRODUCT_FORM_CONSTANTS.DEFAULT_WEIGHT_UNIT,
      dimensionUnit: PRODUCT_FORM_CONSTANTS.DEFAULT_DIMENSION_UNIT,
      deliveryTime: PRODUCT_FORM_CONSTANTS.DEFAULT_DELIVERY_DAYS,
      status: PRODUCT_FORM_CONSTANTS.DEFAULT_PRODUCT_STATUS,
      featured: false,
      newArrival: false,
      freeShipping: false,
      hasVariants: false,
      countryOfOrigin: PRODUCT_FORM_CONSTANTS.DEFAULT_COUNTRY_OF_ORIGIN,
      images: [],
      primaryImageIndex: 0,
    },
  });

  const [isRestored, setIsRestored] = useState(false);

  // Load persisted data on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem(PERSISTENCE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          // Ensure numeric fields are actually numbers after JSON parse
          const sanitized = {
            ...parsed,
            categoryId: parsed.categoryId ? Number(parsed.categoryId) : undefined,
            subCategoryId: parsed.subCategoryId ? Number(parsed.subCategoryId) : undefined,
            thirdLevelCategoryId: parsed.thirdLevelCategoryId ? Number(parsed.thirdLevelCategoryId) : undefined,
            fourthLevelCategoryId: parsed.fourthLevelCategoryId ? Number(parsed.fourthLevelCategoryId) : undefined,
            brandId: parsed.brandId ? Number(parsed.brandId) : undefined,
            sellingPrice: Number(parsed.sellingPrice) || 0,
            mrp: Number(parsed.mrp) || 0,
            discountValue: Number(parsed.discountValue) || 0,
            taxPercentage: Number(parsed.taxPercentage) || 0,
            stockQuantity: Number(parsed.stockQuantity) || 0,
            minOrderQuantity: Number(parsed.minOrderQuantity) || 1,
            maxOrderQuantity: Number(parsed.maxOrderQuantity) || 999,
            lowStockThreshold: Number(parsed.lowStockThreshold) || 5,
          };

          // Use reset for atomic implementation
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reset(sanitized as any);
          toast.info('Form data restored from your previous session.');
        }
      } catch (e) {
        console.error('Failed to restore form data', e);
      }
    }
    setIsRestored(true);
  }, [reset]);

  // Persist form data on change
  const watchAllFields = watch();
  React.useEffect(() => {
    // CRITICAL: Do not persist until we've attempted restoration
    // AND don't persist completely empty/default forms to avoid overwriting good data
    if (!isRestored) return;

    // Only save if some meaningful data exists
    const hasData = watchAllFields.name?.trim() ||
      watchAllFields.categoryId ||
      watchAllFields.description?.trim() ||
      watchAllFields.sku?.trim();

    if (!hasData) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(watchAllFields));
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [watchAllFields, isRestored]);

  // Watch values for auto-generation and preview
  const watchName = watch('name');
  const watchSellingPrice = watch('sellingPrice');
  const watchMrp = watch('mrp');
  const watchDiscountType = watch('discountType');
  const watchDiscountValue = watch('discountValue');
  const watchDescription = watch('description');
  const watchTaxPercentage = watch('taxPercentage');

  // Calculated values
  const watchCategoryId = watch('categoryId');
  const watchSubCategoryId = watch('subCategoryId');
  const watchThirdLevelCategoryId = watch('thirdLevelCategoryId');
  const watchFourthLevelCategoryId = watch('fourthLevelCategoryId');
  const watchBrandId = watch('brandId');

  const activeCategory = React.useMemo(
    () => categoryList.find((c) => c.id === watchCategoryId),
    [categoryList, watchCategoryId]
  );

  // Auto-generate URL slug from product name
  React.useEffect(() => {
    if (watchName && watchName.length >= 3) {
      const generatedSlug = generateSlug(watchName);
      setValue('slug', generatedSlug);
      // Also auto-generate SEO title (max 60 chars)
      setValue('seoTitle', watchName.substring(0, 60));
    }
  }, [watchName, setValue]);

  // Auto-generate SEO description from product description
  React.useEffect(() => {
    if (watchDescription && watchDescription.length >= 10) {
      // Use first 160 characters of description for SEO
      setValue('seoDescription', watchDescription.substring(0, 160));
    }
  }, [watchDescription, setValue]);

  // Filter brands based on selected category
  const filteredBrands = React.useMemo((): Brand[] => {
    // If "Show All Brands" is enabled, bypass filtering
    if (showAllBrands) return brandList;

    if (!watchCategoryId) return brandList;

    const category = categoryList.find((c) => c.id === watchCategoryId);
    const categoryName = category?.name?.toLowerCase() || '';

    // Define category-specific brand mappings
    const groceryBrands = [
      'Tata',
      'Fortune',
      'Amul',
      'Mother Dairy',
      'Aashirvaad',
      'Britannia',
      'Parle',
      'ITC',
      'Nestle',
      'Dabur',
    ];
    const electronicsBrands = [
      'Samsung',
      'Apple',
      'Sony',
      'LG',
      'Dell',
      'HP',
      'Lenovo',
      'Asus',
      'OnePlus',
      'Xiaomi',
      'Realme',
    ];
    const fashionBrands = [
      'Nike',
      'Adidas',
      'Puma',
      "Levi's",
      'H&M',
      'Zara',
      'Allen Solly',
      'Van Heusen',
      'Raymond',
      'Peter England',
    ];
    const beautyBrands = [
      'Nivea',
      "L'Oreal",
      'Maybelline',
      'Lakme',
      'Dove',
      'Garnier',
      'Himalaya',
      'Biotique',
    ];

    // Determine which brands to show based on category
    let allowedBrands: string[] = [];

    if (
      categoryName.includes('grocery') ||
      categoryName.includes('essential') ||
      categoryName.includes('food') ||
      categoryName.includes('fruit') ||
      categoryName.includes('vegetable')
    ) {
      allowedBrands = groceryBrands;
    } else if (
      categoryName.includes('electronic') ||
      categoryName.includes('mobile') ||
      categoryName.includes('laptop') ||
      categoryName.includes('computer')
    ) {
      allowedBrands = electronicsBrands;
    } else if (
      categoryName.includes('fashion') ||
      categoryName.includes('clothing') ||
      categoryName.includes('apparel') ||
      categoryName.includes('wear')
    ) {
      allowedBrands = fashionBrands;
    } else if (
      categoryName.includes('beauty') ||
      categoryName.includes('cosmetic') ||
      categoryName.includes('personal care')
    ) {
      allowedBrands = beautyBrands;
    } else {
      // For unmatched categories, show all brands
      return brandList;
    }

    // Filter brand list to only include relevant brands
    const filtered = brandList.filter((brand) =>
      allowedBrands.some((allowedBrand) =>
        brand.name.toLowerCase().includes(allowedBrand.toLowerCase())
      )
    );

    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [watchCategoryId, brandList, categoryList, showAllBrands]);

  // Auto-generate slug from name
  React.useEffect(() => {
    if (watchName) {
      setValue('slug', generateSlug(watchName));
    }
  }, [watchName, setValue]);

  // Auto-generate SKU
  const handleGenerateSKU = React.useCallback(() => {
    const category = categoryList.find((c) => c.id === watchCategoryId);
    const brand = brandList.find((b) => b.id === watchBrandId);
    const sku = generateSKU(category?.name || 'PROD', brand?.name);
    setValue('sku', sku);
  }, [categoryList, brandList, watchCategoryId, watchBrandId, setValue]);

  // Get dynamic helper text for product name
  const productNameHelperText = React.useMemo(() => {
    if (!watchCategoryId) {
      return 'Use format: Brand + Model + Key Feature. This appears in search results and product listings.';
    }

    const category = categoryList.find((c) => c.id === watchCategoryId);
    const categoryName = category?.name?.toLowerCase() || '';

    if (
      categoryName.includes('electronic') ||
      categoryName.includes('mobile') ||
      categoryName.includes('laptop')
    ) {
      return 'Format: Brand + Model + Specs (RAM/Storage) + Color (e.g., Samsung Galaxy S24 Ultra 12GB/256GB Titanium Gray)';
    }

    if (
      categoryName.includes('fashion') ||
      categoryName.includes('clothing') ||
      categoryName.includes('wear')
    ) {
      return "Format: Brand + Type + Material + Color + Gender (e.g., Levi's Men's 501 Original Fit Cotton Jeans Blue)";
    }

    if (categoryName.includes('home') || categoryName.includes('furniture')) {
      return 'Format: Brand + Product + Material + Dimensions (e.g., IKEA Billy Bookcase Engineered Wood 80x28x202 cm)';
    }

    if (categoryName.includes('beauty') || categoryName.includes('health')) {
      return 'Format: Brand + Product Name + Volume/Weight + Variant (e.g., Nivea Soft Light Moisturizer Cream 300ml)';
    }

    if (categoryName.includes('book')) {
      return 'Format: Title + Author + Binding + Edition (e.g., Atomic Habits by James Clear Hardcover 1st Edition)';
    }

    if (
      categoryName.includes('grocery') ||
      categoryName.includes('essential') ||
      categoryName.includes('food') ||
      categoryName.includes('fruit') ||
      categoryName.includes('vegetable')
    ) {
      return 'Format: Brand (if any) + Product Name + Quantity/Weight (e.g., Tata Salt Iodized 1kg)';
    }

    return `Use format: Brand + Model + Key Feature appropriate for ${category?.name || 'this category'}`;
  }, [watchCategoryId, categoryList]);

  // Get dynamic placeholder for product name
  const productNamePlaceholder = React.useMemo(() => {
    if (!watchCategoryId) {
      return 'e.g., Samsung Galaxy S24 Ultra (12GB RAM, 256GB)';
    }

    const category = categoryList.find((c) => c.id === watchCategoryId);
    const categoryName = category?.name?.toLowerCase() || '';

    if (
      categoryName.includes('electronic') ||
      categoryName.includes('mobile') ||
      categoryName.includes('laptop')
    ) {
      return 'e.g., Samsung Galaxy S24 Ultra 12GB/256GB Titanium Gray';
    }

    if (
      categoryName.includes('fashion') ||
      categoryName.includes('clothing') ||
      categoryName.includes('wear')
    ) {
      return "e.g., Levi's Men's 501 Original Fit Cotton Jeans Blue";
    }

    if (categoryName.includes('home') || categoryName.includes('furniture')) {
      return 'e.g., IKEA Billy Bookcase Engineered Wood 80x28x202 cm';
    }

    if (categoryName.includes('beauty') || categoryName.includes('health')) {
      return 'e.g., Nivea Soft Light Moisturizer Cream 300ml';
    }

    if (categoryName.includes('book')) {
      return 'e.g., Atomic Habits by James Clear Hardcover 1st Edition';
    }

    if (
      categoryName.includes('grocery') ||
      categoryName.includes('essential') ||
      categoryName.includes('food') ||
      categoryName.includes('fruit') ||
      categoryName.includes('vegetable')
    ) {
      return 'e.g., Fortune Sunlite Refined Sunflower Oil 1L';
    }

    return 'e.g., Product Name + Variant + Key Feature';
  }, [watchCategoryId, categoryList]);

  // Calculate final price with comprehensive breakdown
  const priceBreakdown = React.useMemo(() => {
    const mrp = watchMrp || 0;
    const sellingPrice = watchSellingPrice || 0;
    const taxRate = watchTaxPercentage || 0;

    // Calculate discounted price
    let discountedPrice = sellingPrice;
    if (watchDiscountType === 'PERCENTAGE') {
      discountedPrice = sellingPrice - (sellingPrice * (watchDiscountValue || 0)) / 100;
    } else if (watchDiscountType === 'FLAT') {
      discountedPrice = sellingPrice - (watchDiscountValue || 0);
    }
    discountedPrice = Math.max(discountedPrice, 0);

    const discountAmount = sellingPrice - discountedPrice;
    const discountPercentFromMRP = mrp > 0 ? ((mrp - discountedPrice) / mrp) * 100 : 0;
    const gstAmount = (discountedPrice * taxRate) / 100;
    const finalPriceWithGST = discountedPrice + gstAmount;
    const savings = mrp - discountedPrice;

    return {
      mrp,
      sellingPrice,
      discountedPrice,
      discountAmount,
      discountPercentFromMRP,
      gstAmount,
      finalPriceWithGST,
      savings,
      taxRate,
    };
  }, [watchMrp, watchSellingPrice, watchDiscountType, watchDiscountValue, watchTaxPercentage]);

  // Legacy finalPrice for backward compatibility
  const finalPrice = priceBreakdown.discountedPrice;

  // Form submission with backend mapping
  const onSubmit = React.useCallback(
    async (data: ProductFormData) => {
      const correlationId = crypto.randomUUID();
      const requestLogger = getRequestLogger(correlationId, {
        feature: 'seller-product-create',
      });

      requestLogger.info('Product create submission started', {
        categoryId: data.categoryId,
        hasBrand: Boolean(data.brandId),
        imageCount: imageFiles.length,
      });

      try {
        // Get category and brand details for mapping
        // const category = categoryList.find(c => c.id === data.categoryId)
        // const subCategory = category?.children?.find((sc: any) => sc.id === data.subCategoryId)
        // const brand = brandList.find(b => b.id === data.brandId)

        // Get shop/store ID from session
        // const shopId = user?.storeId || user?.shopId || 1

        // Map form data to backend API format
        // Submit to backend
        const userWithStore = user as { storeId?: number; shopId?: number } | undefined;
        const resolvedShopId = userWithStore?.storeId || userWithStore?.shopId;

        const backendRequest = mapFormToBackendRequest(
          data,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (categoryList as any[]).find((c) => c.id === data.categoryId),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (categoryList as any[])
            .find((c) => c.id === data.categoryId)
            ?.children?.find((sc: any) => sc.id === data.subCategoryId),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (categoryList as any[])
            .find((c) => c.id === data.categoryId)
            ?.children?.find((sc: any) => sc.id === data.subCategoryId)
            ?.children?.find((tc: any) => tc.id === data.thirdLevelCategoryId),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (categoryList as any[])
            .find((c) => c.id === data.categoryId)
            ?.children?.find((sc: any) => sc.id === data.subCategoryId)
            ?.children?.find((tc: any) => tc.id === data.thirdLevelCategoryId)
            ?.children?.find((fc: any) => fc.id === data.fourthLevelCategoryId),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (brandList as any[]).find((b) => b.id === data.brandId)?.name,
          resolvedShopId
        );

        requestLogger.debug('Product create payload validated', {
          shopId: resolvedShopId,
          hasDiscountPrice: typeof backendRequest.discountPrice === 'number',
          hasImageUrl: Boolean(backendRequest.imageUrl),
        });

        // Submit to backend
        const response = await createMutation.mutateAsync({
          payload: backendRequest as unknown as Record<string, unknown>,
          correlationId,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newProduct = response as any;
        const newProductId = newProduct?.id || newProduct?.data?.id;

        // Upload images if any
        if (newProductId && imageFiles.length > 0) {
          try {
            toast.info('Uploading product images...');
            const uploadPromises = imageFiles.map((file, index) =>
              productImagesApi.upload(String(newProductId), file, '', index === 0)
            );
            await Promise.all(uploadPromises);
          } catch (uploadError) {
            console.error('Image upload failed', uploadError);
            toast.error('Product created, but some images failed to upload.');
          }
        }

        requestLogger.info('Product create submission succeeded', {
          productId: newProductId,
        });

        toast.success('Product created successfully!');
        localStorage.removeItem(PERSISTENCE_KEY); // Clear persisted data
        router.push(APP_ROUTES.SELLER.PRODUCTS);
      } catch (error: any) {
        if (error instanceof ProductPayloadValidationError) {
          requestLogger.warn('Product create payload validation failed', {
            issues: error.issues,
          });
          toast.error(`Invalid product payload. Ref: ${correlationId}`);
          return;
        }

        const normalizedError = normalizeProductCreateError(error);
        
        // HARDENED ERROR CORRECTION: Map backend validation errors to form fields
        const backendErrors = error?.response?.data?.errors;
        if (backendErrors && typeof backendErrors === 'object') {
          Object.entries(backendErrors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages;
            setError(field as any, {
              type: 'server',
              message: message as string,
            });
          });
          toast.error('Validation Failure', {
            description: 'Please correct the highlighted fields in the product form.',
          });
        } else {
          requestLogger[normalizedError.logLevel]('Product create submission failed', {
            category: normalizedError.category,
            status: normalizedError.status,
            retryable: normalizedError.retryable,
            message: normalizedError.message,
            error,
          });

          toast.error(`${normalizedError.userMessage}. Ref: ${correlationId}`);
        }
      }
    },
    [categoryList, brands.data, user, createMutation, router, imageFiles]
  );

  const handleInvalidSubmit = React.useCallback(
    (formErrors: FieldErrors<ProductFormData>) => {
      const firstErrorField = Object.keys(formErrors)[0] as keyof ProductFormData | undefined;

      if (!firstErrorField) {
        toast.error('Please review the form and try again.');
        return;
      }

      const fieldTabMap: Partial<Record<keyof ProductFormData, string>> = {
        name: 'basic',
        sku: 'basic',
        categoryId: 'basic',
        subCategoryId: 'basic',
        thirdLevelCategoryId: 'basic',
        fourthLevelCategoryId: 'basic',
        brandId: 'basic',
        description: 'basic',
        shortDescription: 'details',
        attributes: 'details',
        sellingPrice: 'pricing',
        mrp: 'pricing',
        discountType: 'pricing',
        discountValue: 'pricing',
        taxType: 'pricing',
        taxPercentage: 'pricing',
        stockQuantity: 'inventory',
        stockStatus: 'inventory',
        minOrderQuantity: 'inventory',
        maxOrderQuantity: 'inventory',
        lowStockThreshold: 'inventory',
        weight: 'inventory',
        length: 'inventory',
        width: 'inventory',
        height: 'inventory',
        shippingCharges: 'inventory',
        deliveryTime: 'inventory',
        seoTitle: 'advanced',
        seoDescription: 'advanced',
        status: 'advanced',
        hsnCode: 'advanced',
        countryOfOrigin: 'advanced',
      };

      const targetTab = fieldTabMap[firstErrorField] ?? 'basic';
      setActiveTab(targetTab);

      const firstError = formErrors[firstErrorField];
      const errorMessage =
        firstError && typeof firstError === 'object' && 'message' in firstError
          ? firstError.message
          : undefined;

      toast.error(
        typeof errorMessage === 'string' ? errorMessage : 'Please fix highlighted fields.'
      );
    },
    [setActiveTab]
  );

  const handleClearForm = React.useCallback(() => {
    if (confirm('Are you sure you want to clear all entered data? This action cannot be undone.')) {
      localStorage.removeItem(PERSISTENCE_KEY);
      window.location.reload(); // Simplest way to reset all state including non-form state
    }
  }, [PERSISTENCE_KEY]);

  // Check if selected category is "Grocery & Essentials" and sub-category is "Fruits & Vegetables"
  const isGrocery = React.useMemo(() => {
    if (!watchCategoryId || !watchSubCategoryId) return false;

    // Find selected category and sub-category names
    const category = categoryList.find((c) => c.id === watchCategoryId);
    const categoryName = category?.name?.toLowerCase() || '';

    // Note: In a real app we might check IDs, but strict string matching is safer for now if IDs vary
    // Checking for "Grocery" main category
    const isGroceryMain = categoryName.includes('grocery') || categoryName.includes('essential');

    if (!isGroceryMain) return false;

    // Check sub-category
    const subCategories = category?.children || [];
    const subCategory = subCategories.find((sc: Category) => sc.id === watchSubCategoryId);
    const subCategoryName = subCategory?.name?.toLowerCase() || '';

    return subCategoryName.includes('fruit') || subCategoryName.includes('vegetable');
  }, [watchCategoryId, watchSubCategoryId, categoryList]);

  // Handle next tab
  const handleNext = React.useCallback(() => {
    switch (activeTab) {
      case 'basic':
        setActiveTab('details');
        break;
      case 'details':
        setActiveTab('pricing');
        break;
      case 'pricing':
        setActiveTab('inventory');
        break;
      case 'inventory':
        setActiveTab('advanced');
        break;
      case 'advanced':
        setActiveTab('preview');
        break;
      default:
        break;
    }
  }, [activeTab, isGrocery]);

  // Authentication is handled by the middleware and layout Guard
  // We just need to wait for auth to load to access user ID
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Double check role just in case (though Layout guard catches this)
  if (!user || !hasRole('SELLER')) {
    return null;
  }

  // Add loading and error states
  if (categories.isLoading || brands.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (categories.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Categories</CardTitle>
            <CardDescription>
              {categories.error?.message || 'Unable to load product categories'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => categories.refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (brands.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Brands</CardTitle>
            <CardDescription>{brands.error?.message || 'Unable to load brands'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => brands.refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <p className="text-muted-foreground mt-1">Add a new product to your store catalog</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}>
        <div className="w-full">
          {/* Main Form */}
          <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic" className="text-xs sm:text-sm">
                  <Package className="mr-1 h-4 w-4" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs sm:text-sm">
                  <List className="mr-1 h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="pricing" className="text-xs sm:text-sm">
                  <DollarSign className="mr-1 h-4 w-4" />
                  Pricing
                </TabsTrigger>
                <TabsTrigger value="inventory" className="text-xs sm:text-sm">
                  <Warehouse className="mr-1 h-4 w-4" />
                  Inventory
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs sm:text-sm">
                  <Settings className="mr-1 h-4 w-4" />
                  Advanced
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs sm:text-sm">
                  <ImageIcon className="mr-1 h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Essential product details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Category & Brand */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Image Upload Section */}
                      <div className="col-span-2 space-y-2">
                        <Label>Product Images</Label>
                        <LocalImageUploader
                          files={imageFiles}
                          onFilesChange={setImageFiles}
                          maxFiles={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="categoryId">Category *</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  Choose the main category. Sub-category options will appear after
                                  selection.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Controller
                          name="categoryId"
                          control={control}
                          render={({ field }) => (
                            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={categoryOpen}
                                  className="w-full justify-between font-normal"
                                >
                                  {field.value
                                    ? categoryList.find((cat) => cat.id === field.value)?.name
                                    : 'Select category'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-100 p-0">
                                <Command
                                  filter={(value, search) => {
                                    const itemName = value.toLowerCase();
                                    const searchTerm = search.toLowerCase();

                                    // Exact match or starts with
                                    if (
                                      itemName === searchTerm ||
                                      itemName.startsWith(searchTerm)
                                    ) {
                                      return 1;
                                    }
                                    // Contains the search term
                                    if (itemName.includes(searchTerm)) {
                                      return 0.5;
                                    }
                                    return 0;
                                  }}
                                >
                                  <CommandInput placeholder="Search categories..." />
                                  <CommandEmpty>No category found.</CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-auto">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {categoryList.map((cat: any) => (
                                      <CommandItem
                                        key={cat.id}
                                        value={cat.name}
                                        onSelect={() => {
                                          field.onChange(cat.id);
                                          setCategoryOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            field.value === cat.id ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                        {cat.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                        {errors.categoryId && (
                          <p className="text-sm text-red-500">{errors.categoryId.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subCategoryId">
                        Sub-Category{' '}
                        {watchCategoryId
                          ? `(Parent: ${watchCategoryId})`
                          : '(Select category first)'}
                      </Label>
                      <Controller
                        name="subCategoryId"
                        control={control}
                        render={({ field }) => {
                          // Get sub-categories for the selected category
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const selectedCategory = categoryList.find(
                            (c: any) => c.id === watchCategoryId
                          );
                          const subCategories = selectedCategory?.children || [];

                          // Sort sub-categories alphabetically
                          const sortedSubCategories = [...subCategories].sort(
                            (a: Category, b: Category) => (a.name || '').localeCompare(b.name || '')
                          );

                          return (
                            <Popover open={subCategoryOpen} onOpenChange={setSubCategoryOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={subCategoryOpen}
                                  className="w-full justify-between font-normal"
                                  disabled={!watchCategoryId}
                                >
                                  {field.value
                                    ? sortedSubCategories.find(
                                        (sc: Category) => sc.id === field.value
                                      )?.name
                                    : watchCategoryId
                                      ? 'Select sub-category (optional)'
                                      : 'Select a category first'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96 p-0">
                                <Command
                                  filter={(value, search) => {
                                    const itemName = value.toLowerCase();
                                    const searchTerm = search.toLowerCase();
                                    if (itemName === searchTerm || itemName.startsWith(searchTerm))
                                      return 1;
                                    if (itemName.includes(searchTerm)) return 0.5;
                                    return 0;
                                  }}
                                >
                                  <CommandInput placeholder="Search sub-categories..." />
                                  <CommandEmpty>No sub-category found.</CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-auto">
                                    {sortedSubCategories.length > 0 ? (
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      sortedSubCategories.map((subCat: any) => (
                                        <CommandItem
                                          key={subCat.id}
                                          value={subCat.name}
                                          onSelect={() => {
                                            field.onChange(subCat.id);
                                            setSubCategoryOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${
                                              field.value === subCat.id
                                                ? 'opacity-100'
                                                : 'opacity-0'
                                            }`}
                                          />
                                          {subCat.name}
                                        </CommandItem>
                                      ))
                                    ) : (
                                      <div className="text-muted-foreground py-6 text-center text-sm">
                                        No sub-categories available
                                      </div>
                                    )}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          );
                        }}
                      />
                    </div>

                    {watchSubCategoryId &&
                      (() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const selectedCategory = categoryList.find(
                          (c: any) => c.id === watchCategoryId
                        );
                        const subCategories = selectedCategory?.children || [];
                        const selectedSubCategory = subCategories.find(
                          (sc: Category) => sc.id === watchSubCategoryId
                        );
                        const thirdLevelCategories = selectedSubCategory?.children || [];

                        // Only show if there are third level categories
                        if (thirdLevelCategories.length === 0) return null;

                        const sortedThirdLevelCategories = [...thirdLevelCategories].sort(
                          (a: Category, b: Category) => (a.name || '').localeCompare(b.name || '')
                        );

                        return (
                          <div className="mt-4 space-y-2">
                            <Label htmlFor="thirdLevelCategoryId">
                              Specific Type{' '}
                              {selectedSubCategory ? `(Parent: ${selectedSubCategory.name})` : ''}
                            </Label>
                            <Controller
                              name="thirdLevelCategoryId"
                              control={control}
                              render={({ field }) => (
                                <Popover
                                  open={thirdLevelCategoryOpen}
                                  onOpenChange={setThirdLevelCategoryOpen}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={thirdLevelCategoryOpen}
                                      className="w-full justify-between font-normal"
                                    >
                                      {field.value
                                        ? sortedThirdLevelCategories.find(
                                            (tc: Category) => tc.id === field.value
                                          )?.name
                                        : 'Select specific category'}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-100 p-0">
                                    <Command
                                      filter={(value, search) => {
                                        const itemName = value.toLowerCase();
                                        const searchTerm = search.toLowerCase();
                                        if (
                                          itemName === searchTerm ||
                                          itemName.startsWith(searchTerm)
                                        )
                                          return 1;
                                        if (itemName.includes(searchTerm)) return 0.5;
                                        return 0;
                                      }}
                                    >
                                      <CommandInput placeholder="Search further options..." />
                                      <CommandEmpty>No options found.</CommandEmpty>
                                      <CommandGroup className="max-h-64 overflow-auto">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {sortedThirdLevelCategories.map((tc: any) => (
                                          <CommandItem
                                            key={tc.id}
                                            value={tc.name}
                                            onSelect={() => {
                                              field.onChange(tc.id);
                                              setThirdLevelCategoryOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                field.value === tc.id ? 'opacity-100' : 'opacity-0'
                                              }`}
                                            />
                                            {tc.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}
                            />
                          </div>
                        );
                      })()}

                    {watchThirdLevelCategoryId &&
                      (() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const selectedCategory = categoryList.find(
                          (c: any) => c.id === watchCategoryId
                        );
                        const subCategories = selectedCategory?.children || [];
                        const selectedSubCategory = subCategories.find(
                          (sc: Category) => sc.id === watchSubCategoryId
                        );
                        const thirdLevelCategories = selectedSubCategory?.children || [];
                        const selectedThirdLevelCategory = thirdLevelCategories.find(
                          (tc: Category) => tc.id === watchThirdLevelCategoryId
                        );
                        const fourthLevelCategories = selectedThirdLevelCategory?.children || [];

                        // Only show if there are fourth level categories
                        if (fourthLevelCategories.length === 0) return null;

                        const sortedFourthLevelCategories = [...fourthLevelCategories].sort(
                          (a: Category, b: Category) => (a.name || '').localeCompare(b.name || '')
                        );

                        return (
                          <div className="col-span-1 mt-4 space-y-2">
                            <Label htmlFor="fourthLevelCategoryId">
                              Product Name{' '}
                              {selectedThirdLevelCategory
                                ? `(Parent: ${selectedThirdLevelCategory.name})`
                                : ''}
                            </Label>
                            <Controller
                              name="fourthLevelCategoryId"
                              control={control}
                              render={({ field }) => (
                                <Popover
                                  open={fourthLevelCategoryOpen}
                                  onOpenChange={setFourthLevelCategoryOpen}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={fourthLevelCategoryOpen}
                                      className="w-full justify-between font-normal"
                                    >
                                      {field.value
                                        ? sortedFourthLevelCategories.find(
                                            (fc: Category) => fc.id === field.value
                                          )?.name
                                        : 'Select product name'}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-100 p-0">
                                    <Command
                                      filter={(value, search) => {
                                        const itemName = value.toLowerCase();
                                        const searchTerm = search.toLowerCase();
                                        if (
                                          itemName === searchTerm ||
                                          itemName.startsWith(searchTerm)
                                        )
                                          return 1;
                                        if (itemName.includes(searchTerm)) return 0.5;
                                        return 0;
                                      }}
                                    >
                                      <CommandInput placeholder="Search product names..." />
                                      <CommandEmpty>No options found.</CommandEmpty>
                                      <CommandGroup className="max-h-64 overflow-auto">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {sortedFourthLevelCategories.map((fc: any) => (
                                          <CommandItem
                                            key={fc.id}
                                            value={fc.name}
                                            onSelect={() => {
                                              field.onChange(fc.id);
                                              setFourthLevelCategoryOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                field.value === fc.id ? 'opacity-100' : 'opacity-0'
                                              }`}
                                            />
                                            {fc.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}
                            />
                          </div>
                        );
                      })()}

                    {/* Brand */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brandId">
                          Brand{' '}
                          {isGrocery && (
                            <span className="text-muted-foreground">(Optional for groceries)</span>
                          )}
                        </Label>
                        <Controller
                          name="brandId"
                          control={control}
                          render={({ field }) => (
                            <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={brandOpen}
                                  className="w-full justify-between font-normal"
                                  disabled={!watchCategoryId}
                                >
                                  {field.value
                                    ? filteredBrands.find((b) => b.id === field.value)?.name
                                    : watchCategoryId
                                      ? 'Select brand'
                                      : 'Select category first'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-100 p-0">
                                <Command
                                  filter={(value, search) => {
                                    const itemName = value.toLowerCase();
                                    const searchTerm = search.toLowerCase();
                                    if (itemName === searchTerm || itemName.startsWith(searchTerm))
                                      return 1;
                                    if (itemName.includes(searchTerm)) return 0.5;
                                    return 0;
                                  }}
                                >
                                  <CommandInput placeholder="Search brands..." />
                                  <CommandEmpty>No brand found.</CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-auto">
                                    {/* No Brand / Generic Option */}
                                    <CommandItem
                                      value="no-brand-generic"
                                      onSelect={() => {
                                        field.onChange(undefined);
                                        setBrandOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          !field.value ? 'opacity-100' : 'opacity-0'
                                        }`}
                                      />
                                      <span className="text-muted-foreground">
                                        No Brand / Generic
                                      </span>
                                    </CommandItem>

                                    {/* Brand List */}
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {filteredBrands.map((brand: any) => (
                                      <CommandItem
                                        key={brand.id}
                                        value={brand.name}
                                        onSelect={() => {
                                          field.onChange(brand.id);
                                          setBrandOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            field.value === brand.id ? 'opacity-100' : 'opacity-0'
                                          }`}
                                        />
                                        {brand.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>

                                  {/* Create New Brand Button */}
                                  <div className="border-t p-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBrandOpen(false);
                                        setShowBrandDialog(true);
                                      }}
                                      className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-blue-600 dark:text-blue-400"
                                    >
                                      <span className="text-lg">+</span> Create New Brand
                                    </button>
                                  </div>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                        {!watchCategoryId ? (
                          <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                            Please select a category first
                          </p>
                        ) : filteredBrands.length === 0 && !showAllBrands ? (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-amber-600 hover:underline dark:text-amber-500">
                              No brands found - click for options
                            </summary>
                            <ul className="text-muted-foreground/80 mt-2 ml-2 list-inside list-disc space-y-1">
                              <li>Proceed without a brand (select "No Brand / Generic" above)</li>
                              <li>
                                <button
                                  type="button"
                                  onClick={() => setShowBrandDialog(true)}
                                  className="text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  Create a new brand
                                </button>{' '}
                                if yours doesn't exist
                              </li>
                              <li>
                                <button
                                  type="button"
                                  onClick={() => setShowAllBrands(true)}
                                  className="text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  Show all brands
                                </button>{' '}
                                if your brand exists but isn't listed
                              </li>
                            </ul>
                          </details>
                        ) : showAllBrands ? (
                          <div className="text-xs">
                            <p className="text-blue-600/80 dark:text-blue-400/80">
                              Showing all {brandList.length} brands
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowAllBrands(false)}
                              className="text-muted-foreground hover:text-foreground text-sm hover:underline"
                            >
                              Show only relevant brands
                            </button>
                          </div>
                        ) : (
                          <p className="text-muted-foreground/60 text-xs">
                            {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} ·
                            <button
                              type="button"
                              onClick={() => setShowAllBrands(true)}
                              className="ml-1 text-blue-600/70 hover:text-blue-600 hover:underline dark:text-blue-400/70 dark:hover:text-blue-400"
                            >
                              show all {brandList.length}
                            </button>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Display Product Name */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="name">Display Product Name *</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p className="mb-1 font-medium">Format Guide:</p>
                              <p className="text-xs opacity-90">{productNameHelperText}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input id="name" {...register('name')} placeholder={productNamePlaceholder} />
                      {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    {/* SKU */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="sku">SKU (Stock Keeping Unit) *</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>Unique internal code for inventory tracking</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="sku"
                          {...register('sku')}
                          placeholder="e.g., MOB-SAM-S24U-881911"
                        />
                        <Button type="button" variant="outline" onClick={handleGenerateSKU}>
                          Generate
                        </Button>
                      </div>
                      <p className="text-muted-foreground/70 text-xs">
                        Click "Generate" to auto-create from category and brand
                      </p>
                      {errors.sku && <p className="text-sm text-red-500">{errors.sku.message}</p>}
                    </div>

                    {/* Short Description */}
                    <div className="space-y-2">
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Input
                        id="shortDescription"
                        {...register('shortDescription')}
                        placeholder="Brief product summary (max 500 chars)"
                        maxLength={500}
                      />
                    </div>

                    {/* Full Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Full Description *</Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Detailed product description..."
                        className="min-h-30"
                      />
                      <p className="text-muted-foreground text-xs">
                        Detailed information shown on the product page. Include features,
                        specifications, and benefits.
                      </p>
                      {errors.description && (
                        <p className="text-sm text-red-500">{errors.description.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Category Specific Details</CardTitle>
                    <CardDescription>
                      {activeCategory
                        ? `Attributes for ${activeCategory.name}`
                        : 'Please select a category first'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Dynamic Attributes */}
                    {(() => {
                      const categoryKey = activeCategory
                        ? getCategoryKey(activeCategory.name)
                        : 'OTHER';
                      const attributes = CATEGORY_ATTRIBUTES[categoryKey] || [];

                      if (attributes.length === 0) {
                        return (
                          <div className="text-muted-foreground py-8 text-center">
                            <p>No specific attributes required for this category.</p>
                            <p className="mt-1 text-sm">You can proceed to the next tab.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          {attributes.map((attr) => (
                            <div key={attr.name} className="space-y-2">
                              <Label htmlFor={`attr-${attr.name}`}>
                                {attr.label}
                                {attr.required && <span className="ml-1 text-red-500">*</span>}
                              </Label>

                              {attr.type === 'select' && attr.options ? (
                                <Controller
                                  name={`attributes.${attr.name}`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger id={`attr-${attr.name}`}>
                                        <SelectValue placeholder={`Select ${attr.label}`} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {attr.options?.map((opt) => (
                                          <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              ) : attr.type === 'checkbox' ? (
                                <div className="flex h-10 items-center space-x-2">
                                  <Controller
                                    name={`attributes.${attr.name}`}
                                    control={control}
                                    render={({ field }) => (
                                      <Checkbox
                                        id={`attr-${attr.name}`}
                                        checked={field.value === true || field.value === 'Yes'}
                                        onCheckedChange={(checked) =>
                                          field.onChange(checked ? 'Yes' : 'No')
                                        }
                                      />
                                    )}
                                  />
                                  <label
                                    htmlFor={`attr-${attr.name}`}
                                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Yes, this is {attr.label.toLowerCase()}
                                  </label>
                                </div>
                              ) : attr.type === 'date' ? (
                                <Input
                                  id={`attr-${attr.name}`}
                                  type="date"
                                  {...register(`attributes.${attr.name}`)}
                                />
                              ) : (
                                <Input
                                  id={`attr-${attr.name}`}
                                  placeholder={attr.placeholder}
                                  {...register(`attributes.${attr.name}`)}
                                />
                              )}

                              {attr.helperText && (
                                <p className="text-muted-foreground text-xs">{attr.helperText}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing & Tax Tab */}
              <TabsContent value="pricing" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing & Tax</CardTitle>
                    <CardDescription>Set product pricing and tax configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* MRP & Selling Price */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mrp">MRP (₹) *</Label>
                        <Input
                          id="mrp"
                          type="number"
                          step="0.01"
                          {...register('mrp', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                        <p className="text-muted-foreground text-xs">
                          Maximum Retail Price (printed price)
                        </p>
                        {errors.mrp && <p className="text-sm text-red-500">{errors.mrp.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sellingPrice">Selling Price (₹) *</Label>
                        <Input
                          id="sellingPrice"
                          type="number"
                          step="0.01"
                          {...register('sellingPrice', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                        <p className="text-muted-foreground text-xs">
                          Actual price customers pay (should be ≤ MRP)
                        </p>
                        {errors.sellingPrice && (
                          <p className="text-sm text-red-500">{errors.sellingPrice.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Discount */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discountType">Discount Type</Label>
                        <Controller
                          name="discountType"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NONE">No Discount</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                <SelectItem value="FLAT">Flat Amount (₹)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discountValue">Discount Value</Label>
                        <Input
                          id="discountValue"
                          type="number"
                          step="0.01"
                          {...register('discountValue', { valueAsNumber: true })}
                          placeholder="0"
                          disabled={watchDiscountType === 'NONE'}
                        />
                      </div>
                    </div>

                    {/* Tax Configuration - moved before price breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="taxType">Tax Type</Label>
                        <Controller
                          name="taxType"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GST">GST</SelectItem>
                                <SelectItem value="VAT">VAT</SelectItem>
                                <SelectItem value="NONE">No Tax</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                        <Input
                          id="taxPercentage"
                          type="number"
                          step="0.01"
                          {...register('taxPercentage', { valueAsNumber: true })}
                          placeholder="18"
                        />
                      </div>
                    </div>

                    {/* Enhanced Price Breakdown Calculator - now at the bottom */}
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 p-5 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
                      <div className="mb-3 flex items-center gap-2">
                        <Calculator className="text-primary h-5 w-5" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Price Breakdown
                        </span>
                      </div>

                      {/* MRP */}
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>MRP</span>
                        <span className="font-medium">₹{priceBreakdown.mrp.toFixed(2)}</span>
                      </div>

                      {/* Discount (if any) */}
                      {priceBreakdown.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                          <span className="flex items-center gap-1">
                            <TrendingDown className="h-3.5 w-3.5" />
                            Discount (
                            {watchDiscountType === 'PERCENTAGE'
                              ? `${watchDiscountValue}%`
                              : `₹${watchDiscountValue}`}
                            )
                          </span>
                          <span className="font-medium">
                            - ₹{priceBreakdown.discountAmount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Base Price */}
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
                        <span>Base Price</span>
                        <span className="font-medium">
                          ₹{priceBreakdown.discountedPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* GST */}
                      {priceBreakdown.taxRate > 0 && (
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3.5 w-3.5" />
                            GST ({priceBreakdown.taxRate}%)
                          </span>
                          <span className="font-medium">
                            + ₹{priceBreakdown.gstAmount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Final Price with GST */}
                      <div className="border-primary/30 flex items-center justify-between border-t-2 pt-3">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          Final Price (incl. GST)
                        </span>
                        <span className="text-primary text-2xl font-bold">
                          ₹{priceBreakdown.finalPriceWithGST.toFixed(2)}
                        </span>
                      </div>

                      {/* Savings Badge */}
                      {priceBreakdown.savings > 0 && priceBreakdown.mrp > 0 && (
                        <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                              🎉 Customer Savings
                            </span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{priceBreakdown.savings.toFixed(2)} (
                              {priceBreakdown.discountPercentFromMRP.toFixed(0)}% off)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Commission & Net Earnings Breakdown */}
                      <div className="mt-4 border-t border-dashed border-slate-300 pt-4 dark:border-slate-600">
                        <h4 className="text-muted-foreground mb-3 text-xs font-semibold uppercase">
                          Seller Earnings Breakdown
                        </h4>

                        {/* Platform Fee */}
                        <div className="mb-2 flex justify-between text-sm text-slate-600 dark:text-slate-400">
                          <span>Platform Commission (5%)</span>
                          <span className="font-medium text-red-500">
                            - ₹{(priceBreakdown.discountedPrice * 0.05).toFixed(2)}
                          </span>
                        </div>

                        {/* GST on Commission */}
                        <div className="mb-2 flex justify-between text-sm text-slate-600 dark:text-slate-400">
                          <span>GST on Commission (18%)</span>
                          <span className="font-medium text-red-500">
                            - ₹{(priceBreakdown.discountedPrice * 0.05 * 0.18).toFixed(2)}
                          </span>
                        </div>

                        {/* Net Earnings */}
                        <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Net Settlement Amount
                          </span>
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                            ₹
                            {(
                              priceBreakdown.discountedPrice -
                              priceBreakdown.discountedPrice * 0.05 -
                              priceBreakdown.discountedPrice * 0.05 * 0.18
                            ).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-right text-[10px]">
                          * Approx. calculation. Actuals may vary based on exact category fees.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Management</CardTitle>
                    <CardDescription>Manage stock and availability</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stock Quantity & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          {...register('stockQuantity', { valueAsNumber: true })}
                          placeholder="0"
                        />
                        {errors.stockQuantity && (
                          <p className="text-sm text-red-500">{errors.stockQuantity.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stockStatus">Stock Status</Label>
                        <Controller
                          name="stockStatus"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IN_STOCK">In Stock</SelectItem>
                                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                                <SelectItem value="PRE_ORDER">Pre-Order</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Order Limits */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minOrderQuantity">Min Order Qty</Label>
                        <Input
                          id="minOrderQuantity"
                          type="number"
                          {...register('minOrderQuantity', { valueAsNumber: true })}
                          placeholder="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxOrderQuantity">Max Order Qty</Label>
                        <Input
                          id="maxOrderQuantity"
                          type="number"
                          {...register('maxOrderQuantity', { valueAsNumber: true })}
                          placeholder="999"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                        <Input
                          id="lowStockThreshold"
                          type="number"
                          {...register('lowStockThreshold', { valueAsNumber: true })}
                          placeholder="5"
                        />
                      </div>
                    </div>

                    {/* Warehouse */}
                    <div className="space-y-2">
                      <Label htmlFor="warehouse">Warehouse / Location</Label>
                      <Input
                        id="warehouse"
                        {...register('warehouse')}
                        placeholder="e.g., Warehouse A, Mumbai"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping & Logistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Weight */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('weight', {
                            setValueAs: (value) => parseOptionalNumber(value),
                          })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weightUnit">Unit</Label>
                        <Controller
                          name="weightUnit"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="KG">Kilograms (kg)</SelectItem>
                                <SelectItem value="G">Grams (g)</SelectItem>
                                <SelectItem value="LB">Pounds (lb)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="length">Length</Label>
                        <Input
                          id="length"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('length', {
                            setValueAs: (value) => parseOptionalNumber(value),
                          })}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="width">Width</Label>
                        <Input
                          id="width"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('width', {
                            setValueAs: (value) => parseOptionalNumber(value),
                          })}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="height">Height</Label>
                        <Input
                          id="height"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('height', {
                            setValueAs: (value) => parseOptionalNumber(value),
                          })}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dimensionUnit">Unit</Label>
                        <Controller
                          name="dimensionUnit"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CM">CM</SelectItem>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="IN">IN</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Shipping Charges */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shippingCharges">Shipping Charges (₹)</Label>
                        <Input
                          id="shippingCharges"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('shippingCharges', {
                            setValueAs: (value) => parseNumberWithDefault(value, 0),
                          })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deliveryTime">Delivery Time (days)</Label>
                        <Input
                          id="deliveryTime"
                          type="number"
                          min="1"
                          {...register('deliveryTime', {
                            setValueAs: (value) => parseNumberWithDefault(value, 7),
                          })}
                          placeholder="7"
                        />
                      </div>
                    </div>

                    {/* Free Shipping */}
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="freeShipping"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="freeShipping"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="freeShipping">Offer Free Shipping</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="mt-4 space-y-4">
                {/* SEO */}
                <Card>
                  <CardHeader>
                    <CardTitle>Product Visibility & Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Product Status</Label>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="PUBLISHED">Published</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-4 pt-8">
                        <div className="flex items-center space-x-2">
                          <Controller
                            name="featured"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="featured"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                          <Label htmlFor="featured">Featured Product</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Controller
                            name="newArrival"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="newArrival"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                          <Label htmlFor="newArrival">New Arrival</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance & Legal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hsnCode">HSN / SAC Code</Label>
                        <Input id="hsnCode" {...register('hsnCode')} placeholder="e.g., 8517" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fssaiNumber">FSSAI License (Optional)</Label>
                        <Input
                          id="fssaiNumber"
                          {...register('fssaiNumber')}
                          placeholder="For food products"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="countryOfOrigin">Country of Origin</Label>
                      <Input
                        id="countryOfOrigin"
                        {...register('countryOfOrigin')}
                        placeholder="India"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer Details</Label>
                      <Input
                        id="manufacturer"
                        {...register('manufacturer')}
                        placeholder="Manufacturer name and address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="warrantyPeriod">Warranty Period</Label>
                        <Input
                          id="warrantyPeriod"
                          type="number"
                          min="0"
                          {...register('warrantyPeriod', {
                            setValueAs: (value) => parseOptionalNumber(value),
                          })}
                          placeholder="12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="warrantyUnit">Warranty Unit</Label>
                        <Controller
                          name="warrantyUnit"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DAYS">Days</SelectItem>
                                <SelectItem value="MONTHS">Months</SelectItem>
                                <SelectItem value="YEARS">Years</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="returnPolicy">Return Policy</Label>
                      <Textarea
                        id="returnPolicy"
                        {...register('returnPolicy')}
                        placeholder="Describe the return policy for this product"
                        className="min-h-20"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-8">
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                  {/* Left Column: Small Previews */}
                  <div className="space-y-6 lg:col-span-1">
                    {/* 1. Search Result Card Preview */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Search Result View</h3>
                      <Card className="group border-border hover:border-primary bg-card overflow-hidden border transition-all duration-300 hover:shadow-xl">
                        <CardContent className="flex flex-col items-start p-4">
                          {/* Image */}
                          <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-800">
                            {imageFiles[0] ? (
                              <Image
                                src={URL.createObjectURL(imageFiles[0])}
                                alt="Product"
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-gray-300" />
                              </div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {watch('featured') && (
                                <span className="rounded bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                  FEATURED
                                </span>
                              )}
                              {watch('newArrival') && (
                                <span className="rounded bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="w-full">
                            <h3 className="group-hover:text-primary mb-1 line-clamp-2 text-lg leading-tight font-bold transition">
                              {watchName || 'Product Title'}
                            </h3>
                            <p className="text-muted-foreground mb-2 line-clamp-2 h-10 text-sm">
                              {watchDescription || 'Product description will appear here...'}
                            </p>

                            <div className="mb-3 flex items-center gap-2">
                              <span className="text-primary text-xl font-bold">
                                ₹
                                {calculateFinalPrice(
                                  watchSellingPrice,
                                  watchDiscountType,
                                  watchDiscountValue
                                ).toFixed(2)}
                              </span>
                              {watchDiscountType !== 'NONE' && (
                                <span className="text-muted-foreground text-sm line-through">
                                  ₹{watchSellingPrice.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <Button className="w-full gap-2" variant="secondary">
                              Add to Cart
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 2. Google Search Preview (Moved to Column 1) */}
                    {/* 2. Google Search Preview & SEO (Merged) */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Google Search Preview & SEO</h3>
                      <Card className="border-dashed bg-gray-50 dark:bg-zinc-900/50">
                        <CardContent className="space-y-6 p-4">
                          {/* Visual Preview */}
                          <div className="w-full rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-950">
                            <div className="mb-1.5 flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800">
                                {imageFiles[0] ? (
                                  <Image
                                    src={URL.createObjectURL(imageFiles[0])}
                                    width={24}
                                    height={24}
                                    alt="icon"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs leading-tight font-medium text-gray-900 dark:text-gray-100">
                                  Your Store Name
                                </span>
                                <span className="max-w-50 truncate text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                                  yourstore.com {' > '} products {' > '}{' '}
                                  {watch('slug') || 'product-slug'}
                                </span>
                              </div>
                            </div>
                            <h3 className="cursor-pointer truncate text-base leading-snug font-normal text-[#1a0dab] hover:underline dark:text-[#8ab4f8]">
                              {watch('seoTitle') || watchName || 'Product Title'}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#4d5156] dark:text-[#bdc1c6]">
                              {watch('seoDescription') ||
                                watchDescription ||
                                'Product description will appear here...'}
                            </p>
                          </div>

                          {/* Editable Inputs */}
                          <div className="space-y-4 border-t border-dashed border-gray-200 pt-4 dark:border-zinc-700">
                            <div className="space-y-2">
                              <Label htmlFor="seoTitle" className="text-xs font-semibold">
                                SEO Title
                              </Label>
                              <Input
                                id="seoTitle"
                                className="h-8 text-xs"
                                {...register('seoTitle')}
                                placeholder="Product title (max 60 chars)"
                                maxLength={60}
                              />
                              <div className="text-muted-foreground flex justify-between text-[10px]">
                                <span
                                  className={
                                    (watch('seoTitle')?.length || 0) > 60 ? 'text-red-500' : ''
                                  }
                                >
                                  {watch('seoTitle')?.length || 0}/60
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="slug" className="text-xs font-semibold">
                                URL Slug
                              </Label>
                              <Input
                                id="slug"
                                className="h-8 text-xs"
                                {...register('slug')}
                                placeholder="product-url-slug"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="seoDescription" className="text-xs font-semibold">
                                SEO Description
                              </Label>
                              <Textarea
                                id="seoDescription"
                                className="min-h-15 resize-none text-xs"
                                {...register('seoDescription')}
                                placeholder="Meta description (max 160 chars)"
                                maxLength={160}
                              />
                              <div className="text-muted-foreground flex justify-between text-[10px]">
                                <span
                                  className={
                                    (watch('seoDescription')?.length || 0) > 160
                                      ? 'text-red-500'
                                      : ''
                                  }
                                >
                                  {watch('seoDescription')?.length || 0}/160
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Right Column: Store Page Preview (Span 2) */}
                  {/* Right Column: Store Page Preview (Span 2) */}
                  <div className="space-y-4 lg:col-span-2">
                    <h3 className="text-lg font-medium">Store Page View (Customer)</h3>
                    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                      {/* 1. Mock Header / Breadcrumbs */}
                      <div className="text-muted-foreground flex items-center gap-2 border-b border-gray-100 bg-gray-50/50 px-6 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/20">
                        <span>Home</span>
                        <span className="text-gray-300">/</span>
                        <span>
                          {categoryList.find((c) => c.id === watchCategoryId)?.name || 'Category'}
                        </span>
                        <span className="text-gray-300">/</span>
                        <span className="text-foreground max-w-50 truncate font-medium">
                          {watchName || 'Product Title'}
                        </span>
                      </div>

                      <div className="grid flex-1 grid-cols-1 gap-8 p-6 md:grid-cols-12 md:gap-12 md:p-8">
                        {/* Left: Images (Span 5) */}
                        <div className="flex flex-col gap-4 md:col-span-5">
                          <div className="group relative flex aspect-4/5 cursor-crosshair items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-zinc-800">
                            <div className="hover:text-primary absolute top-3 right-3 z-10 cursor-pointer rounded-full bg-white/90 p-2 text-gray-600 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
                              <Share2 className="h-4 w-4" />
                            </div>
                            {imageFiles[0] ? (
                              <Image
                                src={URL.createObjectURL(imageFiles[0])}
                                alt="Product Main"
                                fill
                                className="object-contain p-2"
                              />
                            ) : (
                              <ImageIcon className="h-16 w-16 text-gray-200" />
                            )}
                          </div>
                          {/* Thumbnail Strip */}
                          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`hover:border-primary flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-md border bg-gray-50 md:h-16 md:w-16 dark:bg-zinc-900 ${i === 1 ? 'border-primary ring-primary/20 ring-1' : 'border-transparent'}`}
                              >
                                {imageFiles[0] ? (
                                  <div className="relative h-full w-full overflow-hidden rounded-sm">
                                    <Image
                                      src={URL.createObjectURL(imageFiles[0])}
                                      fill
                                      alt="thumb"
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-gray-300" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Details (Span 7) */}
                        <div className="space-y-6 md:col-span-7">
                          {/* Header Info */}
                          <div className="space-y-1">
                            <h1 className="text-2xl leading-tight font-bold text-gray-900 md:text-3xl dark:text-gray-50">
                              {watchName || 'Product Title'}
                            </h1>
                            <div className="text-sm">
                              <span className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-blue-400">
                                Visit the Brand Store
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-4">
                              <div className="flex items-center gap-0.5">
                                <span className="mr-1 text-sm font-bold text-gray-900 dark:text-white">
                                  4.5
                                </span>
                                {[1, 2, 3, 4].map((s) => (
                                  <Star key={s} className="h-4 w-4 fill-amber-500 text-amber-500" />
                                ))}
                                <Star className="h-4 w-4 fill-amber-500/30 text-amber-500" />
                              </div>
                              <span className="cursor-pointer text-sm text-blue-600 hover:underline dark:text-blue-400">
                                1,234 ratings
                              </span>
                            </div>
                          </div>

                          <div className="h-px bg-gray-100 dark:bg-zinc-800" />

                          {/* Price Block */}
                          <div className="space-y-3">
                            {watchDiscountType !== 'NONE' && (
                              <div className="inline-flex items-center gap-2">
                                <span className="rounded-sm bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                                  {watchDiscountType === 'PERCENTAGE'
                                    ? `${watchDiscountValue}% OFF`
                                    : 'DEAL'}
                                </span>
                                <span className="text-xs font-bold tracking-wide text-red-600 uppercase">
                                  Limited time deal
                                </span>
                              </div>
                            )}

                            <div className="flex items-baseline gap-2">
                              <span className="relative -top-1.5 text-lg">₹</span>
                              <span className="text-4xl font-medium text-gray-900 dark:text-white">
                                {Math.floor(
                                  calculateFinalPrice(
                                    watchSellingPrice,
                                    watchDiscountType,
                                    watchDiscountValue
                                  )
                                )}
                              </span>
                              <span className="relative -top-1.5 text-lg">
                                {(
                                  calculateFinalPrice(
                                    watchSellingPrice,
                                    watchDiscountType,
                                    watchDiscountValue
                                  ) % 1
                                )
                                  .toFixed(2)
                                  .substring(1)}
                              </span>
                            </div>

                            {watchDiscountType !== 'NONE' && (
                              <div className="text-muted-foreground text-sm">
                                M.R.P.:{' '}
                                <span className="line-through">
                                  ₹{watchSellingPrice.toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Inclusive of all taxes
                            </div>
                          </div>

                          {/* Mock Offers */}
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm">
                              <Tag className="mt-0.5 h-4 w-4 text-orange-600" />
                              <div>
                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                  Bank Offer
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  5% Unlimited Cashback on Axis Bank Credit Card
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delivery & Stock */}
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                              <Truck className="text-muted-foreground h-4 w-4" />
                              <span>
                                FREE delivery <span className="font-bold">Monday, 24 July</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                              <MapPin className="text-muted-foreground h-4 w-4" />
                              <span className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400">
                                Delivering to Mumbai 400001
                              </span>
                            </div>
                            <div className="pt-2 text-lg font-medium text-green-600 dark:text-green-500">
                              In stock
                            </div>
                            <div className="text-muted-foreground text-sm">
                              Sold by{' '}
                              <span className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400">
                                YourStore
                              </span>{' '}
                              and Fulfilled by eShop.
                            </div>
                          </div>

                          {/* Actions/Buy Box Actions */}
                          <div className="flex gap-4 pt-4">
                            <div className="w-20">
                              <Select defaultValue="1">
                                <SelectTrigger className="h-10 rounded-full border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-900">
                                  <SelectValue placeholder="Qty" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Qty: 1</SelectItem>
                                  <SelectItem value="2">Qty: 2</SelectItem>
                                  <SelectItem value="3">Qty: 3</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button className="h-10 flex-1 rounded-full border border-[#FCD200] bg-[#FFD814] font-normal text-black shadow-sm hover:bg-[#F7CA00]">
                              Add to Cart
                            </Button>
                            <Button className="h-10 flex-1 rounded-full border border-[#FF8F00] bg-[#FFA41C] font-normal text-black shadow-sm hover:bg-[#FA8900]">
                              Buy Now
                            </Button>
                          </div>

                          <div className="text-muted-foreground flex items-center gap-2 pt-2 text-xs">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Secure transaction</span>
                          </div>
                        </div>
                      </div>

                      {/* Product Description Section */}
                      <div className="space-y-6 border-t border-gray-100 bg-gray-50/30 p-6 md:p-8 dark:border-zinc-800 dark:bg-zinc-900/10">
                        <div>
                          <h3 className="mb-2 text-lg font-bold text-orange-700 dark:text-orange-500">
                            Product Description
                          </h3>
                          <p className="max-w-4xl text-sm leading-relaxed text-gray-700 md:text-base dark:text-gray-300">
                            {watchDescription || 'No description provided.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-8 pt-4 md:grid-cols-2">
                          <div>
                            <h4 className="mb-3 text-sm font-bold">Specifications</h4>
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 border-b border-gray-100 py-1 dark:border-zinc-800">
                                <span className="text-muted-foreground">Category</span>
                                <span>
                                  {categoryList.find((c) => c.id === watchCategoryId)?.name || '-'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 border-b border-gray-100 py-1 dark:border-zinc-800">
                                <span className="text-muted-foreground">Model Number</span>
                                <span>XYZ-123-ABC</span>
                              </div>
                              <div className="grid grid-cols-2 border-b border-gray-100 py-1 dark:border-zinc-800">
                                <span className="text-muted-foreground">Origin</span>
                                <span>India</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-3 text-sm font-bold">Warranty & Support</h4>
                            <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                              <RotateCcw className="mt-0.5 h-5 w-5 text-gray-400" />
                              <div>
                                <span className="text-sm font-medium">1 Year Warranty</span>
                                <p className="text-muted-foreground mt-1 text-xs">
                                  Use the <span className="text-blue-600">contact seller</span> link
                                  for any issues.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SEO Settings (Full Width Bottom) */}
              </TabsContent>
            </Tabs>

            {/* Form Actions */}
            <div className="mt-6 flex justify-between pb-20">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleClearForm}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear Form
                </Button>
              </div>
              <div className="flex gap-2">
                {activeTab !== 'preview' ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => setValue('status', 'DRAFT')}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      onClick={() => setValue('status', 'PUBLISHED')}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Product'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Brand Creation Dialog */}
      <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request New Brand</DialogTitle>
            <DialogDescription>
              Submit a brand creation request for admin approval. Once approved, this brand will
              appear in the dropdown list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="newBrandName">Brand Name *</Label>
              <Input
                id="newBrandName"
                placeholder="e.g., Patanjali, Organic India, 24 Mantra"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Purpose/Reason */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="brandPurpose">Purpose / Reason *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>
                        Explain why you need this brand. Helps admin review your request faster.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="brandPurpose"
                placeholder="e.g., We sell authentic Patanjali products and need this brand for our grocery items..."
                value={brandPurpose}
                onChange={(e) => setBrandPurpose(e.target.value)}
                className="min-h-20"
                maxLength={500}
              />
              <p className="text-muted-foreground/60 text-xs">
                {brandPurpose.length}/500 characters
              </p>
            </div>

            {/* Document/Logo Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="brandDocument">Supporting Document (Optional)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Upload brand logo, certificate, or authorization document (Max 5MB)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="brandDocument"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('File size must be less than 5MB');
                      e.target.value = '';
                      return;
                    }
                    setBrandDocument(file);
                  }
                }}
                className="cursor-pointer"
              />
              {brandDocument && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <span>✓</span>
                  <span>
                    {brandDocument.name} ({(brandDocument.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setBrandDocument(null)}
                    className="ml-2 text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Category Context */}
            <div className="space-y-2 rounded-md border border-blue-200/50 bg-blue-50/50 p-3 dark:border-blue-800/50 dark:bg-blue-950/50">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                📂 Category Context
              </p>
              <div className="space-y-1 text-sm text-blue-800/80 dark:text-blue-200/80">
                <div className="flex justify-between">
                  <span className="text-muted-foreground/70">Category:</span>
                  <strong>
                    {categoryList.find((c) => c.id === watchCategoryId)?.name || 'Not selected'}
                  </strong>
                </div>
                {watchSubCategoryId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/70">Sub-Category:</span>
                    <strong>
                      {categoryList
                        .find((c) => c.id === watchCategoryId)
                        ?.children?.find((sc: Category) => sc.id === watchSubCategoryId)?.name ||
                        'Not selected'}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-md border border-amber-200/50 bg-amber-50/50 p-2.5 dark:border-amber-800/50 dark:bg-amber-950/50">
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                <strong>Note:</strong> Request reviewed by admin. Use "No Brand / Generic"
                meanwhile.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBrandDialog(false);
                setNewBrandName('');
                setBrandPurpose('');
                setBrandDocument(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                // Validation
                if (!newBrandName.trim()) {
                  toast.error('Brand name is required');
                  return;
                }
                if (!brandPurpose.trim()) {
                  toast.error('Please explain why you need this brand');
                  return;
                }
                if (!watchCategoryId) {
                  toast.error('Please select a category first');
                  return;
                }

                // Prepare request data
                const brandRequest = {
                  name: newBrandName.trim(),
                  purpose: brandPurpose.trim(),
                  categoryId: watchCategoryId,
                  subCategoryId: watchSubCategoryId,
                  categoryName: categoryList.find((c) => c.id === watchCategoryId)?.name,
                  subCategoryName: watchSubCategoryId
                    ? categoryList
                        .find((c) => c.id === watchCategoryId)
                        ?.children?.find((sc: Category) => sc.id === watchSubCategoryId)?.name
                    : null,
                  sellerId: user?.id,
                  document: brandDocument,
                };

                // TODO: Submit to backend API
                // const formData = new FormData();
                // formData.append('name', brandRequest.name);
                // formData.append('purpose', brandRequest.purpose);
                // formData.append('categoryId', brandRequest.categoryId.toString());
                // if (brandDocument) formData.append('document', brandDocument);
                // await fetch('/api/v1/brands/request', { method: 'POST', body: formData });

                console.log('Brand Request:', brandRequest);

                toast.success('Brand request submitted successfully!', {
                  description: `"${newBrandName}" is pending admin approval. Use "No Brand / Generic" for now.`,
                  duration: 5000,
                });

                setShowBrandDialog(false);
                setNewBrandName('');
                setBrandPurpose('');
                setBrandDocument(null);
              }}
              disabled={!newBrandName.trim() || !brandPurpose.trim()}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
