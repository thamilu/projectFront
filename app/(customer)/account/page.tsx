'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  User, MapPin, CreditCard, ShoppingBag, Star, Shield,
  ChevronRight, Package
} from 'lucide-react';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';

const NAV_ITEMS = [
  { href: APP_ROUTES.ACCOUNT.PROFILE, icon: User, label: 'Profile', desc: 'Name, email, phone, avatar' },
  { href: APP_ROUTES.ACCOUNT.ADDRESSES, icon: MapPin, label: 'Addresses', desc: 'Saved delivery addresses' },
  { href: APP_ROUTES.ACCOUNT.PAYMENT_METHODS, icon: CreditCard, label: 'Payment Methods', desc: 'Cards, UPI & wallets' },
  { href: APP_ROUTES.ORDERS, icon: Package, label: 'My Orders', desc: 'Track & manage orders' },
  { href: APP_ROUTES.ACCOUNT.REVIEWS, icon: Star, label: 'My Reviews', desc: 'Reviews you have written' },
  { href: APP_ROUTES.ACCOUNT.SECURITY, icon: Shield, label: 'Security', desc: 'Password & active sessions' },
];

export default function AccountPage() {
  const { data: session } = useSession();
  const name = session?.user?.name || 'My Account';
  const email = session?.user?.email || '';
  const image = session?.user?.image || '';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* Profile Summary */}
      <div className="mb-8 flex items-center gap-5 rounded-2xl border bg-card p-6 shadow-sm">
        <Avatar className="h-16 w-16 text-xl">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">{name}</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
          <Link
            href={APP_ROUTES.ACCOUNT.PROFILE}
            className="mt-1 inline-text text-xs text-primary hover:underline"
          >
            Edit profile →
          </Link>
        </div>
      </div>

      {/* Nav Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{label}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
