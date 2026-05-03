import { MetadataRoute } from 'next';
import { productsApi } from '@/lib/api-client/products';
import { ProductDTO } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Fetch all products for sitemap (paginated)
    const productsPages: MetadataRoute.Sitemap = [];
    let page = 0;
    let hasMore = true;

    while (hasMore && page < 100) { // Limit to 100 pages for safety
      const response = await productsApi.getAll({
        page,
        size: 100,
        sort: 'updatedAt,desc',
      });

      response.content.forEach((product: ProductDTO) => {
        productsPages.push({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          url: `${BASE_URL}/products/${(product as any).urlSlug || product.id}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          changeFrequency: 'daily',
          priority: product.featured ? 0.8 : 0.7,
        });
      });

      hasMore = !response.last;
      page++;
    }

    return [...staticPages, ...productsPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if product fetch fails
    return staticPages;
  }
}

// Revalidate sitemap every hour
export const revalidate = 3600;
