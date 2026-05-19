'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Store, TrendingUp, Shield, Headphones, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Grow your business',
    desc: 'Reach millions of shoppers across India with zero setup fees for the first 30 days.',
  },
  {
    icon: Shield,
    title: 'Secure payments',
    desc: 'Payments are protected and transferred directly to your bank account within 7 days.',
  },
  {
    icon: Headphones,
    title: '24/7 seller support',
    desc: 'Our dedicated seller support team is available around the clock to help you succeed.',
  },
  {
    icon: Store,
    title: 'Your own storefront',
    desc: 'Customise your store page, showcase your brand, and manage everything in one place.',
  },
];

export default function BecomeSellerPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/25">
          <Store className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Start selling on{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            E-Shop
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
          Join over 10,000 sellers already growing their businesses on India&apos;s trusted marketplace.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {session ? (
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10">
              <Link href={APP_ROUTES.SELLER.REGISTER}>
                Register as a seller <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10">
                <Link href={APP_ROUTES.AUTH_LOGIN}>
                  Sign in to get started <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={APP_ROUTES.AUTH_REGISTER}>Create an account</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 pb-24">
        <h2 className="mb-10 text-center text-2xl font-bold">Why sell with us?</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-0 shadow-md hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900">
                  <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">Ready to start?</h2>
        <p className="mb-6 text-muted-foreground">It only takes a few minutes to set up your store.</p>
        <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link href={session ? APP_ROUTES.SELLER.REGISTER : APP_ROUTES.AUTH_LOGIN}>
            Get started for free
          </Link>
        </Button>
      </section>
    </div>
  );
}
