"use client";

import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import React from 'react';

// Compatibility wrapper: enable legacyBehavior globally to avoid
// runtime crashes caused by mixed <Link> + <a> patterns during dev.
// TODO: remove after migrating all instances to the new Link API.
export default function Link(props: NextLinkProps) {
  // Force legacyBehavior to true to accept <a> children.
  // Preserve any provided prop values.
  return <NextLink {...props} legacyBehavior />;
}

// Re-export types for convenience
export type LinkProps = NextLinkProps;
