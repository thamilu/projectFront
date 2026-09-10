import type { Metadata } from 'next';
import { HomePage } from '@/features/home/components/HomePage';
import { generateHomeMetadata } from '@/shared/utils';

/**
 * Home Page Route
 *
 * Server Component that renders the home page.
 */
export const metadata: Metadata = generateHomeMetadata();

export default function Page() {
  return <HomePage />;
}
