import React from 'react';
import { siteConfig } from '@/core/config/site';
import SafeJsonLd from './SafeJsonLd';

interface StructuredDataProps {
  nonce?: string;
}

export default function StructuredData({ nonce }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org' as const,
    '@type': 'WebSite' as const,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction' as const,
      target: {
        '@type': 'EntryPoint' as const,
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <SafeJsonLd data={structuredData} nonce={nonce} />;
}
