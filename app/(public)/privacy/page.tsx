import Link from 'next/link';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

export const metadata = {
  title: 'Privacy Policy | E-Shop',
  description: 'Read the E-Shop Privacy Policy to understand how we collect and use your data.',
};

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information you provide directly (name, email, shipping address, payment details) and information collected automatically (device type, browser, IP address, browsing behaviour on our platform, and cookies).`,
    },
    {
      title: '2. How We Use Your Information',
      content: `We use your information to: process and fulfill orders; send order confirmations and shipping updates; personalise your shopping experience; improve our services; prevent fraud and ensure security; and comply with legal obligations.`,
    },
    {
      title: '3. Sharing Your Information',
      content: `We share data with: sellers (to fulfill your order); logistics partners (for delivery); payment processors (to process transactions); and analytics providers. We do not sell your personal data to third parties for marketing purposes.`,
    },
    {
      title: '4. Cookies & Tracking',
      content: `We use cookies and similar technologies for authentication, preferences, analytics, and advertising. You can control cookie preferences through your browser settings. Disabling certain cookies may affect platform functionality.`,
    },
    {
      title: '5. Data Retention',
      content: `We retain your personal data for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements. You may request deletion of your data by contacting us.`,
    },
    {
      title: '6. Your Rights',
      content: `Under applicable law you have rights to: access your data; correct inaccurate data; request deletion; object to processing; and receive your data in a portable format. Submit requests to privacy@eshop.com.`,
    },
    {
      title: '7. Security',
      content: `We implement industry-standard security measures including SSL encryption, access controls, and regular security audits. However, no method of transmission over the internet is 100% secure.`,
    },
    {
      title: '8. Children\'s Privacy',
      content: `Our platform is not directed to children under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.`,
    },
    {
      title: '9. International Transfers',
      content: `Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable laws.`,
    },
    {
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy periodically. We will notify you of significant changes via email or prominent notice on the platform. The date at the top of this page indicates the most recent revision.`,
    },
    {
      title: '11. Contact Us',
      content: `For privacy-related questions or to exercise your rights, contact our Data Protection Officer at privacy@eshop.com or write to us at 123 Commerce St, Mumbai 400001.`,
    },
  ];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-muted-foreground">Last updated: February 2026</p>

      <p className="mb-8 text-muted-foreground leading-relaxed">
        At E-Shop, your privacy is important to us. This policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform.
      </p>

      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="mb-2 text-xl font-semibold">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.content}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border p-5 text-sm text-muted-foreground">
        For the full terms governing your use of E-Shop, please see our{' '}
        <Link href={APP_ROUTES.TERMS} className="text-primary hover:underline">
          Terms of Service
        </Link>
        .
      </div>
    </div>
  );
}
