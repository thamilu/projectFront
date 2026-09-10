import { env } from '@/env';

export interface DomainConfig {
  href: string;
  preconnect: boolean; // true = preconnect, false = dns-prefetch only
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/**
 * Returns a list of domain configs to preconnect or prefetch.
 */
export function getDomainConfigs(): DomainConfig[] {
  const configs: DomainConfig[] = [
    { href: 'https://fonts.googleapis.com', preconnect: true, crossOrigin: 'anonymous' },
    { href: 'https://fonts.gstatic.com', preconnect: true, crossOrigin: 'anonymous' },
    { href: 'https://res.cloudinary.com', preconnect: false },
    { href: 'https://lh3.googleusercontent.com', preconnect: false },
  ];

  const backendUrl = env.BACKEND_API_URL || env.NEXT_PUBLIC_API_URL;
  if (backendUrl) {
    try {
      configs.push({ href: new URL(backendUrl).origin, preconnect: true });
    } catch {
      // Ignore invalid URL
    }
  }

  return configs;
}
