import { HelpCircle, ShoppingBag, Package, CreditCard, RotateCcw, Truck, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

export const metadata = {
  title: 'Help & FAQ | E-Shop',
  description: 'Frequently asked questions and help articles for E-Shop shoppers.',
};

const FAQS = [
  {
    category: 'Orders & Shipping',
    icon: Truck,
    items: [
      { q: 'How long does delivery take?', a: 'Standard delivery takes 3–7 business days. Express delivery is available at checkout for next-day or same-day delivery in select cities.' },
      { q: 'How do I track my order?', a: 'Go to Orders in your account dashboard. Click on any order to see real-time tracking information.' },
      { q: 'Can I change or cancel my order?', a: 'Orders can be modified or cancelled within 30 minutes of placement. After that, please contact our support team.' },
    ],
  },
  {
    category: 'Returns & Refunds',
    icon: RotateCcw,
    items: [
      { q: 'What is your return policy?', a: 'We offer a 30-day return window for most items. Products must be in original condition with all tags and packaging intact.' },
      { q: 'How long do refunds take?', a: 'Refunds are processed within 5–7 business days after we receive the returned item. Your bank may take additional time to reflect the credit.' },
      { q: 'Are there items that cannot be returned?', a: 'Perishable goods, digital downloads, and items marked as non-returnable cannot be returned.' },
    ],
  },
  {
    category: 'Payments',
    icon: CreditCard,
    items: [
      { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, net banking, UPI (GPay, PhonePe, Paytm), and Cash on Delivery (COD).' },
      { q: 'Is my payment information secure?', a: 'Yes. We use SSL encryption and are PCI-DSS compliant. We never store your full card details.' },
      { q: 'Why was my payment declined?', a: 'Common reasons include insufficient funds, incorrect card details, or bank restrictions. Try a different payment method or contact your bank.' },
    ],
  },
  {
    category: 'Account & Shopping',
    icon: ShoppingBag,
    items: [
      { q: 'How do I create an account?', a: 'Click "Sign Up" and enter your email and password. You can also sign in using Keycloak SSO.' },
      { q: 'I forgot my password. What do I do?', a: 'Click "Forgot password?" on the sign-in page and enter your email. We\'ll send you a reset link.' },
      { q: 'How do I become a seller?', a: 'Visit our Become a Seller page and complete the registration form. After verification you\'ll gain access to the seller dashboard.' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900">
          <HelpCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold">Help Centre</h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Find answers to common questions, or{' '}
          <Link href={APP_ROUTES.CONTACT} className="text-primary hover:underline">
            contact our support team
          </Link>{' '}
          for personalised help.
        </p>
      </div>

      <div className="space-y-10 max-w-3xl mx-auto">
        {FAQS.map(({ category, icon: Icon, items }) => (
          <section key={category}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Icon className="h-5 w-5 text-primary" />
              {category}
            </h2>
            <div className="divide-y rounded-xl border">
              {items.map(({ q, a }) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                    {q}
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 rounded-2xl bg-muted/50 p-8 text-center max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-2">Still need help?</h2>
        <p className="text-muted-foreground mb-4">
          Our support team is available 24/7 to assist you.
        </p>
        <Link
          href={APP_ROUTES.CONTACT}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
