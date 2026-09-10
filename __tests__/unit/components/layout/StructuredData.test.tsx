import React from 'react';
import { render } from '@testing-library/react';
import StructuredData from '@/shared/ui/layout/Seo/StructuredData';

describe('StructuredData Component', () => {
  it('renders JSON-LD script tag with structured data', () => {
    const { container } = render(<StructuredData nonce="test-nonce" />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).toBeInTheDocument();
    expect(script).toHaveAttribute('nonce', 'test-nonce');

    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content['@context']).toBe('https://schema.org');
    expect(content['@type']).toBe('WebSite');
  });
});
