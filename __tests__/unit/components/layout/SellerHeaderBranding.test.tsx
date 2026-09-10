import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SellerHeaderBranding } from '@/features/seller/components/layout/SellerHeaderBranding';

describe('SellerHeaderBranding Component', () => {
  const defaultProps = {
    isOnboarding: false,
    isWizardFlow: false,
    onExitClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should define correct displayName and be a named export only', () => {
    expect(SellerHeaderBranding.displayName).toBe('SellerHeaderBranding');
  });

  it('should render brand logo and seller center label by default', () => {
    render(<SellerHeaderBranding {...defaultProps} />);
    
    const logoLink = screen.getByRole('link', { name: 'eShop home' });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
    
    expect(screen.getByText('Seller Center')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Back to Marketplace/i })).not.toBeInTheDocument();
  });

  it('should render separators with aria-hidden="true"', () => {
    const { container } = render(<SellerHeaderBranding {...defaultProps} />);
    const separators = container.querySelectorAll('.w-px');
    
    expect(separators.length).toBeGreaterThan(0);
    separators.forEach((sep) => {
      expect(sep).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('should render exit button during onboarding (non-wizard)', () => {
    render(<SellerHeaderBranding {...defaultProps} isOnboarding={true} isWizardFlow={false} />);
    
    const exitBtn = screen.getByRole('button', { name: 'Exit — Back to Marketplace' });
    expect(exitBtn).toBeInTheDocument();
    
    fireEvent.click(exitBtn);
    expect(defaultProps.onExitClick).toHaveBeenCalledTimes(1);
  });

  it('should hide ArrowLeft icon inside exit button from screen readers', () => {
    const { container } = render(<SellerHeaderBranding {...defaultProps} isOnboarding={true} isWizardFlow={false} />);
    const arrowIcon = container.querySelector('svg');
    
    expect(arrowIcon).toBeInTheDocument();
    expect(arrowIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('should NOT render exit button when isWizardFlow is true', () => {
    render(<SellerHeaderBranding {...defaultProps} isOnboarding={true} isWizardFlow={true} />);
    expect(screen.queryByRole('button', { name: 'Exit — Back to Marketplace' })).not.toBeInTheDocument();
  });

  it('should intercept logo click during onboarding and call onExitClick', () => {
    render(<SellerHeaderBranding {...defaultProps} isOnboarding={true} />);
    const logoLink = screen.getByRole('link', { name: 'eShop home' });
    
    const clickEvent = fireEvent.click(logoLink);
    // clickEvent will be false if preventDefault was called, which we expect
    expect(clickEvent).toBe(false);
    expect(defaultProps.onExitClick).toHaveBeenCalledTimes(1);
  });

  it('should NOT intercept logo click when NOT during onboarding', () => {
    render(<SellerHeaderBranding {...defaultProps} isOnboarding={false} />);
    const logoLink = screen.getByRole('link', { name: 'eShop home' });
    
    const clickEvent = fireEvent.click(logoLink);
    // clickEvent will be true (normal navigation behavior) since preventDefault is not called
    expect(clickEvent).toBe(true);
    expect(defaultProps.onExitClick).not.toHaveBeenCalled();
  });
});
