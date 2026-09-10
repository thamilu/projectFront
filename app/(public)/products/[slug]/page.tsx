import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productsApi } from '@/domains/catalog/infrastructure/api/catalog-api';
import { resolveProductBySlug } from '@/domains/catalog/infrastructure/api/resolve-product';
import ProductDetailClient from './product-detail-client';
import { ProductDTO } from '@/domains/catalog/contracts/catalog.types';
import { ShopDTO } from '@/domains/seller/contracts/seller.types';
import SafeJsonLd from '@/shared/ui/layout/Seo/SafeJsonLd';
import { logger } from '@/core/telemetry/logger';

// Enable ISR: Regenerate page every hour
export const revalidate = 3600;

// Generate static params for top products at build time
export async function generateStaticParams() {
  try {
    // Get top 100 featured products to pre-render
    const response = await productsApi.getAll({
      featured: true,
      page: 0,
      size: 100,
    });

    return response.content.map((product: ProductDTO) => ({
      slug: product.urlSlug || product.id.toString(),
    }));
  } catch (error) {
    logger.error('[generateStaticParams] Failed to pre-fetch featured products', {
      component: 'app/(public)/products/[slug]',
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Generate dynamic metadata for SEO
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const product = await resolveProductBySlug(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const images = product.images ?? [];

  return {
    // Product name only; the layout template supplies the site suffix.
    title: product.name,
    description: product.description?.substring(0, 160) || `Buy ${product.name} online`,
    keywords: [
      product.name,
      product.category?.name,
      product.brand?.name,
      ...(product.tags?.map((t) => t.name) || []),
    ].filter(Boolean) as string[],
    openGraph: {
      title: product.name,
      description: product.description || '',
      images: images.length
        ? images.map((img) => ({ url: img.url, height: 600, alt: product.name }))
        : product.imageUrl
          ? [{ url: product.imageUrl, width: 800, height: 600, alt: product.name }]
          : [],
      type: 'website',
      siteName: 'E-Commerce Platform',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || '',
      images: images[0]?.url
        ? [images[0].url]
        : product.imageUrl
          ? [product.imageUrl]
          : [],
    },
    alternates: {
      canonical: `/products/${params.slug}`,
    },
  };
}

// Server Component - fetch data and render
export default async function ProductDetailPage(props: Props) {
  const params = await props.params;
  const product = await resolveProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const images = product.images ?? [];

  // Generate JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images.length ? images.map((img) => img.url) : product.imageUrl ? [product.imageUrl] : [],
    sku: product.sku,
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand.name,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${params.slug}`,
      priceCurrency: 'INR',
      price: product.discountPrice || product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability:
        product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: product.shop
        ? {
            '@type': 'Organization',
            name: (product.shop as ShopDTO).shopName,
          }
        : undefined,
    },
    aggregateRating: product.averageRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.averageRating,
          reviewCount: product.reviewCount || 0,
        }
      : undefined,
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <SafeJsonLd data={jsonLd} />

      {/* Client Component with interactivity */}
      <ProductDetailClient product={product} />
    </>
  );
}
