import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { apiClient } from '@/lib/http/services';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { PageResponse, StoreDTO } from '@/types';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import {
  getStoreDisplayName,
  getStoreInitials,
  getStoreAvatarColor,
} from '@/lib/store/store-helpers';
import { siteConfig } from '@/lib/config/site';
import { AppError } from '@/lib/errors/AppError';

export const metadata: Metadata = {
  title: `Stores | ${siteConfig.name}`,
  description:
    'Browse trusted sellers on our marketplace and shop directly from their storefronts.',
};

interface StoresApiResponse extends ApiResponse<PageResponse<StoreDTO>> {}

async function loadStores(): Promise<StoreDTO[]> {
  try {
    const { data: response } = await apiClient.get<StoresApiResponse>(
      `${API_ENDPOINTS.STORES.LIST}?page=0&size=24`
    );
    return response?.data?.content ?? [];
  } catch (error) {
    const err = error as AppError;
    if (err?.status === 404) {
      return [];
    }
    throw error;
  }
}

function StoreGridCard({ store }: { store: StoreDTO }) {
  const name = getStoreDisplayName(store);
  const initials = getStoreInitials(name);
  const avatarColor = getStoreAvatarColor(store.id);

  return (
    <li className="group bg-card flex flex-col rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={APP_ROUTES.STORES.DETAIL(store.id)} className="flex flex-1 flex-col">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-100 text-lg font-bold text-slate-700">
            {store.logoUrl ? (
              <Image
                src={store.logoUrl}
                alt={`${name} logo`}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)` }}
              >
                {initials || name[0]}
              </span>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-semibold">Seller</p>
            <h2 className="text-foreground text-xl font-bold tracking-tight">{name}</h2>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 line-clamp-3 flex-1 text-sm">
          {store.description || 'No description provided.'}
        </p>
        <div className="text-muted-foreground mt-4 flex flex-wrap gap-4 text-xs">
          <span>{store.city || store.country || 'Location not specified'}</span>
          <span>Active: {store.active ? 'Yes' : 'Temporarily closed'}</span>
        </div>
      </Link>
    </li>
  );
}

export default async function StoresPage() {
  const stores = await loadStores();

  return (
    <div className="container mx-auto px-4 py-10 lg:px-8">
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <h1 className="text-foreground text-3xl font-black tracking-tight md:text-4xl">
          Explore Seller Stores
        </h1>
        <p className="text-muted-foreground mt-3 text-base">
          Discover verified sellers on {siteConfig.name}, browse their storefronts, and shop
          directly from the brands you love.
        </p>
      </header>

      {stores.length === 0 ? (
        <div className="bg-card/60 rounded-3xl border p-10 text-center shadow-sm">
          <p className="text-foreground text-lg font-semibold">No stores available yet</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Sellers are onboarding right now. Check back soon or{' '}
            <Link
              href={APP_ROUTES.SELLER.REGISTER}
              className="text-primary underline underline-offset-4"
            >
              open your own store
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreGridCard key={store.id} store={store} />
          ))}
        </ul>
      )}
    </div>
  );
}
