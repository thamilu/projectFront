import { APP_ROUTES } from '@/constants/routes/app-routes';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | E-Shop',
  description: 'Read the E-Shop Terms of Service.',
};

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing or using E-Shop ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.',
    },
    {
      title: '2. User Accounts',
      content: 'You must create an account to access certain features. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.',
    },
    {
      title: '3. Purchases & Payments',
      content: 'All purchases are subject to product availability and price confirmation. Payment must be completed at the time of order. We reserve the right to cancel orders in cases of pricing errors or fraud suspicion.',
    },
    {
      title: '4. Seller Responsibilities',
      content: 'Sellers must provide accurate product descriptions, ensure product quality, and fulfill orders in a timely manner. Misleading listings, counterfeit goods, or illegal items are strictly prohibited.',
    },
    {
      title: '5. Prohibited Conduct',
      content: 'You agree not to: use the platform for illegal purposes, upload malicious content, attempt to gain unauthorized access, scrape data without permission, or engage in fraudulent activity.',
    },
    {
      title: '6. Intellectual Property',
      content: 'All content on E-Shop including logos, text, images, and code is protected by copyright and other intellectual property laws. You may not reproduce or distribute any content without express written permission.',
    },
    {
      title: '7. Limitation of Liability',
      content: 'E-Shop is not liable for indirect, incidental, or consequential damages arising from use of the platform. Our total liability shall not exceed the amount you paid for the order giving rise to the claim.',
    },
    {
      title: '8. Dispute Resolution',
      content: 'Disputes will be resolved through binding arbitration in Mumbai, India, in accordance with the Arbitration and Conciliation Act, 1996. By using our platform you waive the right to a jury trial.',
    },
    {
      title: '9. Changes to Terms',
      content: 'We may update these terms at any time. Continued use of the platform after changes constitutes acceptance. We will notify users of material changes via email or platform notification.',
    },
    {
      title: '10. Contact',
      content: 'For questions about these Terms, please contact us at legal@eshop.com or visit our Contact page.',
    },
  ];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
      <p className="mb-8 text-sm text-muted-foreground">Last updated: February 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <p className="text-muted-foreground leading-relaxed">
          Welcome to E-Shop. Please read these Terms of Service carefully before using our platform. These terms govern your use of our services.
        </p>

        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold mb-2">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.content}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border p-5 text-sm text-muted-foreground">
        <p>
          By using E-Shop, you acknowledge that you have read and understood these Terms of Service. For our data practices, see our{' '}
          <Link href={APP_ROUTES.PRIVACY} className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
