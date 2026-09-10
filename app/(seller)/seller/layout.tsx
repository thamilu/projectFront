import { Metadata } from 'next';
import { ReactNode } from 'react';
import { SellerLayoutClient } from './SellerLayoutClient';
import { SellerGuard } from '@/features/seller/components/SellerGuard';

/**
 * Metadata for seller dashboard pages
 */
export const metadata: Metadata = {
  title: {
    template: '%s | Seller Dashboard',
    default: 'Seller Dashboard',
  },
  description: 'Manage your products, orders, and customers on eShop',
  robots: {
    index: false, // Don't index seller dashboard
    follow: false,
  },
};

interface SellerLayoutProps {
  children: ReactNode;
}

/**
 * Seller Layout (Server Component)
 *
 * Root layout for all seller dashboard pages.
 * - Renders static HTML shell on server for better performance
 * - Delegates client-side interactivity to SellerLayoutClient
 * - Protects all routes with SellerGuard authentication
 * - Provides consistent header, sidebar, and navigation
 *
 * @param {ReactNode} children - Child pages/components to render
 * @returns {JSX.Element} Seller layout wrapper
 *
 * @example
 * // Automatically wraps all pages in app/seller/*
 * // app/seller/dashboard/page.tsx
 * export default function DashboardPage() {
 *   return <div>Dashboard Content</div>;
 * }
 */
export default function SellerLayout({ children }: SellerLayoutProps) {
  return (
    <SellerLayoutClient>
      <SellerGuard>{children}</SellerGuard>
    </SellerLayoutClient>
  );
}
