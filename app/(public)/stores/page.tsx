import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

import { publicStoreApi } from '@/domains/seller/infrastructure/api/public-store-api';
import type { StoreDTO } from '@/shared/types';
import { APP_ROUTES } from '@/shared/routes';
import {
  getStoreDisplayName,
  getStoreInitials,
  getStoreAvatarColor,
} from '@/shared/store/store-helpers';
import { siteConfig } from '@/core/config/site';
import { logger } from '@/core/telemetry/logger';

export const metadata: Metadata = {
  // Title only — the surrounding layout's `title.template` appends the
  // site/section suffix. Hardcoding it here produced a doubled tab title
  // ("Products | eShop | eShop") and a doubled og:title.
  title: 'Stores',
  description:
    'Browse trusted sellers on our marketplace and shop directly from their storefronts.',
};

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
  // Distinguish "fetch succeeded, zero stores" from "fetch failed" — these
  // must never render the same UI, or a real outage looks identical to an
  // empty marketplace with no way for the user (or telemetry) to tell.
  let stores: StoreDTO[] = [];
  let loadFailed = false;

  try {
    const response = await publicStoreApi.list(0, 24);
    stores = response.content;
  } catch (error) {
    logger.error('[StoresPage] Failed to load stores', {
      component: 'app/(public)/stores',
      error: error instanceof Error ? error.message : String(error),
    });
    loadFailed = true;
  }

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

      {loadFailed ? (
        <div
          className="border-destructive/20 bg-destructive/5 mx-auto max-w-md rounded-3xl border p-10 text-center shadow-sm"
          role="alert"
        >
          <AlertCircle className="text-destructive mx-auto mb-4 h-10 w-10" aria-hidden="true" />
          <p className="text-foreground text-lg font-semibold">Couldn&apos;t load stores</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Something went wrong on our end. Please try again in a moment.
          </p>
          <a
            href={APP_ROUTES.STORES.LIST}
            className="text-primary mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
          >
            Reload page
          </a>
        </div>
      ) : stores.length === 0 ? (
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
