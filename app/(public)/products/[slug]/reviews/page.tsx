import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveProductBySlug } from '@/domains/catalog/infrastructure/api/resolve-product';
import ProductReviewsClient from './product-reviews-client';

interface ReviewsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ReviewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProductBySlug(slug);
  if (!product) {
    return { title: 'Product Not Found' };
  }
  return {
    // Layout template supplies the site suffix.
    title: `Reviews for ${product.name}`,
    description: `Customer reviews and ratings for ${product.name}.`,
  };
}

export default async function ProductReviewsPage({ params }: ReviewsPageProps) {
  const { slug } = await params;
  const product = await resolveProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductReviewsClient product={product} />;
}
