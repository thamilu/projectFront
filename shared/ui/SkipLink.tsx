import React from 'react';

export function SkipLink(): React.JSX.Element {
  return (
    <a
      href="#main-content"
      className={[
        'sr-only focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2',
        'focus:rounded-md focus:shadow-lg focus:outline-none',
        'focus:ring-ring focus:ring-2 focus:ring-offset-2',
      ].join(' ')}
    >
      Skip to main content
    </a>
  );
}
