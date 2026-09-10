import React from 'react';

interface SafeJsonLdProps {
  data: unknown;
  nonce?: string;
}

export default function SafeJsonLd({ data, nonce }: SafeJsonLdProps) {
  // JSON.stringify does not escape "</script>" (or "<!--"), so a value that
  // ever contains user-generated text (e.g. a product description folded
  // into structured data) could break out of the script tag. Escaping "<"
  // is safe for JSON-LD — it's never a meaningful character in JSON output —
  // and is the standard mitigation for this exact class of injection.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
      {...(nonce ? { nonce } : {})}
    />
  );
}
