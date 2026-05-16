import { Metadata } from 'next';
import { ProductDTO, PaginatedResponse, ApiResponse } from '@/types';
import ProductsListClient from './products-list-client';
import SafeJsonLd from '@/components/Seo/SafeJsonLd';

export const metadata: Metadata = {
  title: 'Products | E-Commerce Platform',
  description: 'Browse our wide selection of products. Find the best deals on quality items from top brands.',
  keywords: ['products', 'shop', 'buy online', 'e-commerce'],
  openGraph: {
    title: 'Products | E-Commerce Platform',
    description: 'Browse our wide selection of products',
    type: 'website',
  },
};

// Enable dynamic rendering with caching
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

interface ProductsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const page = parseInt(searchParams.page || '0');
  const _categoryId = searchParams.categoryId ? parseInt(searchParams.categoryId) : undefined;
  const _brandId = searchParams.brandId ? parseInt(searchParams.brandId) : undefined;
  const _minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined;
  const _maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined;

  // Server-side fetch with Next.js route-level caching (revalidate)
  const fetchOpts = { next: { revalidate: 60 } };

  const productsResp = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?page=${page}&size=12&sort=${encodeURIComponent(
      searchParams.sort || 'createdAt,desc'
    )}${searchParams.search ? `&keyword=${encodeURIComponent(searchParams.search)}` : ''}`,
    fetchOpts
  )
    .then(res => res.json())
    .catch(() => ({ data: { content: [], totalElements: 0, totalPages: 0, size: 12, number: 0, first: true, last: true } } as ApiResponse<PaginatedResponse<ProductDTO>>));

  const categoriesResp = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`,
    fetchOpts
  ).then(res => res.json()).catch(() => ({ data: [] } as ApiResponse<unknown[]>));

  const brandsResp = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/brands`,
    fetchOpts
  ).then(res => res.json()).catch(() => ({ data: [] } as ApiResponse<unknown[]>));

  const productsData = (productsResp as ApiResponse<PaginatedResponse<ProductDTO>>).data!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = (categoriesResp as ApiResponse<unknown[]>).data || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brands: any[] = (brandsResp as ApiResponse<unknown[]>).data || [];

  // Generate JSON-LD for product listing
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Products',
    description: 'Browse our wide selection of products',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/products`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: productsData.totalElements,
      itemListElement: productsData.content.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
            '@type': 'Product',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name: (product as any).name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${(product as any).urlSlug || (product as any).id}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            image: ((product as any).images?.[0]?.url) || (product as any).imageUrl || null,
            offers: {
              '@type': 'Offer',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              price: (product as any).discountPrice || (product as any).price,
              priceCurrency: 'INR',
            },
          },
      })),
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <SafeJsonLd data={jsonLd} />

      {/* Client Component with filters and interactivity */}
      <ProductsListClient
        initialProducts={productsData}
        categories={categories || []}
        brands={brands || []}
        searchParams={searchParams}
      />
    </>
  );
}
