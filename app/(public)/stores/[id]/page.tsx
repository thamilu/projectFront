import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import type { StoreDTO } from '@/shared/types';
import type { ApiResponse } from '@/shared/types/api';
import { PublicStoreProfile } from '@/features/seller/components/PublicStoreProfile';
import { siteConfig } from '@/core/config/site';

interface StorePageProps {
  params: Promise<{ id: string }>;
}

async function loadStore(id: string): Promise<StoreDTO | null> {
  try {
    const { data: response } = await apiClient.get<ApiResponse<StoreDTO>>(
      API_ENDPOINTS.STORES.DETAIL(id)
    );
    return response?.data ?? null;
  } catch (error) {
    const err = error as { statusCode?: number };
    if (err?.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const store = await loadStore(id);
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
  const { id } = await params;
  const store = await loadStore(id);
  if (!store) {
    notFound();
  }
  return <PublicStoreProfile store={store} />;
}
