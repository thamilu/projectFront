import { Fragment } from 'react';
import { getDomainConfigs } from '@/core/config/dns-prefetch';

export function DomainHints() {
  const domainConfigs = getDomainConfigs();

  return (
    <>
      {domainConfigs.map(({ href, preconnect, crossOrigin }) => (
        <Fragment key={href}>
          {preconnect && href && (
            <link rel="preconnect" href={href} {...(crossOrigin ? { crossOrigin } : {})} />
          )}
          {href && <link rel="dns-prefetch" href={href} />}
        </Fragment>
      ))}
    </>
  );
}
