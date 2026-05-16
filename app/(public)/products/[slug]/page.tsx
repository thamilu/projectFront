import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productsApi } from '@/lib/http/services/products';
import ProductDetailClient from './product-detail-client';
import { ProductDTO, ShopDTO } from '@/types';
import SafeJsonLd from '@/components/Seo/SafeJsonLd';
// import { logger } from '@/lib/logger';

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
      slug: (product as ProductDTO & { urlSlug?: string }).urlSlug || product.id.toString(),
    }));
  } catch (_error) {
    // error logging removed (logger not defined)
    return [];
  }
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Generate dynamic metadata for SEO
export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const params = await props.params;
    // Fetch product data for metadata
    const product = await fetchProductBySlug(params.slug) as ProductDTO | null;

    if (!product) {
      return {
        title: 'Product Not Found',
      };
    }



    return {
      title: `${product.name} | E-Commerce Platform`,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        images: Array.isArray((product as any).images)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? ((product as any).images as { id?: number; url: string }[]).map((img) => ({
              url: img.url,
    // error logging removed (logger not defined)
              height: 600,
              alt: product.name,
            }))
          : (product.imageUrl ? [{ url: product.imageUrl, width: 800, height: 600, alt: product.name }] : []),
        type: 'website',
        siteName: 'E-Commerce Platform',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        images: Array.isArray((product as any).images) && ((product as any).images as { url: string }[])[0]?.url
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? [((product as any).images as { url: string }[])[0].url]
          : (product.imageUrl ? [product.imageUrl] : []),
      },
      alternates: {
        canonical: `/products/${params.slug}`,
      },
    };
  } catch (_error) {
    return {
      title: 'Product | E-Commerce Platform',
    };
  }
}

// Helper function to fetch product by slug or ID
async function fetchProductBySlug(slug: string) {
  try {
    // Try to fetch by URL slug first
    const product = await productsApi.getByUrl(slug);
    return product;
  } catch (_error) {
    // If not found by slug, try by ID
    const productId = parseInt(slug);
    if (!isNaN(productId)) {
      try {
        return await productsApi.getById(productId);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Server Component - fetch data and render
export default async function ProductDetailPage(props: Props) {
  const params = await props.params;
  const product = (await fetchProductBySlug(params.slug)) as ProductDTO | null;

  if (!product) {
    notFound();
  }

  // Generate JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image: Array.isArray((product as any).images)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ((product as any).images as { url: string }[]).map((img) => img.url)
      : (product.imageUrl ? [product.imageUrl] : []),
    sku: product.sku,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand.name,
    } : undefined,
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${params.slug}`,
      priceCurrency: 'INR',
      price: product.discountPrice || product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stockQuantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: product.shop ? {
        '@type': 'Organization',
        name: (product.shop as ShopDTO).shopName,
      } : undefined,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aggregateRating: (product as any).averageRating ? {
      '@type': 'AggregateRating',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ratingValue: (product as any).averageRating,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reviewCount: (product as any).reviewCount || 0,
    } : undefined,
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
