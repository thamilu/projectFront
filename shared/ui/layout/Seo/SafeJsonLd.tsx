import React from 'react';
import { headers } from 'next/headers';

interface SafeJsonLdProps {
  data: unknown;
}

export default async function SafeJsonLd({ data }: SafeJsonLdProps) {
  const h = await headers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nonce = (h as any).get ? (h as any).get('x-csp-nonce') : undefined;

  return (
    <script
      type="application/ld+json"
       
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      {...(nonce ? { nonce } : {})}
    />
  );
}
