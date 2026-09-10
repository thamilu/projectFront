import React from 'react';
import { render, screen } from '@testing-library/react';
import { SellerBenefitsSection } from '@/features/seller/components/SellerBenefitsSection';

describe('SellerBenefitsSection Component', () => {
  it('renders section title and all benefits', () => {
    render(<SellerBenefitsSection />);

    expect(
      screen.getByRole('heading', { name: /Everything You Need To Grow Your Business/i, level: 2 })
    ).toBeInTheDocument();

    const benefitsList = screen.getByRole('list', { name: /Seller benefits/i });
    expect(benefitsList).toBeInTheDocument();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(6);
  });

  it('renders each benefit card with expected title and description', () => {
    render(<SellerBenefitsSection />);

    expect(screen.getByRole('heading', { name: /Build Your Own Store/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/Create a customized storefront to showcase your unique brand/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Own Your Customers/i, level: 3 })).toBeInTheDocument();
    expect(
      screen.getByText(/Connect directly, build loyalty, and own your customer data/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /Analytics Dashboard/i, level: 3 })
    ).toBeInTheDocument();
    expect(screen.getByText(/Track sales performance, visitor insights, and grow your store/i)).toBeInTheDocument();
  });
});

