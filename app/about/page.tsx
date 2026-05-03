import Link from 'next/link';
import { ShoppingBag, Truck, Shield, Users, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export const metadata = {
  title: 'About Us | E-Shop',
  description: 'Learn about E-Shop – India\'s trusted online marketplace.',
};

const STATS = [
  { value: '50K+', label: 'Happy Customers' },
  { value: '10K+', label: 'Sellers' },
  { value: '1M+', label: 'Products' },
  { value: '500+', label: 'Cities Delivered' },
];

const VALUES = [
  { icon: Shield, title: 'Trust & Safety', desc: 'Every transaction is secured with industry-standard encryption and buyer protection.' },
  { icon: Truck, title: 'Fast Delivery', desc: 'We partner with reliable logistics to ensure your orders arrive on time.' },
  { icon: Star, title: 'Quality Assurance', desc: 'Sellers are verified and products are reviewed to maintain high standards.' },
  { icon: Users, title: 'Community', desc: 'A thriving marketplace where buyers, sellers, and delivery partners grow together.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-24 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <ShoppingBag className="h-9 w-9" />
          </div>
          <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">About E-Shop</h1>
          <p className="mx-auto max-w-2xl text-lg text-blue-100">
            India&apos;s fastest-growing online marketplace connecting millions of shoppers with passionate sellers and reliable delivery partners.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-extrabold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We exist to democratize commerce. Whether you&apos;re a buyer looking for the best deals, a seller wanting to grow your business, or a delivery partner seeking flexible income — E-Shop is built for you.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">Our Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">Ready to join us?</h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href={APP_ROUTES.PRODUCTS}>Start Shopping <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={APP_ROUTES.BECOME_SELLER}>Become a Seller</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
