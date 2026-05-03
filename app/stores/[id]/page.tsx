import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { serverFetch } from '@/lib/server-api-client';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { StoreDTO } from '@/types';
import type { ApiResponse } from '@/types/api';
import { FetchError } from '@/lib/utils/fetch-utils';
import { PublicStoreProfile } from '@/components/store/PublicStoreProfile';
import { siteConfig } from '@/lib/config/site';

interface StorePageProps {
  params: { id: string };
}

async function loadStore(id: string): Promise<StoreDTO | null> {
  try {
    const response = await serverFetch<ApiResponse<StoreDTO>>(API_ENDPOINTS.STORES.DETAIL(id), {
      next: { revalidate: 60 },
    });
    return response?.data ?? null;
  } catch (error) {
    const err = error as FetchError;
    if (err?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const store = await loadStore(params.id);
  if (!store) {
    return { title: 'Store not found' };
  }

  const title = `${store.storeName} | ${siteConfig.name}`;
  const description =
    store.description?.slice(0, 150) || `${store.storeName} storefront on ${siteConfig.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function StoreProfilePage({ params }: StorePageProps) {
  const store = await loadStore(params.id);
  if (!store) {
    notFound();
  }
  return <PublicStoreProfile store={store} />;
}
