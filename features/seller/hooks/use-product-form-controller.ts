'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useCategories,
  useBrands,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
} from '@/features/products/hooks/use-products';
import { productApi } from '@/domains/catalog/infrastructure/api/catalog-api';
import { productImagesApi } from '@/domains/catalog/infrastructure/api/product-images-api';
import { getRequestLogger } from '@/core/telemetry/logger';
import { APP_ROUTES } from '@/shared/routes';
import {
  productFormSchema,
  type ProductFormData,
  calculateFinalPrice,
} from '@/domains/catalog/contracts/product-form.schema';
import { mapFormToBackendRequest } from '@/features/products/mappers/backend-mapper';
import { PRODUCT_FORM_CONSTANTS } from '@/features/products/constants';
import type { Category, Brand } from '@/shared/types/product';
import { useProductDraftPersistence } from './use-product-draft-persistence';
import { useProductDuplicateCheck } from './use-product-duplicate-check';

export function useProductFormController(mode: 'create' | 'edit', productId?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  // Queries
  const {
    data: product,
    isLoading: loadingProduct,
    error: productQueryError,
    refetch: refetchProduct,
  } = useProduct(mode === 'edit' && productId ? productId : '');
  const categories = useCategories();
  const brands = useBrands();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const { data: categoryTree } = useQuery({
    queryKey: ['categoryTree'],
    queryFn: () => productApi.getCategoryTree(),
    staleTime: PRODUCT_FORM_CONSTANTS.STALE_TIME_MS,
  });

  // State Management
  const [activeTab, setActiveTab] = useState('basic');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    Array<{ id: number; url: string; isPrimary: boolean }>
  >([]);
  const [allowCustomCreation, setAllowCustomCreation] = useState(false);

  // Form initialization
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      categoryId: undefined,
      sellingPrice: 0,
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

  const { reset, watch, setError } = form;
  const watchAllFields = watch();
  const watchName = watch('name');
  const watchCategoryId = watch('categoryId');

  // Integrations: Draft Persistence (Only for Create Mode)
  const { isRestored, clearDraft } = useProductDraftPersistence(reset, watchAllFields);

  // Integrations: Duplicate Checker (Debounced, Only for Create Mode)
  const duplicateCheck = useProductDuplicateCheck(
    watchName,
    mode === 'create' && isRestored && !allowCustomCreation
  );

  // Parse category & brand lists safely
  const allCategories = useMemo((): Category[] => {
    const raw = categories.data;
    return Array.isArray(raw) ? (raw as Category[]) : [];
  }, [categories.data]);

  const categoryList = useMemo((): Category[] => {
    let list: Category[] = [];
    if (Array.isArray(categoryTree) && categoryTree.length > 0) {
      list = categoryTree as Category[];
    } else {
      list = allCategories.filter((cat) => !cat.parentCategory);
    }
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [categoryTree, allCategories]);

  const brandList = useMemo((): Brand[] => {
    const raw = brands.data;
    return Array.isArray(raw)
      ? [...(raw as Brand[])].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      : [];
  }, [brands.data]);

  // Load product details on mount (Edit Mode)
  useEffect(() => {
    if (mode !== 'edit' || !product) return;

    const p = product;

    // Deduce discount fields
    let discType: 'NONE' | 'FLAT' | 'PERCENTAGE' = 'NONE';
    let discVal = 0;
    const sellPrice = p.price ?? 0;
    const discPrice = p.discountPrice ?? 0;
    const origPrice = p.originalPrice ?? p.msrp ?? sellPrice;

    if (discPrice > 0 && discPrice < sellPrice) {
      discType = 'FLAT';
      discVal = sellPrice - discPrice;
    }

    // Deduce categories from hierarchy
    let catId = p.categoryId ?? p.category?.id;
    let subCatId: number | undefined = undefined;
    let thirdCatId: number | undefined = undefined;
    let fourthCatId: number | undefined = undefined;

    const hierarchy: number[] = [];
    let currentCat: typeof p.category | undefined = p.category;
    while (currentCat) {
      hierarchy.unshift(currentCat.id);
      currentCat = currentCat.parentCategory;
    }

    if (hierarchy.length > 0) catId = hierarchy[0];
    if (hierarchy.length > 1) subCatId = hierarchy[1];
    if (hierarchy.length > 2) thirdCatId = hierarchy[2];
    if (hierarchy.length > 3) fourthCatId = hierarchy[3];

    reset({
      name: p.name ?? '',
      sku: p.sku ?? '',
      categoryId: catId ?? 0,
      subCategoryId: subCatId,
      thirdLevelCategoryId: thirdCatId,
      fourthLevelCategoryId: fourthCatId,
      brandId: p.brandId ?? p.brand?.id ?? undefined,
      shortDescription: p.shortDescription ?? '',
      description: p.description ?? '',
      sellingPrice: sellPrice,
      mrp: origPrice,
      discountType: discType,
      discountValue: discVal,
      taxType: 'GST',
      taxPercentage: p.pricing?.taxRate ?? PRODUCT_FORM_CONSTANTS.DEFAULT_TAX_PERCENTAGE,
      stockQuantity: p.stockQuantity ?? 0,
      stockStatus: (p.stockQuantity ?? 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      minOrderQuantity: p.minOrderQuantity ?? 1,
      maxOrderQuantity: p.maxOrderQuantity ?? 999,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      weight: p.weight ? Number(p.weight) : undefined,
      weightUnit:
        p.weightUnit === 'G' || p.weightUnit === 'LB' || p.weightUnit === 'KG'
          ? p.weightUnit
          : 'KG',
      length: p.length ? Number(p.length) : undefined,
      width: p.width ? Number(p.width) : undefined,
      height: p.height ? Number(p.height) : undefined,
      dimensionUnit:
        p.dimensionUnit === 'M' || p.dimensionUnit === 'IN' || p.dimensionUnit === 'CM'
          ? p.dimensionUnit
          : 'CM',
      shippingCharges: p.shippingCharges ?? 0,
      freeShipping: p.freeShipping ?? false,
      deliveryTime: p.deliveryTime ?? 7,
      seoTitle: p.metaTitle ?? '',
      seoDescription: p.metaDescription ?? '',
      seoKeywords: p.tags ? p.tags.map((t) => t.name) : [],
      slug: p.friendlyUrl ?? '',
      status: p.active ? 'PUBLISHED' : 'INACTIVE',
      featured: p.featured ?? false,
      newArrival: p.newArrival ?? false,
      hsnCode: p.hsCode ?? '',
      countryOfOrigin: p.countryOfOrigin ?? 'India',
      attributes: p.attributes ?? p.categoryAttributes ?? {},
    });

    if (p.images) {
      setExistingImages(p.images);
    }
  }, [mode, product, reset]);

  // Brand list mapping based on selected Category (UX Helper)
  const filteredBrands = useMemo((): Brand[] => {
    if (!watchCategoryId) return brandList;

    const category = categoryList.find((c) => c.id === watchCategoryId);
    const categoryName = category?.name?.toLowerCase() || '';

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

    let allowedBrands: string[] = [];
    if (
      categoryName.includes('grocery') ||
      categoryName.includes('essential') ||
      categoryName.includes('food')
    ) {
      allowedBrands = groceryBrands;
    } else if (
      categoryName.includes('electronic') ||
      categoryName.includes('mobile') ||
      categoryName.includes('laptop')
    ) {
      allowedBrands = electronicsBrands;
    } else if (
      categoryName.includes('fashion') ||
      categoryName.includes('clothing') ||
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
      return brandList;
    }

    const filtered = brandList.filter((b) =>
      allowedBrands.some((allowed) => b.name.toLowerCase().includes(allowed.toLowerCase()))
    );

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [watchCategoryId, brandList, categoryList]);

  // Handle image deletions safely
  const deleteExistingImage = useCallback(async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      await productImagesApi.delete(String(imageId));
      setExistingImages((imgs) => imgs.filter((img) => img.id !== imageId));
      toast.success('Image deleted successfully');
    } catch {
      toast.error('Failed to delete image');
    }
  }, []);

  // Form submission handler
  const onSubmit = useCallback(
    async (data: ProductFormData) => {
      const correlationId = crypto.randomUUID();
      const requestLogger = getRequestLogger(correlationId, {
        feature: mode === 'create' ? 'seller-product-create' : 'seller-product-update',
      });

      requestLogger.info('Product submit started', {
        mode,
        categoryId: data.categoryId,
        imageCount: imageFiles.length,
      });

      try {
        // Regression: this previously fell back to the literal `1` when
        // storeId/shopId were absent — and since NEITHER field exists
        // anywhere on the real session/auth user type (there is no seller
        // store id on the NextAuth session), this fallback fired on every
        // single product creation, silently attributing every new product
        // to store #1 regardless of which seller created it. The backend
        // mapper (mapFormToBackendRequest) already omits `storeId` from the
        // payload entirely when this is undefined (see backend-mapper.ts's
        // `if (shopId !== undefined)` guard) — the backend must derive the
        // owning store from the authenticated session server-side, the same
        // way it already does for every other seller-scoped write. A
        // client-supplied store id should never be trusted for this even if
        // one were available, since nothing stops a malicious client from
        // attributing a product to a different seller's store.
        const resolvedShopId = (user as { storeId?: number; shopId?: number } | null)?.storeId ??
          (user as { storeId?: number; shopId?: number } | null)?.shopId ??
          undefined;

        if (mode === 'create') {
          const backendRequest: any = {
            ...mapFormToBackendRequest(
              data,
              categoryList.find((c) => c.id === data.categoryId),
              categoryList
                .find((c) => c.id === data.categoryId)
                ?.children?.find((sc: any) => sc.id === data.subCategoryId),
              categoryList
                .find((c) => c.id === data.categoryId)
                ?.children?.find((sc: any) => sc.id === data.subCategoryId)
                ?.children?.find((tc: any) => tc.id === data.thirdLevelCategoryId),
              categoryList
                .find((c) => c.id === data.categoryId)
                ?.children?.find((sc: any) => sc.id === data.subCategoryId)
                ?.children?.find((tc: any) => tc.id === data.thirdLevelCategoryId)
                ?.children?.find((fc: any) => fc.id === data.fourthLevelCategoryId),
              brandList.find((b) => b.id === data.brandId)?.name,
              resolvedShopId
            ),
          };

          const response = await createMutation.mutateAsync({
            payload: backendRequest,
            correlationId,
          });

          const newProduct = response as any;
          const newProductId = newProduct?.id || newProduct?.data?.id;

          let failedImageCount = 0;
          if (newProductId && imageFiles.length > 0) {
            toast.info(`Uploading ${imageFiles.length} product images...`);
            for (let i = 0; i < imageFiles.length; i++) {
              try {
                await productImagesApi.upload(String(newProductId), imageFiles[i], '', i === 0);
              } catch (err) {
                failedImageCount += 1;
                requestLogger.error('Failed to upload product image', {
                  imageIndex: i,
                  error: err,
                });
              }
            }
          }

          clearDraft();
          // Regression: this used to unconditionally show "Product created
          // successfully!" even when every image upload above failed —
          // the product listing goes live with no photos and the seller
          // gets zero indication anything went wrong.
          if (failedImageCount > 0) {
            toast.warning(
              `Product created, but ${failedImageCount} of ${imageFiles.length} image${imageFiles.length === 1 ? '' : 's'} failed to upload. You can add them from the product's edit page.`
            );
          } else {
            toast.success('Product created successfully!');
          }
        } else {
          // Edit submission
          const subCategoryObj = categoryList
            .find((c) => c.id === data.categoryId)
            ?.children?.find((sc: any) => sc.id === data.subCategoryId);
          const backendPayload = {
            name: data.name.trim(),
            description: data.description.trim(),
            sku: (data.sku || '').trim().toUpperCase(),
            price: data.sellingPrice,
            discountPrice:
              data.discountType !== 'NONE'
                ? Number(
                    calculateFinalPrice(
                      data.sellingPrice,
                      data.discountType,
                      data.discountValue
                    ).toFixed(2)
                  )
                : undefined,
            originalPrice: data.mrp,
            stockQuantity: data.stockQuantity,
            minOrderQuantity: data.minOrderQuantity,
            maxOrderQuantity: data.maxOrderQuantity,
            lowStockThreshold: data.lowStockThreshold,
            categoryId:
              data.fourthLevelCategoryId ||
              data.thirdLevelCategoryId ||
              data.subCategoryId ||
              data.categoryId,
            brandId: data.brandId || null,
            featured: data.featured,
            active: data.status === 'PUBLISHED',
            friendlyUrl: data.slug || undefined,
            metaTitle: data.seoTitle || undefined,
            metaDescription: data.seoDescription || undefined,
            tags: data.seoKeywords || [],
            weight: data.weight || undefined,
            dimensions:
              data.length && data.width && data.height
                ? `${data.length}x${data.width}x${data.height} ${data.dimensionUnit}`
                : undefined,
            shortDescription: data.shortDescription || undefined,
            subCategory: subCategoryObj?.name || undefined,
            attributes: data.attributes || {},
          };

          await updateMutation.mutateAsync({
            id: Number(productId),
            payload: backendPayload,
          });

          let failedEditImageCount = 0;
          if (imageFiles.length > 0) {
            toast.info(`Uploading ${imageFiles.length} new product images...`);
            for (let i = 0; i < imageFiles.length; i++) {
              try {
                await productImagesApi.upload(
                  String(productId),
                  imageFiles[i],
                  '',
                  existingImages.length === 0 && i === 0
                );
              } catch (err) {
                failedEditImageCount += 1;
                requestLogger.error('Failed to upload product image', {
                  imageIndex: i,
                  error: err,
                });
              }
            }
          }

          if (failedEditImageCount > 0) {
            toast.warning(
              `Product updated, but ${failedEditImageCount} of ${imageFiles.length} new image${imageFiles.length === 1 ? '' : 's'} failed to upload.`
            );
          } else {
            toast.success('Product updated successfully!');
          }
        }

        queryClient.invalidateQueries({ queryKey: ['products'] });
        router.push(APP_ROUTES.SELLER.PRODUCTS);
      } catch (error: any) {
        const backendErrors = error?.response?.data?.errors;
        if (backendErrors && typeof backendErrors === 'object') {
          Object.entries(backendErrors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages;
            setError(field as any, {
              type: 'server',
              message: message as string,
            });
          });
          toast.error('Validation failure on backend.');
        } else {
          toast.error(error.message || 'Failed to submit form.');
        }
      }
    },
    [
      mode,
      productId,
      user,
      imageFiles,
      existingImages,
      categoryList,
      brandList,
      clearDraft,
      createMutation,
      updateMutation,
      queryClient,
      router,
      setError,
    ]
  );

  // Tab navigation error handler
  const handleInvalidSubmit = useCallback(
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
        shortDescription: 'basic',
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

  const isLoading = authLoading || loadingProduct || categories.isLoading || brands.isLoading;
  const isError = !!productQueryError || categories.isError || brands.isError;
  const error = productQueryError || categories.error || brands.error || null;

  // Timeout state for loading
  const [isTimeout, setIsTimeout] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsTimeout(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsTimeout(true);
    }, 15000); // 15 seconds timeout
    return () => clearTimeout(timer);
  }, [isLoading]);

  const refetch = useCallback(() => {
    if (mode === 'edit' && productId) {
      refetchProduct();
    }
    categories.refetch();
    brands.refetch();
  }, [mode, productId, refetchProduct, categories, brands]);

  return {
    mode,
    form,
    activeTab,
    setActiveTab,
    isLoading: isLoading && !isTimeout,
    isError: isError || isTimeout,
    error: isTimeout ? new Error('LOADING_TIMEOUT') : error,
    refetch,
    product,
    productQueryError,
    catalog: {
      categoryList,
      brandList,
      filteredBrands,
    },
    media: {
      imageFiles,
      setImageFiles,
      existingImages,
      deleteExistingImage,
    },
    duplicateCheck,
    allowCustomCreation,
    setAllowCustomCreation,
    submit: {
      onSubmit,
      handleInvalidSubmit,
      isSubmitting: form.formState.isSubmitting,
    },
  };
}
