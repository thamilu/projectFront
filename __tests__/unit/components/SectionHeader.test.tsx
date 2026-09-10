import React from 'react';
import { render, screen } from '@testing-library/react';
import { SectionHeader } from '@/shared/ui/molecules/SectionHeader';

describe('SectionHeader Component - Functional Tests', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Spy on console.warn and console.error to check for defensive warnings
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Force NODE_ENV to development for validation warnings tests
    (process.env as any).NODE_ENV = 'development';
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    (process.env as any).NODE_ENV = originalEnv;
  });

  it('renders correctly with required props (title, iconName, id)', () => {
    render(<SectionHeader iconName="FileText" title="Tax Section" id="tax-header" />);

    // Check wrapper has correct id and testid
    const wrapper = screen.getByTestId('section-header');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute('id', 'tax-header');

    // Check heading exists and has correct text
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Tax Section');
    expect(heading).toHaveClass('text-style-section-label');

    // Check that we rendered the icon (Lucide SVG will have aria-hidden)
    const icon = wrapper.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports custom headingLevel props (h2, h3, h4)', () => {
    const { rerender } = render(
      <SectionHeader iconName="User" title="Profile" id="header" headingLevel="h2" />
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

    rerender(<SectionHeader iconName="User" title="Profile" id="header" headingLevel="h4" />);
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
  });

  it('returns null and warns in development when title is empty or whitespace', () => {
    // Empty title
    const { container: container1 } = render(
      <SectionHeader iconName="User" title="" id="header" />
    );
    expect(container1.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('The "title" prop was empty or whitespace-only');

    warnSpy.mockClear();

    // Whitespace title
    const { container: container2 } = render(
      <SectionHeader iconName="User" title="   " id="header" />
    );
    expect(container2.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('does not warn in production when title is empty', () => {
    (process.env as any).NODE_ENV = 'production';
    const { container } = render(
      <SectionHeader iconName="User" title="" id="header" />
    );
    expect(container.firstChild).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('errors in development when id is empty or whitespace', () => {
    render(<SectionHeader iconName="User" title="Valid Title" id="" />);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain('The "id" prop must be a non-empty string');

    errorSpy.mockClear();

    render(<SectionHeader iconName="User" title="Valid Title" id="   " />);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('forwards custom data-testid and custom className', () => {
    render(
      <SectionHeader
        iconName="FileText"
        title="Custom Header"
        id="custom-id"
        data-testid="my-custom-header"
        className="mt-4 mb-2"
      />
    );
    const wrapper = screen.getByTestId('my-custom-header');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('mt-4');
    expect(wrapper).toHaveClass('mb-2');
  });

  it('applies tabIndex and scroll targeting properties', () => {
    render(
      <SectionHeader
        iconName="FileText"
        title="Scroll Anchor"
        id="anchor-id"
        tabIndex={-1}
      />
    );
    const wrapper = screen.getByTestId('section-header');
    expect(wrapper).toHaveAttribute('tabindex', '-1');
  });

  it('renders the icon with dynamic size configurations', () => {
    const { container, rerender } = render(
      <SectionHeader iconName="FileText" title="Title" id="id" iconSize="sm" />
    );
    // Standard sm size is 16px
    let svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');

    rerender(<SectionHeader iconName="FileText" title="Title" id="id" iconSize="lg" />);
    svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });
});
