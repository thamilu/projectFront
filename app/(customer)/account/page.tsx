'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { User, MapPin, CreditCard, Star, Shield, ChevronRight, Package } from 'lucide-react';
import { APP_ROUTES } from '@/shared/routes';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/atoms/avatar';

const NAV_ITEMS = [
  {
    href: APP_ROUTES.ACCOUNT.PROFILE,
    icon: User,
    label: 'Profile',
    desc: 'Name, email, phone, avatar',
  },
  {
    href: APP_ROUTES.ACCOUNT.ADDRESSES,
    icon: MapPin,
    label: 'Addresses',
    desc: 'Saved delivery addresses',
  },
  {
    href: APP_ROUTES.ACCOUNT.PAYMENT_METHODS,
    icon: CreditCard,
    label: 'Payment Methods',
    desc: 'Cards, UPI & wallets',
  },
  { href: APP_ROUTES.ORDERS, icon: Package, label: 'My Orders', desc: 'Track & manage orders' },
  {
    href: APP_ROUTES.ACCOUNT.REVIEWS,
    icon: Star,
    label: 'My Reviews',
    desc: 'Reviews you have written',
  },
  {
    href: APP_ROUTES.ACCOUNT.SECURITY,
    icon: Shield,
    label: 'Security',
    desc: 'Password & active sessions',
  },
];

export default function AccountPage() {
  const { data: session } = useSession();
  const name = session?.user?.name || 'My Account';
  const email = session?.user?.email || '';
  const image = session?.user?.image || '';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* Profile Summary */}
      <div className="bg-card mb-8 flex items-center gap-5 rounded-2xl border p-6 shadow-sm">
        <Avatar className="h-16 w-16 text-xl">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">{name}</h1>
          <p className="text-muted-foreground text-sm">{email}</p>
          <Link
            href={APP_ROUTES.ACCOUNT.PROFILE}
            className="inline-text text-primary mt-1 text-xs hover:underline"
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
            className="bg-card hover:border-primary flex items-center gap-4 rounded-xl border p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Icon className="text-primary h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{label}</p>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
          </Link>
        ))}
      </div>
    </div>
  );
}
