import Image from 'next/image';
import Link from 'next/link';
import { Store as StoreIcon, Mail, MapPin, Phone, Star, ArrowLeft } from 'lucide-react';

import type { StoreDTO } from '@/shared/types';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';
import { Button } from '@/shared/ui/atoms/button';
import { Badge } from '@/shared/ui/atoms/badge';
import {
  getStoreAvatarColor,
  getStoreDisplayName,
  getStoreInitials,
} from '@/shared/store/store-helpers';

interface PublicStoreProfileProps {
  store: StoreDTO;
}

function formatDate(value?: string) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(value));
  } catch {
    return null;
  }
}

export function PublicStoreProfile({ store }: PublicStoreProfileProps) {
  const name = getStoreDisplayName({
    storeName: store.storeName,
    name: store.storeName,
    shopName: store.storeName,
  });
  const initials = getStoreInitials(name);
  const avatarColor = getStoreAvatarColor(store.id);
  const createdAt = formatDate(store.createdAt);

  return (
    <div className="container mx-auto px-4 py-10 lg:px-8">
      <div className="mb-6">
        <Link
          href={APP_ROUTES.STORES.LIST}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to stores
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-10">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white/10 text-4xl font-bold text-white uppercase shadow-lg">
            {store.logoUrl ? (
              <Image
                src={store.logoUrl}
                alt={`${name} logo`}
                width={128}
                height={128}
                className="h-32 w-32 rounded-2xl object-cover"
              />
            ) : (
              <span
                style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}88)` }}
                className="flex h-full w-full items-center justify-center rounded-2xl"
              >
                {initials || name[0]}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-white/10 text-white shadow">
                <StoreIcon className="mr-1 h-3.5 w-3.5" /> Verified Seller
              </Badge>
              {store.rating && store.rating > 0 && (
                <Badge variant="outline" className="border-white/40 text-white">
                  <Star className="mr-1 h-3.5 w-3.5" /> {store.rating.toFixed(1)} rating
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{name}</h1>
            <p className="max-w-3xl text-base text-white/80">
              {store.description || 'This seller has not added a description yet.'}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              {store.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {store.city}
                </span>
              )}
              {createdAt && <span>Seller since {createdAt}</span>}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {store.email && (
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="bg-white text-slate-900 hover:bg-slate-100"
                >
                  <a href={`mailto:${store.email}`}>
                    <Mail className="mr-2 h-4 w-4" /> Contact via email
                  </a>
                </Button>
              )}
              {store.phone && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  <a href={`tel:${store.phone}`}>
                    <Phone className="mr-2 h-4 w-4" /> Call support
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="bg-card/60 rounded-2xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <p className="text-muted-foreground text-sm">
            Reach out directly to this seller for bulk orders or support.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" /> {store.email || 'Not provided'}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="text-muted-foreground h-4 w-4" /> {store.phone || 'Not provided'}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <span>{store.address || 'No address on file'}</span>
            </li>
          </ul>
        </div>

        <div className="bg-card/60 rounded-2xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Store Snapshot</h2>
          <p className="text-muted-foreground text-sm">Key details shoppers may want to know.</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Store ID</dt>
              <dd className="font-medium">#{store.id}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{store.active ? 'Open' : 'Temporarily closed'}</dd>
            </div>
            {store.rating && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Customer rating</dt>
                <dd className="flex items-center gap-1 font-medium">
                  <Star className="h-4 w-4 text-yellow-500" /> {store.rating.toFixed(1)} / 5
                </dd>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="font-medium">{createdAt}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    </div>
  );
}
