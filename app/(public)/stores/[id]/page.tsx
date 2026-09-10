import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { publicStoreApi } from '@/domains/seller/infrastructure/api/public-store-api';
import { PublicStoreProfile } from '@/features/seller/components/PublicStoreProfile';
import { siteConfig } from '@/core/config/site';

interface StorePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const store = await publicStoreApi.getById(id);
  if (!store) {
    return { title: 'Store not found' };
  }

  // Store name only — the root layout's `title.template` appends the site name.
  // Including it here rendered "Acme | eShop | eShop".
  const description =
    store.description?.slice(0, 150) || `${store.storeName} storefront on ${siteConfig.name}.`;

  return {
    title: store.storeName,
    description,
    /*
     * No `openGraph` block: it duplicated `title`/`description`, which Next
     * derives automatically, while replacing the inherited openGraph — and with
     * it the generated share image from app/opengraph-image.tsx. A storefront
     * link is among the most-shared URLs on the site, so a blank preview here
     * is the costliest place to have one.
     */
  };
}

export default async function StoreProfilePage({ params }: StorePageProps) {
  const { id } = await params;
  const store = await publicStoreApi.getById(id);
  if (!store) {
    notFound();
  }
  return <PublicStoreProfile store={store} />;
}
